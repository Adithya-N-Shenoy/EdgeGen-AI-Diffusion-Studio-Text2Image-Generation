import type { IncomingMessage, ServerResponse } from 'http';
import { COLAB_NOTEBOOK_DATA } from '../constants/notebook';

interface Job {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  prompt: string;
  aspect_ratio: string;
  style: string;
  image_url?: string;
  latency_sec?: number;
  created_at: string;
  error?: string;
}

const jobsDb = new Map<string, Job>();

// Active configured remote backend URL in memory
let configuredRemoteBackendUrl: string | null =
  process.env.COLAB_BACKEND_URL || process.env.BACKEND_URL || null;

export function normalizeTargetUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) return null;
  let clean = rawUrl.trim().replace(/^["']|["']$/g, '');
  clean = clean.replace(/\/+$/, '');
  clean = clean.replace(/\/api\/health$/, '');
  clean = clean.replace(/\/api\/models\/status$/, '');
  clean = clean.replace(/\/api\/generate$/, '');
  clean = clean.replace(/\/api$/, '');
  return clean || null;
}

export function getActiveBackendUrl(): string | null {
  return (
    normalizeTargetUrl(configuredRemoteBackendUrl) ||
    normalizeTargetUrl(process.env.COLAB_BACKEND_URL) ||
    normalizeTargetUrl(process.env.BACKEND_URL) ||
    null
  );
}

export function isValidProxyTarget(targetUrl: string): { valid: boolean; reason?: string } {
  try {
    const parsed = new URL(targetUrl);
    const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

    // Must be HTTPS unless local development
    if (parsed.protocol !== 'https:' && !isLocalhost) {
      return { valid: false, reason: 'Target URL must use secure HTTPS protocol.' };
    }

    const host = parsed.hostname.toLowerCase();
    const blockedPatterns = [
      '169.254.', // Cloud instance metadata IP
      'metadata.google.internal',
      'metadata.internal',
      '10.', // RFC 1918 private
      '192.168.',
      '172.16.', '172.17.', '172.18.', '172.19.', '172.20.', '172.21.',
      '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', '172.27.',
      '172.28.', '172.29.', '172.30.', '172.31.',
      '0.0.0.0',
    ];

    if (!isLocalhost && blockedPatterns.some((p) => host === p || host.startsWith(p))) {
      return {
        valid: false,
        reason: 'Access to private internal network addresses is restricted (SSRF protection).',
      };
    }

    if (parsed.port && !['80', '443', '8000', '8080', '7860'].includes(parsed.port)) {
      return { valid: false, reason: 'Specified port is not in allowed inference ports list.' };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Invalid URL format.' };
  }
}

async function forwardRequestToRemote(
  remoteBaseUrl: string,
  pathname: string,
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const normalizedBase = normalizeTargetUrl(remoteBaseUrl);
  if (!normalizedBase) return false;

  const targetValidation = isValidProxyTarget(normalizedBase);
  if (!targetValidation.valid) {
    res.writeHead(400, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ error: targetValidation.reason || 'Invalid target destination' }));
    return true;
  }

  // Ensure path starts with /api if not already
  const apiPath = pathname.startsWith('/api') ? pathname : `/api${pathname}`;
  const targetFullUrl = `${normalizedBase}${apiPath}`;

  try {
    let bodyData: any = undefined;
    if (req.method === 'POST') {
      const buffers: Uint8Array[] = [];
      for await (const chunk of req) {
        buffers.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      bodyData = Buffer.concat(buffers).toString('utf-8');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000); // 90s timeout for diffusion

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': req.headers['content-type'] || 'application/json',
      'ngrok-skip-browser-warning': 'true',
      'User-Agent': 'EdgeGen-AI-Proxy/1.0',
    };

    const forwardRes = await fetch(targetFullUrl, {
      method: req.method,
      headers,
      body: bodyData,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const responseText = await forwardRes.text();

    res.writeHead(forwardRes.status, {
      'Content-Type': forwardRes.headers.get('content-type') || 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, ngrok-skip-browser-warning, X-Edgegen-Backend',
    });
    res.end(responseText);
    return true;
  } catch (err: any) {
    res.writeHead(502, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(
      JSON.stringify({
        detail: 'Image generation is temporarily unavailable. Please try again later.',
        error: err.message,
        online: false,
      })
    );
    return true;
  }
}

export async function handleApiRoute(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Global CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning, X-Edgegen-Backend');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Explicit Notebook Download routes
  if (
    pathname === '/api/download-colab-notebook' ||
    pathname === '/edgegen_colab_gpu_server.ipynb' ||
    pathname === '/api/edgegen_colab_gpu_server.ipynb'
  ) {
    const notebookJson = JSON.stringify(COLAB_NOTEBOOK_DATA, null, 2);
    res.writeHead(200, {
      'Content-Type': 'application/x-ipynb+json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="edgegen_colab_gpu_server.ipynb"',
      'Content-Length': Buffer.byteLength(notebookJson, 'utf8'),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(notebookJson);
    return;
  }

  // 2. Configure Remote Backend Target Endpoint
  if (pathname === '/api/backend/configure' && req.method === 'POST') {
    const buffers: Uint8Array[] = [];
    for await (const chunk of req) {
      buffers.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const bodyStr = Buffer.concat(buffers).toString('utf-8');
    try {
      const parsed = JSON.parse(bodyStr || '{}');
      const targetUrl = normalizeTargetUrl(parsed.url);

      if (!targetUrl) {
        configuredRemoteBackendUrl = null;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Reset to local proxy' }));
        return;
      }

      const validation = isValidProxyTarget(targetUrl);
      if (!validation.valid) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, detail: validation.reason }));
        return;
      }

      // Test connectivity to target /api/health with ngrok-skip-browser-warning
      const testController = new AbortController();
      const testTimeout = setTimeout(() => testController.abort(), 8000);
      const testRes = await fetch(`${targetUrl}/api/health`, {
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        signal: testController.signal,
      });
      clearTimeout(testTimeout);

      if (!testRes.ok) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: false,
            detail: `Backend at ${targetUrl}/api/health responded with HTTP ${testRes.status}`,
          })
        );
        return;
      }

      const healthData = await testRes.json();
      configuredRemoteBackendUrl = targetUrl;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          url: targetUrl,
          status: 'healthy',
          engine_ready: healthData.engine_ready ?? true,
          data: healthData,
        })
      );
      return;
    } catch (e: any) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          detail: `Cannot connect to backend: ${e.message || 'Request timed out'}`,
        })
      );
      return;
    }
  }

  // 3. Check for dynamic remote backend (from header, configured state, or COLAB_BACKEND_URL)
  const headerTarget = normalizeTargetUrl(req.headers['x-edgegen-backend'] as string);
  const activeTarget = headerTarget || getActiveBackendUrl();

  if (activeTarget) {
    const forwarded = await forwardRequestToRemote(activeTarget, pathname, req, res);
    if (forwarded) return;
  }

  // 4. Fallback Local /api/health
  if (pathname === '/api/health') {
    const currentTarget = getActiveBackendUrl();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: currentTarget ? 'connecting' : 'offline',
        service: 'EdgeGen AI API Proxy',
        fastapi_connected: false,
        configured_remote: currentTarget,
        engine_ready: false,
        message: 'Image generation is temporarily unavailable. Please try again later.',
        timestamp: Date.now(),
      })
    );
    return;
  }

  // 5. Fallback Local /api/models/status
  if (pathname === '/api/models/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        online: false,
        engine: 'SD-Turbo Distilled Diffusion',
        model: 'stabilityai/sd-turbo',
        device: 'cuda',
        precision: 'fp16',
        vram_allocated_mb: 0,
        memory_saving_enabled: true,
        cv_pipeline_ready: false,
        active_jobs: 0,
        queue_length: 0,
        api_version: '1.0.0',
        hardware_summary:
          'Image generation is temporarily unavailable. Please try again later.',
      })
    );
    return;
  }

  // 6. Fallback Local /api/about
  if (pathname === '/api/about') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        project: 'EdgeGen AI',
        problem_id: 'P3',
        problem_title: 'Resource-Efficient Text-to-Image Generation for Mobile Devices',
        models: {
          optimized: 'stabilityai/sd-turbo',
          baseline: 'runwayml/stable-diffusion-v1-5',
        },
        optimizations: [
          'Reduced-precision FP16 inference',
          'Few-step adversarial diffusion distillation (1-4 steps)',
          'Memory-aware VAE slicing and attention slicing',
          'Classical computer vision post-processing (Lanczos, CLAHE, Bilateral filtering)',
        ],
        datasets: [
          { name: 'MS COCO 2017', url: 'https://cocodataset.org/' },
          { name: 'Denotation Graph', url: 'https://shannon.cs.illinois.edu/DenotationGraph/' },
          { name: 'Hugging Face Datasets', url: 'https://huggingface.co/datasets' },
        ],
      })
    );
    return;
  }

  // 7. Fallback Local /api/generate
  if (pathname === '/api/generate' && req.method === 'POST') {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        detail: 'Image generation is temporarily unavailable. Please try again later.',
      })
    );
    return;
  }

  // 8. Fallback /api/generate/:jobId
  if (pathname.startsWith('/api/generate/')) {
    const jobId = pathname.replace('/api/generate/', '');
    const job = jobsDb.get(jobId);
    if (!job) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ detail: 'Job not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(job));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ detail: 'Endpoint not found' }));
}
