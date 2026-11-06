"""
================================================================================
EDGEGEN AI — COMPLETE STANDALONE GOOGLE COLAB GPU INFERENCE SERVER (SD-TURBO)
================================================================================
Problem Statement: P3 - Resource-Efficient Text-to-Image Generation
Model: stabilityai/sd-turbo (Few-Step Distilled Diffusion, FP16, VAE Slicing)
Post-Processing: Classical Computer Vision Pipeline (Lanczos, CLAHE, Bilateral Filter)
API: FastAPI with CORS, exposing /api/health, /api/models/status, /api/generate
Tunnel: pyngrok with secure token input

Instructions:
1. Ensure Colab Runtime is set to GPU (Runtime > Change runtime type > T4 GPU).
2. Run this file: python edgegen_colab_gpu_server.py
3. Enter your free ngrok token securely when prompted (or configure Colab Secrets).
4. Copy the public ngrok URL printed at the end.
5. Paste it into the EdgeGen AI web app under 'GPU Server' > 'Connect Remote GPU'.
================================================================================
"""

import os
import sys
import time
import io
import base64
import uuid
import threading
import getpass
from typing import Optional, Dict, Any

# 1. Environment & Dependency Validation
print("🔍 Checking hardware acceleration environment...")
try:
    import torch
    if not torch.cuda.is_available():
        print("⚠️ WARNING: CUDA is NOT available in this Colab runtime!")
        print("👉 Go to: Runtime > Change runtime type > Select 'T4 GPU' > Save.")
    else:
        gpu_name = torch.cuda.get_device_name(0)
        vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        print(f"✅ GPU Detected: {gpu_name} ({vram_gb:.1f} GB VRAM)")
except ImportError:
    print("❌ PyTorch is missing. Run: pip install torch torchvision torchaudio")
    sys.exit(1)

# Import required libraries
from PIL import Image
import numpy as np

try:
    import cv2
except ImportError:
    print("Installing OpenCV...")
    os.system("pip install -q opencv-python-headless")
    import cv2

try:
    from diffusers import AutoPipelineForText2Image
except ImportError:
    print("Installing diffusers, transformers, accelerate, safetensors...")
    os.system("pip install -q diffusers transformers accelerate safetensors")
    from diffusers import AutoPipelineForText2Image

try:
    from fastapi import FastAPI, HTTPException, BackgroundTasks
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, Field
    import uvicorn
except ImportError:
    print("Installing FastAPI & Uvicorn...")
    os.system("pip install -q fastapi uvicorn[standard] pydantic")
    from fastapi import FastAPI, HTTPException, BackgroundTasks
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, Field
    import uvicorn

try:
    from pyngrok import ngrok
except ImportError:
    print("Installing pyngrok...")
    os.system("pip install -q pyngrok")
    from pyngrok import ngrok


