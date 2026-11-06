# EdgeGen AI — Resource-Efficient Text-to-Image Generation (v1.0.0)
> **Imagine it. Generate it.**  
> Powered by Efficient Diffusion AI (SD-Turbo Few-Step Distillation + Classical Computer Vision)  
> **Release Milestone:** `v1.0.0` — Stable end-to-end AI text-to-image generation release.

---

## 📌 Release Notice: EdgeGen AI v1.0.0

This release marks the **first successfully working end-to-end image-generation milestone** for EdgeGen AI (Problem P3).

> **⚠️ Hosting & GPU Runtime Requirement:**  
> This version connects to a self-hosted **Google Colab T4 GPU backend** exposed via an **ngrok tunnel**. It is **not permanently hosted** on dedicated cloud compute.  
> Whenever you run the application, you must start the provided Google Colab notebook (`public/edgegen_colab_gpu_server.ipynb` or `backend/run_colab.py`) to launch the SD-Turbo inference worker and paste your public tunnel URL into the web application under **GPU Server > Connect Remote GPU**.

---

## 🌟 Overview

**EdgeGen AI** is a modern, high-performance web application designed for resource-efficient text-to-image synthesis. Developed to tackle the computational, latency, and memory challenges of conventional diffusion models, EdgeGen AI pairs **adversarial diffusion distillation (SD-Turbo)** with a conservative **classical computer vision enhancement pipeline** (Lanczos aspect-preserving resampling, Auto White Balance, CLAHE contrast balancing, and Bilateral filtering).

### Key Features (v1.0.0)

- **Intuitive Studio Experience:** Minimal, distraction-free interface focusing on the core journey: *Prompt → Generate → Preview → Download*.
- **Few-Step Distilled Inference:** Generates images in 1 to 4 steps instead of 25–50 steps, cutting inference latency to ~0.6 seconds on a Tesla T4 GPU.
- **Sub-3GB VRAM Footprint:** FP16 reduced precision and memory-aware VAE/attention slicing allow operation within constrained GPU memory.
- **Automated Classical CV Enhancement:** Aspect-ratio geometry preservation, luminance dynamic range balancing (CLAHE), bilateral edge-preserving smoothing, and blur assessment.
- **Lossless & High-Quality Export:** Download generated visuals in native PNG or compressed JPG.
- **Session History:** Seamless gallery of recent creations during your session.
- **Resilient Tunnel Networking:** Native support for ngrok bypass headers (`ngrok-skip-browser-warning: true`) and a secure fallback Node.js proxy protecting against browser iframe CORS limitations.

---

## 🏗️ Architecture

```
[ Natural Language Prompt ]
            │
            ▼
[ Transformer Text Encoding ]  ──> CLIP text embeddings
            │
            ▼
[ Optimized Few-Step Diffusion ] ──> SD-Turbo (1-4 steps, FP16, VAE Slicing on T4 GPU)
            │
            ▼
[ Classical Computer Vision ]  ──> Lanczos Resizing + White Balance + CLAHE + Bilateral Filtering
            │
            ▼
[ High-Fidelity Visual Result ] ──> Full-res Lightbox, PNG/JPG Export, Session History
```

---

## 📂 Repository Structure

