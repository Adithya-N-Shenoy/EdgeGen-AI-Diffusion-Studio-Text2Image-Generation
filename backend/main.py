import os
import uuid
import time
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Local pipeline & classical CV enhancer
try:
    from pipeline import DiffusionInferenceEngine
    from cv_enhancer import ClassicalCVEnhancer
    ENGINE_AVAILABLE = True
except ImportError as e:
    ENGINE_AVAILABLE = False
    IMPORT_ERROR = str(e)

app = FastAPI(
    title="EdgeGen AI - Resource-Efficient Diffusion Backend",
    description="FastAPI service for SD-Turbo few-step text-to-image generation with classical CV enhancement for Problem P3.",
    version="1.0.0",
)

# Enable CORS for web frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "ngrok-skip-browser-warning", "X-Edgegen-Backend"],
)

# In-memory job repository
jobs_db: Dict[str, Dict[str, Any]] = {}

# Initialize engine if dependencies are present
engine: Optional[Any] = None
cv_enhancer: Optional[Any] = None

@app.on_event("startup")
async def startup_event():
    global engine, cv_enhancer
    if ENGINE_AVAILABLE:
        try:
            print("🚀 Initializing EdgeGen Diffusion Inference Engine (SD-Turbo)...")
            engine = DiffusionInferenceEngine()
            cv_enhancer = ClassicalCVEnhancer()
            print("✅ Engine and Classical CV Enhancer loaded successfully.")
        except Exception as e:
            print(f"⚠️ Could not load diffusion weights into memory on startup: {e}")
            engine = None
    else:
        print(f"⚠️ PyTorch/Diffusers dependencies missing in environment: {IMPORT_ERROR}")

class GenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000, description="Natural language prompt description")
    aspect_ratio: str = Field(default="1:1", description="Aspect ratio: 1:1, 3:4, 4:3, 16:9")
    style: str = Field(default="auto", description="Style preset: auto, photorealistic, cinematic, anime, digital_art, illustration")
    negative_prompt: Optional[str] = Field(default=None, description="Optional negative prompt")
    seed: Optional[int] = Field(default=None, description="Optional seed for deterministic generation")

@app.get("/api/health")
async def health_check():
    """Health check endpoint returning system status."""
    return {
        "status": "healthy",
        "service": "EdgeGen AI Diffusion Backend",
        "timestamp": time.time(),
        "engine_ready": engine is not None and engine.is_ready,
    }

@app.get("/api/models/status")
async def model_status():
    """Returns model readiness, hardware device, precision, and VRAM consumption."""
    if engine and engine.is_ready:
        return engine.get_status()
    
    return {
        "online": False,
        "engine": "SD-Turbo Distilled Diffusion",
        "model": "stabilityai/sd-turbo",
        "device": "cpu",
        "precision": "fp16",
        "vram_allocated_mb": 0,
        "memory_saving_enabled": True,
        "cv_pipeline_ready": cv_enhancer is not None,
        "active_jobs": len([j for j in jobs_db.values() if j["status"] == "processing"]),
        "queue_length": len([j for j in jobs_db.values() if j["status"] == "pending"]),
        "api_version": "1.0.0",
        "hardware_summary": "Engine uninitialized or awaiting GPU worker connection."
    }

@app.get("/api/about")
async def get_about_info():
    """Returns metadata about EdgeGen AI architecture and datasets."""
    return {
        "project": "EdgeGen AI",
        "problem_id": "P3",
        "problem_title": "Resource-Efficient Text-to-Image Generation for Mobile Devices",
        "models": {
            "optimized": "stabilityai/sd-turbo",
            "baseline": "runwayml/stable-diffusion-v1-5"
        },
        "optimizations": [
            "Reduced-precision FP16 inference",
            "Few-step adversarial diffusion distillation (1-4 steps)",
            "Memory-aware VAE slicing and attention slicing",
            "Classical computer vision post-processing (Lanczos, CLAHE, Bilateral filtering)"
        ],
        "datasets": [
            {"name": "MS COCO 2017", "url": "https://cocodataset.org/"},
            {"name": "Denotation Graph", "url": "https://shannon.cs.illinois.edu/DenotationGraph/"},
            {"name": "Hugging Face Datasets", "url": "https://huggingface.co/datasets"}
        ]
    }