# ==============================================================================
# 2. CLASSICAL COMPUTER VISION ENHANCEMENT PIPELINE
# ==============================================================================
class ClassicalCVEnhancer:
    """
    Automated classical computer vision enhancement pipeline:
    - Geometry-preserving aspect ratio adaptation (Lanczos)
    - Gray-World automatic white-balance
    - CLAHE contrast enhancement in LAB color space
    - Bilateral edge-preserving noise filtering
    - Conservative unsharp masking
    - Quality assessment metrics (Laplacian blur variance, brightness, contrast)
    """
    def __init__(self):
        self.clahe_clip_limit = 1.8
        self.clahe_grid_size = (8, 8)
        self.bilateral_d = 5
        self.bilateral_sigma_color = 25
        self.bilateral_sigma_space = 25

    def enhance(self, image: Image.Image, aspect_ratio: str = "1:1") -> tuple[Image.Image, dict]:
        target_dimensions = {
            "1:1": (512, 512),
            "3:4": (480, 640),
            "4:3": (640, 480),
            "16:9": (704, 396),
        }
        target_w, target_h = target_dimensions.get(aspect_ratio, (512, 512))

        # Aspect-preserving crop and Lanczos resize
        adapted_pil = self._resize_aspect_preserved(image, target_w, target_h)

        # Convert PIL (RGB) to OpenCV format (BGR)
        rgb_np = np.array(adapted_pil)
        bgr = cv2.cvtColor(rgb_np, cv2.COLOR_RGB2BGR)

        # Initial metrics
        metrics_pre = self._assess_quality(bgr)

        # White balance (Gray World)
        balanced_bgr = self._apply_gray_world(bgr)

        # CLAHE on Luminance (LAB color space L* channel)
        lab = cv2.cvtColor(balanced_bgr, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=self.clahe_clip_limit, tileGridSize=self.clahe_grid_size)
        l_clahe = clahe.apply(l)
        contrast_bgr = cv2.cvtColor(cv2.merge((l_clahe, a, b)), cv2.COLOR_LAB2BGR)

        # Bilateral edge-preserving smoothing
        smoothed_bgr = cv2.bilateralFilter(
            contrast_bgr,
            d=self.bilateral_d,
            sigmaColor=self.bilateral_sigma_color,
            sigmaSpace=self.bilateral_sigma_space
        )

        # Conservative unsharp masking if image is slightly soft
        final_bgr = smoothed_bgr
        if metrics_pre["blur_laplacian_variance"] < 400:
            gaussian = cv2.GaussianBlur(smoothed_bgr, (0, 0), sigmaX=2.0)
            final_bgr = cv2.addWeighted(smoothed_bgr, 1.25, gaussian, -0.25, 0)

        final_bgr = np.clip(final_bgr, 0, 255).astype(np.uint8)
        final_metrics = self._assess_quality(final_bgr)

        final_rgb = cv2.cvtColor(final_bgr, cv2.COLOR_BGR2RGB)
        return Image.fromarray(final_rgb), final_metrics

    def _resize_aspect_preserved(self, img: Image.Image, target_w: int, target_h: int) -> Image.Image:
        orig_w, orig_h = img.size
        target_ratio = target_w / target_h
        orig_ratio = orig_w / orig_h

        if orig_ratio > target_ratio:
            new_w = int(orig_h * target_ratio)
            left = (orig_w - new_w) // 2
            top = 0
            right = left + new_w
            bottom = orig_h
        else:
            new_h = int(orig_w / target_ratio)
            left = 0
            top = (orig_h - new_h) // 2
            right = orig_w
            bottom = top + new_h

        cropped = img.crop((left, top, right, bottom))
        return cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)

    def _apply_gray_world(self, bgr: np.ndarray) -> np.ndarray:
        b, g, r = cv2.split(bgr.astype(np.float32))
        avg_gray = (np.mean(b) + np.mean(g) + np.mean(r)) / 3.0
        if np.mean(b) > 0 and np.mean(g) > 0 and np.mean(r) > 0:
            kb = 0.5 + 0.5 * (avg_gray / np.mean(b))
            kg = 0.5 + 0.5 * (avg_gray / np.mean(g))
            kr = 0.5 + 0.5 * (avg_gray / np.mean(r))
            b = np.clip(b * kb, 0, 255)
            g = np.clip(g * kg, 0, 255)
            r = np.clip(r * kr, 0, 255)
        return cv2.merge((b, g, r)).astype(np.uint8)

    def _assess_quality(self, bgr: np.ndarray) -> dict:
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        return {
            "blur_laplacian_variance": round(laplacian_var, 2),
            "is_blurry": laplacian_var < 100.0,
            "mean_brightness": round(float(np.mean(gray)), 2),
            "contrast_std": round(float(np.std(gray)), 2),
            "color_clipping_pct": round(float(np.sum((bgr <= 2) | (bgr >= 253)) / bgr.size * 100.0), 2)
        }

    @staticmethod
    def to_data_url(image: Image.Image, format: str = "PNG") -> str:
        buffer = io.BytesIO()
        image.save(buffer, format=format)
        encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
        mime = "image/png" if format.upper() == "PNG" else "image/jpeg"
        return f"data:{mime};base64,{encoded}"


# ==============================================================================
# 3. SD-TURBO DIFFUSION INFERENCE ENGINE
# ==============================================================================
print("\n📦 Loading stabilityai/sd-turbo weights into GPU memory...")
device = "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if device == "cuda" else torch.float32

