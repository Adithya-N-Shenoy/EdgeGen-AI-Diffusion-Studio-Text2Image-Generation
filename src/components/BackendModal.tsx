import React, { useState } from 'react';
import { 
  X, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  Play, 
  Terminal, 
  Cpu, 
  Zap,
  RefreshCw,
  Download,
  ShieldCheck,
  Clock,
  Info
} from 'lucide-react';
import { BackendStatus } from '../types';
import { getApiBaseUrl, setApiBaseUrl, checkBackendHealth } from '../services/api';
import { COLAB_NOTEBOOK_DATA } from '../constants/notebook';

interface BackendModalProps {
  isOpen: boolean;
  onClose: () => void;
  backendStatus: BackendStatus | null;
  onRefreshStatus: () => void;
}

export const BackendModal: React.FC<BackendModalProps> = ({
  isOpen,
  onClose,
  backendStatus,
  onRefreshStatus,
}) => {
  const [customUrl, setCustomUrl] = useState(() => getApiBaseUrl() === '/api' ? '' : getApiBaseUrl());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'connect' | 'colab' | 'local'>('status');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleDownloadNotebook = () => {
    try {
      const jsonStr = JSON.stringify(COLAB_NOTEBOOK_DATA, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/x-ipynb+json;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'edgegen_colab_gpu_server.ipynb';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.location.href = '/api/download-colab-notebook';
    }
  };

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const targetUrl = customUrl.trim() || '/api';
      const res = await checkBackendHealth(targetUrl);
      if (res.online) {
        setApiBaseUrl(targetUrl === '/api' ? null : targetUrl);
        setTestResult({
          success: true,
          message: res.viaProxy
            ? 'Verified & Connected to Colab GPU backend (via secure proxy)!'
            : 'Verified & Connected directly to Colab GPU backend!',
        });
        onRefreshStatus();
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Server unreachable or not responding.',
        });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleResetToDefault = () => {
    setCustomUrl('');
    setApiBaseUrl(null);
    setTestResult(null);
    onRefreshStatus();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const completeColabScript = `# ==============================================================================
# EDGEGEN AI — LIVE SD-TURBO GPU INFERENCE SERVER (GOOGLE COLAB)
# Problem Statement: P3 - Resource-Efficient Text-to-Image Generation
# Model: stabilityai/sd-turbo (Few-Step Distilled Diffusion in FP16)
# ==============================================================================

# 1. Install dependencies
!pip install -q fastapi "uvicorn[standard]" diffusers transformers accelerate safetensors opencv-python-headless pillow pyngrok

import os, sys, time, io, base64, uuid, threading, getpass
from typing import Optional, Dict, Any
import torch
from PIL import Image
import numpy as np
import cv2
from diffusers import AutoPipelineForText2Image
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
from pyngrok import ngrok

# 2. Check GPU acceleration
if not torch.cuda.is_available():
    raise RuntimeError("CUDA GPU not detected! Go to Runtime > Change runtime type > Select T4 GPU")

gpu_name = torch.cuda.get_device_name(0)
print(f"🎮 Active GPU: {gpu_name} (T4 GPU)")

# 3. Load stabilityai/sd-turbo with FP16 and memory optimizations
print("📦 Loading SD-Turbo model in FP16...")
pipeline = AutoPipelineForText2Image.from_pretrained(
    "stabilityai/sd-turbo",
    torch_dtype=torch.float16,
    variant="fp16",
    safety_checker=None
).to("cuda")
pipeline.enable_vae_slicing()
pipeline.enable_attention_slicing(1)
print("✨ SD-Turbo loaded successfully!")

# 4. Classical Computer Vision Enhancer
class ClassicalCVEnhancer:
    def __init__(self):
        self.clahe = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8))

    def enhance(self, image: Image.Image, aspect_ratio: str = "1:1"):
        targets = {"1:1": (512, 512), "3:4": (480, 640), "4:3": (640, 480), "16:9": (704, 396)}
        tw, th = targets.get(aspect_ratio, (512, 512))
        ow, oh = image.size
        tr, or_ratio = tw / th, ow / oh
        if or_ratio > tr:
            nw = int(oh * tr)
            cropped = image.crop(((ow - nw) // 2, 0, (ow - nw) // 2 + nw, oh))
        else:
            nh = int(ow / tr)
            cropped = image.crop((0, (oh - nh) // 2, ow, (oh - nh) // 2 + nh))
        adapted = cropped.resize((tw, th), Image.Resampling.LANCZOS)
        
        bgr = cv2.cvtColor(np.array(adapted), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        blur_pre = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        # Gray-World White Balance
        b, g, r = cv2.split(bgr.astype(np.float32))
        avg_gray = (np.mean(b) + np.mean(g) + np.mean(r)) / 3.0
        if np.mean(b) > 0 and np.mean(g) > 0 and np.mean(r) > 0:
            b = np.clip(b * (0.5 + 0.5 * (avg_gray / np.mean(b))), 0, 255)
            g = np.clip(g * (0.5 + 0.5 * (avg_gray / np.mean(g))), 0, 255)
            r = np.clip(r * (0.5 + 0.5 * (avg_gray / np.mean(r))), 0, 255)
        balanced = cv2.merge((b, g, r)).astype(np.uint8)

        # CLAHE on Luminance
        lab = cv2.cvtColor(balanced, cv2.COLOR_BGR2LAB)
        l, a_ch, b_ch = cv2.split(lab)
        contrast = cv2.cvtColor(cv2.merge((self.clahe.apply(l), a_ch, b_ch)), cv2.COLOR_LAB2BGR)
        smoothed = cv2.bilateralFilter(contrast, d=5, sigmaColor=25, sigmaSpace=25)
        if blur_pre < 400:
            smoothed = cv2.addWeighted(smoothed, 1.25, cv2.GaussianBlur(smoothed, (0, 0), 2.0), -0.25, 0)

        final_rgb = cv2.cvtColor(np.clip(smoothed, 0, 255).astype(np.uint8), cv2.COLOR_BGR2RGB)
        metrics = {"blur_laplacian_variance": round(blur_pre, 2), "contrast_std": round(float(np.std(gray)), 2)}
        return Image.fromarray(final_rgb), metrics

cv_enhancer = ClassicalCVEnhancer()

# 5. FastAPI Application & Real Diffusion Endpoints
app = FastAPI(title="EdgeGen AI Live Colab Engine")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
jobs_db: Dict[str, Dict[str, Any]] = {}

class GenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    aspect_ratio: str = Field(default="1:1")
    style: str = Field(default="auto")
    negative_prompt: Optional[str] = None
    seed: Optional[int] = None

@app.get("/api/health")
async def health():
    return {"status": "healthy", "service": "EdgeGen AI Diffusion Backend", "engine_ready": True, "timestamp": time.time()}

@app.get("/api/models/status")
async def model_status():
    vram_mb = int(torch.cuda.memory_allocated(0) / (1024 * 1024))
    return {
        "online": True, "engine": "SD-Turbo Distilled Diffusion", "model": "stabilityai/sd-turbo",
        "device": "cuda", "precision": "fp16", "vram_allocated_mb": vram_mb, "memory_saving_enabled": True,
        "cv_pipeline_ready": True, "active_jobs": 0, "queue_length": 0, "api_version": "1.0.0",
        "hardware_summary": f"{gpu_name} (FP16, VRAM: {vram_mb}MB)"
    }

def execute_inference(prompt: str, aspect_ratio: str, style: str, seed: Optional[int] = None):
    styles = {
        "photorealistic": ", photorealistic photograph, 35mm lens, natural lighting, sharp focus, 8k",
        "cinematic": ", cinematic film still, dramatic volumetric lighting, Panavision 70mm, depth of field",
        "anime": ", anime style, vibrant aesthetic, crisp lineart, Makoto Shinkai aesthetic",
        "digital_art": ", detailed digital art, ArtStation trending, concept art, vivid rendering",
        "illustration": ", refined editorial illustration, clean shapes, harmonious color palette"
    }
    enhanced = prompt + (styles.get(style, ""))
    generator = torch.Generator(device="cuda").manual_seed(seed) if seed is not None else None
    torch.cuda.empty_cache()
    start = time.time()
    with torch.inference_mode():
        raw = pipeline(prompt=enhanced, num_inference_steps=1, guidance_scale=0.0, width=512, height=512, generator=generator).images[0]
    final_img, metrics = cv_enhancer.enhance(raw, aspect_ratio)
    buf = io.BytesIO()
    final_img.save(buf, format="PNG")
    data_url = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"
    return data_url, round(time.time() - start, 2), metrics, final_img.size

@app.post("/api/generate")
async def generate(req: GenerationRequest):
    job_id = str(uuid.uuid4())
    data_url, latency, cv_metrics, (w, h) = execute_inference(req.prompt, req.aspect_ratio, req.style, req.seed)
    res = {
        "job_id": job_id, "status": "completed", "progress": 100, "message": "Image generated successfully",
        "prompt": req.prompt, "aspect_ratio": req.aspect_ratio, "style": req.style, "image_url": data_url,
        "width": w, "height": h, "latency_sec": latency, "cv_applied": True, "cv_metrics": cv_metrics,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "completed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    jobs_db[job_id] = res
    return res

@app.get("/api/generate/{job_id}")
async def get_job(job_id: str):
    return jobs_db.get(job_id, {"status": "failed", "error": "Not found"})

# 6. Secure ngrok Token & Server Launch
token = None
try:
    from google.colab import userdata
    token = userdata.get('NGROK_AUTHTOKEN')
except Exception:
    pass
if not token:
    token = os.environ.get("NGROK_AUTHTOKEN")
if not token:
    print("🔑 Enter your free ngrok token (from https://dashboard.ngrok.com/get-started/your-authtoken):")
    token = getpass.getpass("ngrok authtoken: ").strip()

ngrok.set_auth_token(token)
threading.Thread(target=lambda: uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning"), daemon=True).start()
time.sleep(2)

tunnel = ngrok.connect(8000)
public_url = tunnel.public_url.replace("http://", "https://")

print("\n" + "="*70)
print(f"🚀 EDGEGEN AI GPU INFERENCE SERVER IS READY!")
print(f"👉 COPY THIS URL:  {public_url}")
print("="*70)
print("1. In EdgeGen AI web app, click 'GPU Server' > 'Connect Remote GPU'.")
print(f"2. Paste: {public_url}")
print("3. Click 'Save & Test'. Your status indicator will turn green!")
print("="*70 + "\n")

# 7. In-Notebook Self-Test
print("🧪 Running self-test generation...")
test_url, lat, _, dims = execute_inference("A cute red panda in a bamboo forest at golden hour", "1:1", "photorealistic")
print(f"✅ Self-test generation PASSED in {lat}s! Image size: {dims[0]}x{dims[1]}")
`;

  const dockerCommand = `# Run locally with NVIDIA GPU support:
docker build -t edgegen-backend ./backend
docker run --gpus all -p 8000:8000 edgegen-backend`;

  const isOnline = backendStatus?.online;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-white">
                Inference Engine Configuration
              </h2>
              <p className="text-xs text-slate-400">
                SD-Turbo distilled diffusion backend & hardware status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/[0.06] bg-black/20 px-6 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'status'
                ? 'border-indigo-400 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Engine Status
          </button>
          <button
            onClick={() => setActiveTab('connect')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'connect'
                ? 'border-indigo-400 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Connect Remote GPU
          </button>
          <button
            onClick={() => setActiveTab('colab')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'colab'
                ? 'border-indigo-400 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Free Colab GPU Setup
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'local'
                ? 'border-indigo-400 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Local / Docker Run
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Online/Offline Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  isOnline
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                }`}
              >
                {isOnline ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-semibold text-white">
                    {isOnline ? 'GPU Inference Engine Online' : 'GPU Inference Engine Offline / Unconnected'}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {isOnline
                      ? 'SD-Turbo is loaded and ready for few-step text-to-image synthesis with classical CV post-processing.'
                      : 'The local container environment lacks PyTorch CUDA drivers. To generate live images using the distilled diffusion model, connect an external GPU server, launch via Google Colab (tab above), or run the generated FastAPI backend in /backend.'}
                  </p>
                </div>
              </div>

              {/* Hardware diagnostics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-black/30 border border-white/[0.06]">
                  <span className="text-slate-400 block mb-1">Target Model</span>
                  <span className="font-mono text-white font-medium">stabilityai/sd-turbo</span>
                </div>
                <div className="p-3 rounded-lg bg-black/30 border border-white/[0.06]">
                  <span className="text-slate-400 block mb-1">Execution Mode</span>
                  <span className="font-mono text-white font-medium">1-to-4 Step Distillation</span>
                </div>
                <div className="p-3 rounded-lg bg-black/30 border border-white/[0.06]">
                  <span className="text-slate-400 block mb-1">Detected Hardware</span>
                  <span className="font-mono text-indigo-300 font-medium uppercase">
                    {backendStatus?.device || 'CPU / Cloud Sandbox'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-black/30 border border-white/[0.06]">
                  <span className="text-slate-400 block mb-1">CV Pipeline</span>
                  <span className="font-mono text-emerald-400 font-medium">
                    Lanczos + Bilateral + CLAHE
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400 font-mono truncate max-w-[340px]">
                  Endpoint: {getApiBaseUrl()}
                </span>
                <button
                  onClick={onRefreshStatus}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Status</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'connect' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Custom FastAPI / GPU Backend URL
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  Enter your Google Colab ngrok URL (e.g., <code className="text-indigo-300 font-mono">https://xxxx.ngrok-free.app</code>), Hugging Face Space URL, or local FastAPI URL (<code className="text-indigo-300 font-mono">http://localhost:8000</code>).
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://xxxx.ngrok-free.app"
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 font-mono"
                  />
                  <button
                    onClick={handleSaveAndTest}
                    disabled={testing}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {testing ? 'Testing...' : 'Save & Test'}
                  </button>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-950/30 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {getApiBaseUrl() !== '/api' && (
                <button
                  onClick={handleResetToDefault}
                  className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                >
                  Reset to default local proxy (/api)
                </button>
              )}
            </div>
          )}

          {activeTab === 'colab' && (
            <div className="space-y-4">
              {/* Step by Step instructions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Complete Free Google Colab GPU Workflow (T4 GPU)
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadNotebook}
                      title="Download verified Jupyter Notebook v4 (.ipynb)"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-sm cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .ipynb</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(JSON.stringify(COLAB_NOTEBOOK_DATA, null, 2), 'ipynb_json')}
                      title="Copy complete Jupyter notebook JSON"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedCode === 'ipynb_json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode === 'ipynb_json' ? 'Copied JSON' : 'Copy .ipynb JSON'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(completeColabScript, 'colab')}
                      title="Copy Python script"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedCode === 'colab' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode === 'colab' ? 'Copied Script' : 'Copy Python'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06]">
                    <span className="font-bold text-indigo-400 block mb-0.5">Step 1</span>
                    <span className="text-slate-300">Open Google Colab. Set Runtime to <strong>T4 GPU</strong>.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06]">
                    <span className="font-bold text-indigo-400 block mb-0.5">Step 2</span>
                    <span className="text-slate-300">Paste code or upload the downloaded <code>.ipynb</code> file.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06]">
                    <span className="font-bold text-indigo-400 block mb-0.5">Step 3</span>
                    <span className="text-slate-300">Run the script. Securely enter your free ngrok token.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06]">
                    <span className="font-bold text-indigo-400 block mb-0.5">Step 4</span>
                    <span className="text-slate-300">Copy the <code>https://...ngrok-free.app</code> URL & paste in <strong>Connect Remote GPU</strong>.</span>
                  </div>
                </div>
              </div>

              {/* Code preview block */}
              <div className="relative">
                <div className="flex items-center justify-between text-[11px] text-slate-400 bg-black/70 px-3 py-1.5 rounded-t-xl border border-b-0 border-white/[0.08]">
                  <span>edgegen_colab_gpu_server.py (Complete Executable)</span>
                  <span className="font-mono text-emerald-400">Self-Contained · No repo upload needed</span>
                </div>
                <pre className="p-3 rounded-b-xl bg-black/60 border border-white/[0.08] text-[11px] font-mono text-slate-300 overflow-x-auto max-h-52 leading-relaxed">
                  {completeColabScript}
                </pre>
              </div>

              {/* Free Colab Limitations Banner */}
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200/90 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Important Free Google Colab Limitations:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 pl-1 leading-relaxed">
                  <li><strong className="text-white">12-Hour Session Limit:</strong> Free Colab runtimes reset after a maximum of 12 continuous hours.</li>
                  <li><strong className="text-white">Idle Timeout:</strong> If the browser tab is left inactive for 15–30 minutes, Google may disconnect the instance. Keep the tab open while testing.</li>
                  <li><strong className="text-white">GPU Compute Quota:</strong> Free T4 GPU usage has daily limits. If quota is exhausted, wait 12–24h or switch accounts.</li>
                  <li><strong className="text-white">Dynamic URL:</strong> The free ngrok tunnel URL changes when the server restarts. Simply re-paste the new URL into EdgeGen AI.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'local' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white text-xs mb-1">
                  Run FastAPI Backend Locally
                </h4>
                <p className="text-xs text-slate-400 mb-2">
                  All backend Python source code is included directly in the <code className="text-indigo-300 font-mono">/backend</code> folder.
                </p>
                <div className="relative">
                  <pre className="p-3 rounded-xl bg-black/60 border border-white/[0.08] text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                    {`# 1. Navigate to backend
cd backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start FastAPI with auto-reload
uvicorn main:app --host 0.0.0.0 --port 8000 --reload`}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(`cd backend && pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --port 8000`, 'cli')}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode === 'cli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white text-xs mb-1">
                  Docker Deployment
                </h4>
                <div className="relative">
                  <pre className="p-3 rounded-xl bg-black/60 border border-white/[0.08] text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                    {dockerCommand}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.08] bg-black/40 flex items-center justify-between text-xs text-slate-400">
          <span>Problem P3 · Resource-Efficient Diffusion</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