def process_generation_job(job_id: str, request: GenerationRequest):
    """Background worker executing model inference and classical CV pipeline."""
    job = jobs_db[job_id]
    job["status"] = "processing"
    job["progress"] = 30
    start_time = time.time()

    try:
        if engine is None or not engine.is_ready:
            raise RuntimeError(
                "Diffusion engine is offline. PyTorch with CUDA or Apple MPS acceleration is required to execute SD-Turbo."
            )

        # 1. Diffusion inference
        job["progress"] = 50
        raw_image, latency = engine.generate(
            prompt=request.prompt,
            aspect_ratio=request.aspect_ratio,
            style=request.style,
            negative_prompt=request.negative_prompt,
            seed=request.seed
        )

        job["progress"] = 80

        # 2. Classical Computer Vision Enhancement
        enhanced_image, cv_metrics = cv_enhancer.enhance(
            image=raw_image,
            aspect_ratio=request.aspect_ratio
        )

        # 3. Export to base64 data URL for instant delivery
        data_url = cv_enhancer.to_data_url(enhanced_image, format="PNG")

        job["status"] = "completed"
        job["progress"] = 100
        job["image_url"] = data_url
        job["latency_sec"] = round(time.time() - start_time, 2)
        job["cv_applied"] = True
        job["cv_metrics"] = cv_metrics
        job["completed_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
        job["progress"] = 0
        print(f"❌ Job {job_id} failed: {e}")

@app.post("/api/generate")
async def create_generation(request: GenerationRequest):
    """Executes SD-Turbo image generation and classical CV enhancement."""
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt must not be empty.")

    # Check engine availability
    if engine is None or not engine.is_ready:
        raise HTTPException(
            status_code=503,
            detail=(
                "Inference Backend Offline: The self-hosted SD-Turbo model engine is not connected to a GPU. "
                "Please configure a remote GPU backend in settings (e.g. Google Colab / Hugging Face Space) "
                "or run 'uvicorn main:app --host 0.0.0.0 --port 8000' on a GPU machine."
            )
        )

    job_id = str(uuid.uuid4())
    start_time = time.time()
    try:
        # 1. Distilled diffusion inference
        raw_image, latency = engine.generate(
            prompt=request.prompt,
            aspect_ratio=request.aspect_ratio,
            style=request.style,
            negative_prompt=request.negative_prompt,
            seed=request.seed
        )

        # 2. Classical Computer Vision Enhancement
        enhanced_image, cv_metrics = cv_enhancer.enhance(
            image=raw_image,
            aspect_ratio=request.aspect_ratio
        )

        # 3. Export to base64 data URL
        data_url = cv_enhancer.to_data_url(enhanced_image, format="PNG")
        w, h = enhanced_image.size

        job_result = {
            "job_id": job_id,
            "status": "completed",
            "progress": 100,
            "message": "Image generated successfully",
            "prompt": request.prompt,
            "aspect_ratio": request.aspect_ratio,
            "style": request.style,
            "image_url": data_url,
            "width": w,
            "height": h,
            "latency_sec": round(time.time() - start_time, 2),
            "cv_applied": True,
            "cv_metrics": cv_metrics,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "completed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        jobs_db[job_id] = job_result
        return job_result

    except Exception as e:
        jobs_db[job_id] = {
            "job_id": job_id,
            "status": "failed",
            "progress": 0,
            "error": str(e),
            "prompt": request.prompt
        }
        raise HTTPException(status_code=500, detail=f"Generation failed: {e}")

@app.get("/api/generate/{job_id}")
async def get_generation_job(job_id: str):
    """Returns generation status and output image."""
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found.")
    return jobs_db[job_id]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