try:
    pipeline = AutoPipelineForText2Image.from_pretrained(
        "stabilityai/sd-turbo",
        torch_dtype=dtype,
        variant="fp16" if dtype == torch.float16 else None,
        safety_checker=None
    )
    if device != "cpu":
        pipeline.to(device)
    
    # Memory optimization
    if hasattr(pipeline, "enable_vae_slicing"):
        pipeline.enable_vae_slicing()
    if hasattr(pipeline, "enable_attention_slicing"):
        pipeline.enable_attention_slicing(1)

    print(f"✨ SD-Turbo successfully loaded on {device.upper()} ({dtype})!")
except Exception as e:
    print(f"❌ Failed to load SD-Turbo: {e}")
    sys.exit(1)

cv_enhancer = ClassicalCVEnhancer()


# ==============================================================================
# 4. FASTAPI BACKEND SERVER WITH EXACT API CONTRACT
# ==============================================================================
app = FastAPI(
    title="EdgeGen AI - Live Colab GPU Engine",
    description="Resource-efficient SD-Turbo text-to-image server for EdgeGen AI web app",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "ngrok-skip-browser-warning", "X-Edgegen-Backend"],
)

jobs_db: Dict[str, Dict[str, Any]] = {}

class GenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    aspect_ratio: str = Field(default="1:1")
    style: str = Field(default="auto")
    negative_prompt: Optional[str] = None
    seed: Optional[int] = None

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "EdgeGen AI Diffusion Backend",
        "engine_ready": True,
        "timestamp": time.time(),
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "None"
    }

@app.get("/api/models/status")
async def model_status():
    vram_mb = int(torch.cuda.memory_allocated(0) / (1024 * 1024)) if torch.cuda.is_available() else 0
    gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
    return {
        "online": True,
        "engine": "SD-Turbo Distilled Diffusion",
        "model": "stabilityai/sd-turbo",
        "device": device,
        "precision": "fp16" if dtype == torch.float16 else "fp32",
        "vram_allocated_mb": vram_mb,
        "memory_saving_enabled": True,
        "cv_pipeline_ready": True,
        "active_jobs": 0,
        "queue_length": 0,
        "api_version": "1.0.0",
        "hardware_summary": f"{gpu_name} (FP16 Mode, VRAM: {vram_mb}MB)"
    }

@app.get("/api/about")
async def get_about():
    return {
        "project": "EdgeGen AI",
        "problem_id": "P3",
        "model": "stabilityai/sd-turbo",
        "status": "online_colab_gpu"
    }

def run_diffusion_generation(prompt: str, aspect_ratio: str, style: str, seed: Optional[int] = None):
    # Prompt style enhancement
    enhanced = prompt
    style_suffixes = {
        "photorealistic": ", photorealistic photograph, 35mm lens, natural lighting, sharp focus, 8k",
        "cinematic": ", cinematic film still, dramatic volumetric lighting, Panavision 70mm, depth of field",
        "anime": ", anime style, vibrant aesthetic, crisp lineart, Makoto Shinkai aesthetic",
        "digital_art": ", detailed digital art, ArtStation trending, concept art, vivid rendering",
        "illustration": ", refined editorial illustration, clean shapes, harmonious color palette"
    }
    if style in style_suffixes:
        enhanced += style_suffixes[style]

    generator = None
    if seed is not None:
        generator = torch.Generator(device=device).manual_seed(seed)

    if device == "cuda":
        torch.cuda.empty_cache()

    start_time = time.time()
    with torch.inference_mode():
        output = pipeline(
            prompt=enhanced,
            num_inference_steps=1,
            guidance_scale=0.0,
            width=512,
            height=512,
            generator=generator
        )
    raw_img = output.images[0]

    # Classical CV post-processing
    enhanced_img, cv_metrics = cv_enhancer.enhance(raw_img, aspect_ratio)
    data_url = cv_enhancer.to_data_url(enhanced_img, "PNG")
    latency = round(time.time() - start_time, 2)

    return data_url, latency, cv_metrics, enhanced_img.size

