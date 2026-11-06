import React, { useState } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Layers, 
  ExternalLink, 
  Database, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Code2, 
  Eye, 
  Zap, 
  BookOpen,
  ArrowRight,
  Terminal,
  Server
} from 'lucide-react';

export const AboutSection: React.FC = () => {
  const [teamName, setTeamName] = useState('EdgeGen Research Team');
  const [teamMembers, setTeamMembers] = useState('Shenoy & Engineering Collaborators');
  const [institution, setInstitution] = useState('Autonomous AI Computing Lab');
  const [githubRepo, setGithubRepo] = useState('https://github.com/edgegen-ai/edgegen-p3');

  const pipelineStages = [
    {
      step: '01',
      title: 'Your Prompt',
      subtitle: 'Natural Language Input',
      desc: 'You enter any description. The system applies optional style enhancement tags to clarify stylistic nuances.',
      icon: Terminal,
    },
    {
      step: '02',
      title: 'AI Text Understanding',
      subtitle: 'CLIP Text Encoding',
      desc: 'A pretrained transformer text encoder converts words into high-dimensional semantic embeddings capturing objects, spatial relations, and aesthetics.',
      icon: Code2,
    },
    {
      step: '03',
      title: 'Optimized Diffusion',
      subtitle: 'Distilled SD-Turbo Core',
      desc: 'Adversarial diffusion distillation generates conditioned latent representations in just 1 to 4 steps instead of 25–50 steps, cutting compute latency by up to 80%.',
      icon: Zap,
    },
    {
      step: '04',
      title: 'Image Enhancement',
      subtitle: 'Classical Computer Vision',
      desc: 'OpenCV and Pillow post-processing performs Lanczos aspect-preserving resizing, auto white balance, CLAHE contrast balance, and bilateral edge preservation.',
      icon: Eye,
    },
    {
      step: '05',
      title: 'Your Image',
      subtitle: 'High-Fidelity Visual',
      desc: 'The rendered image is delivered to your canvas with instant full-resolution preview and lossless PNG / JPG export.',
      icon: Sparkles,
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
          About <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">EdgeGen AI</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Making high-quality AI image generation faster, lighter, and more accessible.
        </p>
      </div>

      {/* Section A: What Is EdgeGen AI */}
      <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Section A · Overview
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 mb-3">
            What Is EdgeGen AI?
          </h2>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
            EdgeGen AI is a resource-efficient text-to-image generation system developed for Problem Statement P3. It combines optimized diffusion models with classical computer vision to transform natural-language descriptions into high-quality visual content while reducing computational requirements.
          </p>
        </div>
      </section>

      {/* Section B: How It Works */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
            Section B · Architecture
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            How It Works
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            An end-to-end pipeline from linguistic representation to edge-enhanced visual rendering.
          </p>
        </div>

        {/* Visual Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {pipelineStages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.step}
                className="glass-card p-4 rounded-xl border border-white/[0.06] flex flex-col justify-between hover:border-indigo-500/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-semibold text-indigo-400">
                      {stage.step}
                    </span>
                    <span className="p-1.5 rounded-lg bg-white/[0.04] text-slate-300 group-hover:text-indigo-300 transition-colors">
                      <Icon className="w-4 h-4" />
                    </span>
                  </div>
                  <h3 className="font-heading font-semibold text-sm text-white mb-0.5">
                    {stage.title}
                  </h3>
                  <div className="text-[11px] text-indigo-300/80 mb-2 font-mono">
                    {stage.subtitle}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {stage.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section C: Technology Behind EdgeGen */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-semibold text-pink-400 uppercase tracking-wider">
            Section C · Engineering Stack
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Technology Behind EdgeGen
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Real implementations cleanly distinguished from experimental infrastructures.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Frontend */}
          <div className="glass-card p-5 rounded-xl border border-white/[0.06]">
            <h3 className="font-heading font-semibold text-sm text-white flex items-center justify-between mb-3">
              <span>Frontend Architecture</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Production
              </span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>React 19 & TypeScript</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>Tailwind CSS & Motion engine</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>TanStack Query & Lucide icons</span>
              </li>
            </ul>
          </div>

          {/* Backend */}
          <div className="glass-card p-5 rounded-xl border border-white/[0.06]">
            <h3 className="font-heading font-semibold text-sm text-white flex items-center justify-between mb-3">
              <span>Backend & API Server</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Implemented
              </span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>Python 3.11 & FastAPI</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>Uvicorn async worker</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>REST contract with async job queue</span>
              </li>
            </ul>
          </div>

          {/* AI */}
          <div className="glass-card p-5 rounded-xl border border-white/[0.06]">
            <h3 className="font-heading font-semibold text-sm text-white flex items-center justify-between mb-3">
              <span>Artificial Intelligence</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Core Engine
              </span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <span>PyTorch & Hugging Face Diffusers</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <span>SD-Turbo (stabilityai/sd-turbo)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <span>Stable Diffusion 1.5 baseline support</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <span>LoRA adaptation infrastructure</span>
              </li>
            </ul>
          </div>

          {/* Computer Vision */}
          <div className="glass-card p-5 rounded-xl border border-white/[0.06]">
            <h3 className="font-heading font-semibold text-sm text-white flex items-center justify-between mb-3">
              <span>Classical Computer Vision</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Automated
              </span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>OpenCV & Pillow & NumPy</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>Aspect-preserving Lanczos resize</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>Auto white-balance & CLAHE</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>Bilateral filter & unsharp mask</span>
              </li>
            </ul>
          </div>

          {/* Optimization */}
          <div className="glass-card p-5 rounded-xl border border-white/[0.06]">
            <h3 className="font-heading font-semibold text-sm text-white flex items-center justify-between mb-3">
              <span>Optimization Methods</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Resource-Saving
              </span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>Reduced precision (FP16 inference)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>Few-step diffusion (1–4 steps)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>Memory-aware VAE slicing</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>Attention optimization & latent space</span>
              </li>
            </ul>
          </div>

          {/* Evaluation */}
          <div className="glass-card p-5 rounded-xl border border-white/[0.06]">
            <h3 className="font-heading font-semibold text-sm text-white flex items-center justify-between mb-3">
              <span>Evaluation Framework</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Offline Tools
              </span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <span>CLIP text-image cosine similarity</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <span>FID / KID distribution metrics</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <span>Latency & peak VRAM profiler</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <span>Laplacian variance blur detector</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section D: Datasets and Research */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Section D · Datasets & Research
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Required Datasets & Research Foundation
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Resources utilized for semantic alignment, compositional reasoning, and empirical validation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* MS COCO */}
          <div className="glass-card p-5 rounded-xl border border-white/[0.06] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading font-bold text-base text-white">MS COCO</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Validation
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Image-caption and object-annotation data for semantic alignment and visual understanding across complex scenes.
              </p>
            </div>
            <a
              href="https://cocodataset.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium group"
            >
              <span>Visit cocodataset.org</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* Denotation Graph */}
          <div className="glass-card p-5 rounded-xl border border-white/[0.06] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading font-bold text-base text-white">Denotation Graph</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Semantics
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                A research resource for studying compositional visual semantics and relationships between language and images.
              </p>
            </div>
            <a
              href="https://shannon.cs.illinois.edu/DenotationGraph/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-medium group"
            >
              <span>Visit Denotation Graph</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* Hugging Face Datasets */}
          <div className="glass-card p-5 rounded-xl border border-white/[0.06] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading font-bold text-base text-white">Hugging Face Datasets</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20">
                  Ecosystem
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                An ecosystem of datasets supporting image-text learning, adaptation, and evaluation with standardized loaders and filtering.
              </p>
            </div>
            <a
              href="https://huggingface.co/datasets"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 font-medium group"
            >
              <span>Visit Hugging Face</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Section E: Why Resource Efficiency Matters */}
      <section className="glass-card p-6 sm:p-8 rounded-2xl border border-white/[0.08] space-y-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Section E · Rationale
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Why Resource Efficiency Matters
          </h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          Conventional diffusion systems often require substantial compute and memory (typically 8GB–16GB+ VRAM and 25–50 iterative denoising steps). This creates severe bottlenecks for deployment, cost, latency, and edge accessibility.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs text-slate-300">
          <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04]">
            <span className="font-semibold text-white block mb-1">⚡ Faster Image Generation</span>
            Sub-second to 2-second generation times enabled by distilled single-to-few-step synthesis.
          </div>
          <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04]">
            <span className="font-semibold text-white block mb-1">📉 Reduced Memory Overhead</span>
            FP16 quantization, VAE slicing, and sequential model offloading keep peak footprint below 3.5GB.
          </div>
          <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04]">
            <span className="font-semibold text-white block mb-1">📱 Mobile & Edge Feasibility</span>
            Investigates deployment pathways for modern mobile neural engines (NPU / Metal / Vulkan) via lightweight checkpoints.
          </div>
        </div>
        <p className="text-[11px] text-slate-400 italic pt-2">
          Note: In accordance with rigorous scientific honesty, inference in this web instance runs via the connected GPU backend. On-device mobile execution requires separate mobile runtime compilation (e.g., CoreML or ExecuTorch).
        </p>
      </section>

      {/* Section F: Project Information */}
      <section className="space-y-4">
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Section F · Project Details
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Project Information
          </h2>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/[0.08] grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-400 block">Project Title</span>
              <span className="font-semibold text-white">EdgeGen AI</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Category</span>
              <span className="text-slate-200">Artificial Intelligence / Deep Learning / Computer Vision</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Core Objective</span>
              <span className="text-slate-200">Resource-Efficient Text-to-Image Generation for Mobile Devices</span>
            </div>
          </div>

          <div className="space-y-3 border-t md:border-t-0 md:border-l border-white/[0.06] md:pl-6 pt-3 md:pt-0">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Team Members</label>
              <input
                type="text"
                value={teamMembers}
                onChange={(e) => setTeamMembers(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Institution / Affiliation</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">GitHub Repository</label>
              <input
                type="text"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 font-mono"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section G: Limitations and Responsible AI */}
      <section className="glass-card p-6 rounded-2xl border border-white/[0.08] space-y-3">
        <div className="flex items-center gap-2 text-amber-300">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h2 className="font-heading font-semibold text-base text-white">
            Section G · Limitations & Responsible AI
          </h2>
        </div>
        <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside leading-relaxed">
          <li>
            <strong className="text-white">Visual Artifacts:</strong> AI-generated images may contain visual inaccuracies, unusual anatomy, or synthetic imperfections.
          </li>
          <li>
            <strong className="text-white">Prompt Adherence:</strong> Highly complex or compositional multi-subject prompts may not always be followed with 100% attribute binding fidelity.
          </li>
          <li>
            <strong className="text-white">Hardware Sensitivity:</strong> Generation throughput directly depends on available GPU/CPU acceleration.
          </li>
          <li>
            <strong className="text-white">Licensing & Attribution:</strong> SD-Turbo and baseline diffusion models are subject to open-weight model licenses (Stability AI CreativeML OpenRAIL). Respect all applicable community terms.
          </li>
          <li>
            <strong className="text-white">Edge Deployment Scope:</strong> True on-device mobile execution requires separate framework compilation and memory profile validation.
          </li>
        </ul>
      </section>
    </div>
  );
};
