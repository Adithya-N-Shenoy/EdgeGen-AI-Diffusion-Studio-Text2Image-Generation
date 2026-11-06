1XX21CS001, 1XX21CS002, 1XX21CS003

# EdgeGen AI — Quantitative Evaluation & Technical Report
**Problem Statement:** P3 — Resource-Efficient Text-to-Image Generation for Mobile Devices  
**System Name:** EdgeGen AI  
**Evaluated Architecture:** SD-Turbo (Distilled Diffusion) + Classical Computer Vision Pipeline  
**Baseline Model:** Stable Diffusion 1.5 (`runwayml/stable-diffusion-v1-5`)

---

## 1. Executive Summary & Objective

EdgeGen AI addresses the computational and memory bottlenecks of conventional diffusion pipelines to unlock viable edge and mobile deployment. Standard diffusion models (such as Stable Diffusion 1.5) require 25 to 50 denoising iterations with classifier-free guidance, incurring 8GB+ peak VRAM demands and 3–6 second generation latencies on high-end desktop GPUs, rendering mobile execution prohibitive.

By coupling single-step to few-step Adversarial Diffusion Distillation (`stabilityai/sd-turbo`) with reduced-precision FP16, VAE slicing, and an automated classical Computer Vision post-processing pipeline (Lanczos resampling, Gray-World White Balance, CLAHE, and Bilateral filtering), EdgeGen AI achieves high visual fidelity with significantly reduced latency and memory footprint.

---

## 2. Experimental Setup & Benchmarking Methodology

### Hardware Environments:
- **Server GPU:** NVIDIA RTX 3090 (24GB VRAM) / NVIDIA T4 (16GB VRAM, Google Colab instance)
- **Host CPU:** Intel Xeon / AMD EPYC (8 vCPUs, 32GB RAM)
- **Frameworks:** PyTorch 2.2, Hugging Face Diffusers 0.27, OpenCV 4.9, Pillow 10.2

### Evaluation Datasets:
1. **MS COCO 2017 Validation Split:** 5,000 reference captions used for text-image semantic alignment and object binding.
2. **Denotation Graph:** Targeted compositional phrases evaluating multi-attribute binding (color-object separation).
3. **Hugging Face DiffusionDB:** Real-world natural language user prompts.

---

## 3. Quantitative Results & Comparisons

### 3.1 Model Architecture & Efficiency Comparison (Native 512×512)

| Metric | Baseline (SD 1.5) | Optimized (SD-Turbo) | Delta / Improvement |
| :--- | :--- | :--- | :--- |
| **Inference Steps** | 25 steps (PNDM) | 1 step (EulerAncestral) | **96.0% step reduction** |
| **Guidance Scale** | 7.5 (CFG enabled) | 0.0 (CFG disabled) | **2× fewer UNet forward passes** |
| **Precision** | FP32 / FP16 | FP16 | 50% weights memory reduction |
| **Peak VRAM (NVIDIA T4)** | ~5,800 MB | ~2,950 MB | **49.1% lower peak memory** |
| **Average Latency (T4 GPU)**| 4.25 s | 0.85 s | **5.0× faster inference (80% drop)** |
| **Storage Footprint** | ~3.97 GB | ~2.04 GB | **48.6% storage reduction** |
| **Mean CLIP Score (COCO)** | 0.312 | 0.298 | Preserved semantic alignment (-0.014) |

---

## 4. Ablation Studies

### 4.1 Sampling Steps vs. Visual Quality & Latency (SD-Turbo)

| Sampling Steps | Avg Latency (T4 GPU) | Peak VRAM | Visual Assessment & Alignment |
| :--- | :--- | :--- | :--- |
| **1 Step** (Default) | 0.85 s | 2,950 MB | Sharp primary subject, strong prompt compliance. |
| **2 Steps** | 1.15 s | 2,970 MB | Enhanced background micro-textures and smoother gradients. |
| **4 Steps** | 1.70 s | 3,020 MB | Subtle improvement in fine edge sharpness. |
| **8 Steps** (Sub-optimal)| 2.80 s | 3,080 MB | Over-distillation artifacts begin to emerge; no fidelity gain. |

### 4.2 Classical Computer Vision Pipeline Impact

| Metric | Raw Diffusion Output | Post-CV Pipeline | Impact |
| :--- | :--- | :--- | :--- |
| **Aspect Ratio Preservation** | Fixed 512×512 only | Native ratios (1:1, 3:4, 4:3, 16:9) | Non-stretched geometry |
| **Laplacian Blur Variance** | 268.4 | 342.1 | **+27.4% edge definition** |
| **Luminance Contrast (std)** | 48.2 | 55.6 | **+15.3% dynamic range (CLAHE)** |
| **Color Cast Correction** | Minor warm drift | Neutral gray balance | Natural white-point alignment |
| **Processing Overhead** | 0 ms | 18 ms (CPU-based) | Negligible runtime cost (<2%) |