@app.post("/api/generate")
async def generate_image_endpoint(req: GenerationRequest):
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt must not be empty.")

    job_id = str(uuid.uuid4())
    try:
        data_url, latency, cv_metrics, (w, h) = run_diffusion_generation(
            req.prompt, req.aspect_ratio, req.style, req.seed
        )

        job_result = {
            "job_id": job_id,
            "status": "completed",
            "progress": 100,
            "message": "Generation completed successfully",
            "prompt": req.prompt,
            "aspect_ratio": req.aspect_ratio,
            "style": req.style,
            "image_url": data_url,
            "width": w,
            "height": h,
            "latency_sec": latency,
            "cv_applied": True,
            "cv_metrics": cv_metrics,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "completed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        jobs_db[job_id] = job_result
        return job_result

    except Exception as e:
        err_msg = str(e)
        jobs_db[job_id] = {
            "job_id": job_id,
            "status": "failed",
            "progress": 0,
            "error": err_msg,
            "prompt": req.prompt
        }
        raise HTTPException(status_code=500, detail=f"Generation failed: {err_msg}")

@app.get("/api/generate/{job_id}")
async def get_job(job_id: str):
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs_db[job_id]


# ==============================================================================
# 5. SECURE NGROK TUNNEL SETUP & BACKGROUND SERVER START
# ==============================================================================
def start_server_and_tunnel():
    # 1. Retrieve ngrok token securely
    token = None
    try:
        from google.colab import userdata
        token = userdata.get('NGROK_AUTHTOKEN')
    except Exception:
        pass

    if not token:
        token = os.environ.get("NGROK_AUTHTOKEN")

    if not token:
        print("\n🔑 Please enter your ngrok authentication token.")
        print("(Get your free token at: https://dashboard.ngrok.com/get-started/your-authtoken)")
        token = getpass.getpass("Enter ngrok auth token: ").strip()

    ngrok.set_auth_token(token)

    # 2. Start Uvicorn in background thread
    server_thread = threading.Thread(
        target=lambda: uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning"),
        daemon=True
    )
    server_thread.start()
    time.sleep(2)  # Wait for server to bind

    # 3. Create ngrok public tunnel
    public_url = ngrok.connect(8000).public_url
    # Ensure HTTPS
    if public_url.startswith("http://"):
        public_url = public_url.replace("http://", "https://")

    print("\n" + "="*70)
    print("🚀 EDGEGEN AI GPU INFERENCE SERVER IS LIVE & READY!")
    print("="*70)
    print(f"🔗 Public Backend URL: {public_url}")
    print("="*70)
    print("👉 HOW TO CONNECT TO YOUR EDGEGEN AI WEBSITE:")
    print("1. Open your EdgeGen AI web app.")
    print("2. In the top navbar, click 'GPU Server'.")
    print("3. Switch to the 'Connect Remote GPU' tab.")
    print(f"4. Paste this exact URL:  {public_url}")
    print("5. Click 'Save & Test'. Your status indicator will turn green!")
    print("="*70 + "\n")

    # 4. Self-Test Inference to confirm GPU model works
    print("🧪 Running self-test generation...")
    test_prompt = "A cute red panda in a snowy pine forest at golden hour, high detail"
    test_url, test_lat, test_cv, dims = run_diffusion_generation(test_prompt, "1:1", "photorealistic")
    print(f"✅ Self-Test PASSED! Generated {dims[0]}x{dims[1]} image in {test_lat}s!")
    print(f"   Laplacian Variance (Sharpness): {test_cv.get('blur_laplacian_variance')}")
    print(f"   Luminance Contrast: {test_cv.get('contrast_std')}")

    try:
        from IPython.display import display, HTML
        display(HTML(f"<h3>🎉 EdgeGen AI Server Ready!</h3><p>Backend URL: <a href='{public_url}' target='_blank'>{public_url}</a></p>"))
    except Exception:
        pass

    return public_url

if __name__ == "__main__":
    start_server_and_tunnel()
    print("⏳ Server is running. Keep this Colab tab active to keep inference alive.")
    while True:
        time.sleep(60)
