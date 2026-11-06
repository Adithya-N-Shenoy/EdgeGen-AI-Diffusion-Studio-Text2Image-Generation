import { BackendStatus, GenerationJob, GenerationRequest } from '../types';

const STORAGE_KEY_BACKEND_URL = 'edgegen_custom_backend_url';

export function normalizeBackendUrl(url: string | null | undefined): string {
  if (!url || !url.trim()) return '/api';
  let clean = url.trim();
  clean = clean.replace(/\/+$/, '');
  clean = clean.replace(/\/api\/health$/, '');
  clean = clean.replace(/\/api\/models\/status$/, '');
  clean = clean.replace(/\/api\/generate$/, '');
  clean = clean.replace(/\/api$/, '');
  return clean || '/api';
}

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_BACKEND_URL);
    if (saved && saved.trim()) {
      return normalizeBackendUrl(saved);
    }
  }
  return '/api';
};

export const setApiBaseUrl = (url: string | null) => {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      const normalized = normalizeBackendUrl(url);
      localStorage.setItem(STORAGE_KEY_BACKEND_URL, normalized);
      // Sync with server-side proxy
      fetch('/api/backend/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized }),
      }).catch(() => {});
    } else {
      localStorage.removeItem(STORAGE_KEY_BACKEND_URL);
      fetch('/api/backend/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: null }),
      }).catch(() => {});
    }
  }
};

function getCommonHeaders(customBackend?: string): Record<string, string> {
  const backend = customBackend || getApiBaseUrl();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };
  if (backend !== '/api') {
    headers['X-Edgegen-Backend'] = backend;
  }
  return headers;
}

export async function checkBackendHealth(
  candidateUrl?: string
): Promise<{ online: boolean; data?: any; error?: string; viaProxy?: boolean }> {
  const target = normalizeBackendUrl(candidateUrl || getApiBaseUrl());

  // 1. If target is default local /api, query local health directly
  if (target === '/api') {
    try {
      const res = await fetch('/api/health', { headers: getCommonHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const online = data.status === 'healthy' && data.engine_ready === true;
      return { online, data, viaProxy: false };
    } catch (e: any) {
      return { online: false, error: e.message || 'Offline' };
    }
  }

  // 2. First configure the server-side proxy to check the target
  let proxyConfigResult: any = null;
  try {
    const configRes = await fetch('/api/backend/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: target }),
    });
    proxyConfigResult = await configRes.json();
  } catch {
    // ignore
  }

  // 3. Try direct browser request to target /api/health with ngrok bypass
  const directUrl = `${target}/api/health`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const directRes = await fetch(directUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });
    clearTimeout(timeoutId);

    if (directRes.ok) {
      const data = await directRes.json();
      const isHealthy =
        (data.status === 'healthy' || data.status === 'ok') &&
        (data.engine_ready !== false);
      return { online: isHealthy, data, viaProxy: false };
    }
  } catch (directErr: any) {
    // Direct browser fetch failed (e.g. CORS preflight blocked in iframe, ngrok interstitial, or mixed content)
    // Fall back to server-side proxy
    if (proxyConfigResult && proxyConfigResult.success && proxyConfigResult.data) {
      const isHealthy =
        (proxyConfigResult.data.status === 'healthy' || proxyConfigResult.data.status === 'ok') &&
        (proxyConfigResult.data.engine_ready !== false);
      return { online: isHealthy, data: proxyConfigResult.data, viaProxy: true };
    }

    // Try explicit proxy health call
    try {
      const proxyRes = await fetch('/api/health', {
        headers: {
          'Accept': 'application/json',
          'X-Edgegen-Backend': target,
        },
      });
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        const isHealthy =
          (proxyData.status === 'healthy' || proxyData.status === 'ok') &&
          (proxyData.engine_ready !== false);
        return { online: isHealthy, data: proxyData, viaProxy: true };
      }
    } catch {
      // ignore
    }

    const errorMsg =
      directErr.name === 'AbortError'
        ? `Connection to ${directUrl} timed out.`
        : directErr.message === 'Failed to fetch'
        ? `Browser blocked direct request to ${target} (CORS or network policy). Use the server-side proxy.`
        : directErr.message;

    return { online: false, error: errorMsg };
  }

  // Fallback check on proxy config result
  if (proxyConfigResult && proxyConfigResult.success) {
    return { online: true, data: proxyConfigResult.data, viaProxy: true };
  }

  return { online: false, error: proxyConfigResult?.detail || 'Inference engine is not responding' };
}

