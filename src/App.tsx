import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Navbar 
} from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { PromptInput } from './components/PromptInput';
import { GenerationLoader } from './components/GenerationLoader';
import { GeneratedImage } from './components/GeneratedImage';
import { ImageHistory } from './components/ImageHistory';
import { AboutSection } from './components/AboutSection';
import { BackendModal } from './components/BackendModal';
import { Footer } from './components/Footer';
import { 
  AspectRatio, 
  ImageStyle, 
  GenerationJob, 
  HistoryItem, 
  BackendStatus 
} from './types';
import { 
  fetchModelStatus, 
  submitGeneration, 
  pollJobStatus,
  checkBackendHealth
} from './services/api';
import { ImageModal } from './components/ImageModal';
import { AlertCircle, RotateCw, Server, ArrowDown } from 'lucide-react';

const STORAGE_KEY_HISTORY = 'edgegen_session_history_v1';
const STORAGE_KEY_THEME = 'edgegen_theme_preference';

export default function App() {
  const [activeTab, setActiveTab] = useState<'generate' | 'about'>('generate');
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved) return saved === 'dark';
    }
    return true; // default dark
  });

  // Generation state
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [style, setStyle] = useState<ImageStyle>('auto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(15);
  const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // History & Modals
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [];
  });
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Apply theme to html root
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#090a0f';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#0d1117';
    }
    localStorage.setItem(STORAGE_KEY_THEME, isDark ? 'dark' : 'light');
  }, [isDark]);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history.slice(0, 16)));
    } catch {
      // ignore
    }
  }, [history]);

  // Check backend status on mount
  const refreshBackendStatus = async () => {
    try {
      await checkBackendHealth();
      const status = await fetchModelStatus();
      setBackendStatus(status);
    } catch {
      setBackendStatus(null);
    }
  };

  useEffect(() => {
    refreshBackendStatus();
    const interval = setInterval(refreshBackendStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setValidationError('Please enter a description for the image.');
      return;
    }
    setValidationError(null);
    setGenerationError(null);
    setIsGenerating(true);
    setGenerationProgress(20);

    // Scroll to results area smoothly
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      // Submit generation request
      const job = await submitGeneration({
        prompt: prompt.trim(),
        aspect_ratio: aspectRatio,
        style: style,
      });

      if (job.status === 'completed' && job.image_url) {
        // Instant response
        finishJob(job);
      } else if (job.status === 'failed') {
        throw new Error(job.error || 'Generation failed on inference server');
      } else {
        // Poll job status until done
        await pollUntilFinished(job.job_id);
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setGenerationError(
        err.message || 'Generation failed. Verify the inference engine status or retry.'
      );
      setIsGenerating(false);
    }
  };

  const pollUntilFinished = async (jobId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      setGenerationProgress((p) => Math.min(p + 8, 92));

      try {
        const update = await pollJobStatus(jobId);
        if (update.status === 'completed') {
          clearInterval(interval);
          finishJob(update);
        } else if (update.status === 'failed') {
          clearInterval(interval);
          throw new Error(update.error || 'Inference engine reported a generation error');
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          throw new Error('Generation timed out. The server is under heavy load.');
        }
      } catch (err: any) {
        clearInterval(interval);
        setGenerationError(err.message || 'Error communicating with generation engine');
        setIsGenerating(false);
      }
    }, 1200);
  };

  const finishJob = (job: GenerationJob) => {
    setGenerationProgress(100);
    setCurrentJob(job);
    setIsGenerating(false);

    // Save to history
    if (job.image_url) {
      const newItem: HistoryItem = {
        id: job.job_id || `hist-${Date.now()}`,
        prompt: job.prompt,
        style: job.style,
        aspect_ratio: job.aspect_ratio,
        imageUrl: job.image_url,
        timestamp: Date.now(),
        width: job.width || 512,
        height: job.height || 512,
        latencySec: job.latency_sec,
      };
      setHistory((prev) => [newItem, ...prev.filter((h) => h.id !== newItem.id)]);

      // Gentle celebratory confetti
      try {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#818cf8', '#c084fc', '#f472b6'],
        });
      } catch {
        // ignore
      }
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setStyle(item.style);
    setAspectRatio(item.aspect_ratio);
    setCurrentJob({
      job_id: item.id,
      status: 'completed',
      progress: 100,
      message: 'Loaded from session history',
      prompt: item.prompt,
      aspect_ratio: item.aspect_ratio,
      style: item.style,
      image_url: item.imageUrl,
      created_at: new Date(item.timestamp).toISOString(),
      latency_sec: item.latencySec,
    });
    setGenerationError(null);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY_HISTORY);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background ambient light gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-indigo-900/15 via-purple-900/10 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-purple-950/20 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-950/20 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        toggleTheme={toggleTheme}
        backendStatus={backendStatus}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 pb-16">
        {activeTab === 'generate' ? (
          <>
            {/* Hero Section */}
            <HeroSection />

            {/* Prompt & Generation Workspace */}
            <PromptInput
              prompt={prompt}
              setPrompt={setPrompt}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              style={style}
              setStyle={setStyle}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              validationError={validationError}
            />

            {/* Results Target Anchor */}
            <div ref={resultsRef} className="scroll-mt-20" />

            {/* Loading State */}
            {isGenerating && (
              <GenerationLoader
                aspectRatio={aspectRatio}
                progress={generationProgress}
              />
            )}

            {/* Generation Error State */}
            {generationError && !isGenerating && (
              <div className="w-full max-w-2xl mx-auto px-4 mt-8">
                <div className="glass-panel rounded-2xl p-6 border border-rose-500/30 bg-rose-950/15 text-rose-200 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h3 className="font-semibold text-white text-sm">
                        Generation Encountered an Issue
                      </h3>
                      <p className="text-xs text-rose-200 leading-relaxed">
                        {generationError}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Retry Generation</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBackendModalOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
                    >
                      <Server className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Configure GPU Backend</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Completed Image Result */}
            {currentJob && currentJob.status === 'completed' && !isGenerating && (
              <GeneratedImage
                job={currentJob}
                onRegenerate={handleGenerate}
                onExpand={(url) => setExpandedImage(url)}
                isGenerating={isGenerating}
              />
            )}

            {/* Session History Gallery */}
            <ImageHistory
              items={history}
              onSelect={handleSelectHistoryItem}
              onClear={handleClearHistory}
              selectedId={currentJob?.job_id}
            />
          </>
        ) : (
          /* About Section */
          <AboutSection />
        )}
      </main>

      {/* Full-resolution Image Modal Lightbox */}
      <ImageModal
        imageUrl={expandedImage}
        prompt={currentJob?.prompt}
        onClose={() => setExpandedImage(null)}
      />

      {/* Backend Engine & Hardware Modal */}
      <BackendModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        backendStatus={backendStatus}
        onRefreshStatus={refreshBackendStatus}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