```
├── backend/
│   ├── main.py                     # FastAPI server with job queue & REST endpoints
│   ├── pipeline.py                 # SD-Turbo inference engine with FP16 & VAE slicing
│   ├── cv_enhancer.py              # Classical CV post-processing (OpenCV, Pillow, NumPy)
│   ├── edgegen_colab_gpu_server.py # Complete standalone Google Colab GPU server
│   ├── run_colab.py                # 1-click Google Colab launch script with ngrok
│   ├── Dockerfile                  # Production CUDA 12.1 Docker container
│   ├── requirements.txt            # PyTorch, Diffusers, OpenCV, FastAPI dependencies
│   ├── datasets/
│   │   ├── coco_loader.py          # MS COCO 2017 dataset parser & cleaner
│   │   ├── denotation_graph.py     # Denotation Graph semantic evaluator
│   │   └── hf_dataset.py           # Hugging Face datasets adapter
│   └── evaluation/
│       ├── eval_clip.py            # CLIP text-image cosine similarity
│       ├── eval_latency_memory.py  # Latency and peak VRAM profiling
│       ├── eval_ablation.py        # SD 1.5 baseline vs SD-Turbo ablation
│       └── eval_P3_TeamID.md       # Hackathon evaluation report
├── public/
│   └── edgegen_colab_gpu_server.ipynb # Downloadable verified Jupyter notebook v4
├── src/
│   ├── components/                 # Navbar, PromptInput, GeneratedImage, ImageHistory, AboutSection, BackendModal, etc.
│   ├── services/api.ts             # Frontend API client with remote server connection support & ngrok bypass
│   ├── server/apiHandler.ts        # Express/Vite API proxy & secure remote GPU bridge
│   ├── constants/                  # Aspect ratios, styles, sample prompts, embedded notebook
│   ├── types/index.ts              # TypeScript interfaces
│   └── App.tsx                     # Main workspace application
├── server.ts                       # Full-stack Node production server
└── eval_P3_TeamID.md               # Required evaluation markdown report
```

---

## 🚀 Running the Project

### 1. Frontend Web Application

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Or build and start production server
npm run build
npm start
```

### 2. Backend GPU Inference Engine

#### Free Google Colab GPU (Tesla T4 GPU)
1. Open Google Colab and set Runtime to **T4 GPU** (`Runtime > Change runtime type > T4 GPU`).
2. Upload `public/edgegen_colab_gpu_server.ipynb` or copy the code from the web app's **GPU Server > Free Colab GPU Setup** tab.
3. Run the notebook and enter your free ngrok token securely when prompted.
4. Copy the generated `https://xxxx.ngrok-free.app` URL and paste it into **Connect Remote GPU** in the EdgeGen AI web app.

*Note on Free Colab Limitations:*
- Sessions expire after a maximum of 12 hours.
- Inactive tabs disconnect after 15–30 minutes of idle time.
- Free ngrok URLs rotate whenever the notebook is restarted.

#### Local NVIDIA GPU / Apple Silicon (Optional)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📊 Datasets & Research Foundations

- **MS COCO 2017:** Used for evaluating semantic alignment and multi-object prompt adherence. [Website](https://cocodataset.org/)
- **Denotation Graph:** Examines compositional visual semantics, phrase relationships, and attribute binding. [Website](https://shannon.cs.illinois.edu/DenotationGraph/)
- **Hugging Face Datasets:** Curated subsets for benchmark evaluation. [Website](https://huggingface.co/datasets)

---

## 🚀 Deploying to Vercel

EdgeGen AI is architected for instant deployment to Vercel:
- **Frontend & Serverless API Proxy:** Hosted on Vercel's global Edge network.
- **Inference Engine:** Runs on a Google Colab T4 GPU (or any remote GPU server) exposed via ngrok.
- **Zero Client Configuration Needed:** Visitors and judges open the Vercel URL and generate images immediately—no manual URL pasting required.

### Vercel Deployment Settings
- **Framework Preset:** `Vite`
- **Root Directory:** `./`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Required Environment Variable
In Vercel **Project Settings > Environment Variables**, add:
- `COLAB_BACKEND_URL`: `https://your-active-session.ngrok-free.dev`

### How It Works
1. Vercel serves the optimized static React 19 application.
2. Requests to `/api/*` are handled by Vercel Serverless Functions (`api/index.ts` and `api/[...path].ts`).
3. The serverless proxy automatically adds the `ngrok-skip-browser-warning: true` header, handles CORS, and forwards generation requests directly to your running Colab GPU backend.
4. **When Colab restarts:** Simply update `COLAB_BACKEND_URL` under Vercel **Project Settings > Environment Variables** and trigger a quick redeployment (or use the in-app GPU Server modal).
5. **When Colab is disconnected:** The application displays a clean, user-friendly notice: *"Image generation is temporarily unavailable. Please try again later."* without crashing or displaying fake images.

---

## 📄 Evaluation Report

Full quantitative measurements, step-count ablations, latency, peak VRAM profiles, and CV enhancement deltas are documented in [`eval_P3_TeamID.md`](./eval_P3_TeamID.md).