export async function fetchModelStatus(): Promise<BackendStatus> {
  const target = getApiBaseUrl();

  const tryEndpoints = target === '/api'
    ? ['/api/models/status']
    : [`${target}/api/models/status`, '/api/models/status'];

  for (const ep of tryEndpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(ep, {
        signal: controller.signal,
        headers: getCommonHeaders(target),
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        return {
          online: data.online ?? true,
          engine: data.engine || 'SD-Turbo Distilled Diffusion',
          model: data.model || 'stabilityai/sd-turbo',
          device: data.device || 'cuda',
          precision: data.precision || 'fp16',
          vram_allocated_mb: data.vram_allocated_mb ?? 0,
          memory_saving_enabled: data.memory_saving_enabled ?? true,
          cv_pipeline_ready: data.cv_pipeline_ready ?? true,
          active_jobs: data.active_jobs ?? 0,
          queue_length: data.queue_length ?? 0,
          api_version: data.api_version || '1.0.0',
          hardware_summary: data.hardware_summary || 'Remote GPU Engine Connected',
        };
      }
    } catch {
      // try next fallback (e.g. proxy)
    }
  }

  return {
    online: false,
    engine: 'SD-Turbo Distilled Diffusion',
    model: 'stabilityai/sd-turbo',
    device: 'unknown',
    precision: 'fp16',
    vram_allocated_mb: 0,
    memory_saving_enabled: true,
    cv_pipeline_ready: false,
    active_jobs: 0,
    queue_length: 0,
    api_version: '1.0.0',
    hardware_summary: 'Inference backend unreachable. Run backend locally or configure a remote GPU server.',
  };
}

export async function submitGeneration(req: GenerationRequest): Promise<GenerationJob> {
  const target = getApiBaseUrl();

  const endpoints = target === '/api'
    ? ['/api/generate']
    : [`${target}/api/generate`, '/api/generate'];

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...getCommonHeaders(target),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        let errMessage = `Generation failed (${res.status})`;
        try {
          const errJson = await res.json();
          if (errJson.detail)
            errMessage =
              typeof errJson.detail === 'string'
                ? errJson.detail
                : JSON.stringify(errJson.detail);
          else if (errJson.message) errMessage = errJson.message;
        } catch {
          // ignore
        }
        throw new Error(errMessage);
      }

      const job: GenerationJob = await res.json();
      return job;
    } catch (err: any) {
      lastError = err;
      // If direct fetch threw network/CORS error, loop will try proxy endpoint
    }
  }

  throw lastError || new Error('Failed to generate image. Please check inference engine connection.');
}

export async function pollJobStatus(jobId: string): Promise<GenerationJob> {
  const target = getApiBaseUrl();
  const endpoints = target === '/api'
    ? [`/api/generate/${encodeURIComponent(jobId)}`]
    : [`${target}/api/generate/${encodeURIComponent(jobId)}`, `/api/generate/${encodeURIComponent(jobId)}`];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        headers: getCommonHeaders(target),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // try next
    }
  }

  throw new Error('Failed to poll generation status.');
}

export async function downloadImageAs(
  imageUrl: string,
  filename: string,
  format: 'png' | 'jpg'
): Promise<void> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image for download'));
      img.src = imageUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    if (format === 'jpg') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);

    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'png' ? undefined : 0.95;

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          throw new Error('Could not create image blob');
        }
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${filename}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      },
      mimeType,
      quality
    );
  } catch {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${filename}.${format}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
