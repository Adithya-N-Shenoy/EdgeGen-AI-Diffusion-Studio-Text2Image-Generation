import React, { useRef, useEffect } from 'react';
import { Sparkles, Dices, X, ArrowUpRight } from 'lucide-react';
import { AspectRatio, ImageStyle } from '../types';
import { AspectRatioSelector } from './AspectRatioSelector';
import { StyleSelector } from './StyleSelector';
import { SAMPLE_PROMPTS } from '../constants/presets';

interface PromptInputProps {
  prompt: string;
  setPrompt: (value: string) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (val: AspectRatio) => void;
  style: ImageStyle;
  setStyle: (val: ImageStyle) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  validationError?: string | null;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  prompt,
  setPrompt,
  aspectRatio,
  setAspectRatio,
  style,
  setStyle,
  onGenerate,
  isGenerating,
  validationError,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea height as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        Math.max(textareaRef.current.scrollHeight, 100),
        260
      )}px`;
    }
  }, [prompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isGenerating && prompt.trim()) {
        onGenerate();
      }
    }
  };

  const handleRandomPrompt = () => {
    const random = SAMPLE_PROMPTS[Math.floor(Math.random() * SAMPLE_PROMPTS.length)];
    setPrompt(random);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="relative glass-panel rounded-2xl p-4 sm:p-6 shadow-2xl shadow-indigo-950/20 border border-white/[0.1] focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all duration-300">
        {/* Prompt Input Header / Prompt Helper tools */}
        <div className="flex items-center justify-between pb-2 text-xs text-slate-400">
          <span className="font-medium text-slate-300">Image Description</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRandomPrompt}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 hover:underline transition-colors cursor-pointer"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Surprise me</span>
            </button>
            {prompt.length > 0 && (
              <button
                type="button"
                onClick={() => setPrompt('')}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
                title="Clear prompt"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
          rows={3}
          placeholder="Describe the image you want to create... e.g. A beautiful futuristic city at sunset, glowing skyscrapers, flying cars, cinematic lighting, ultra-realistic details."
          className="w-full bg-transparent resize-none text-slate-100 placeholder:text-slate-400 text-sm sm:text-base leading-relaxed focus:outline-none disabled:opacity-50"
        />

        {/* Validation Error if any */}
        {validationError && (
          <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
            <span>•</span> {validationError}
          </p>
        )}

        {/* Sample Inspirations Pills */}
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs text-slate-400">
          <span className="text-[11px] text-slate-400 shrink-0">Try:</span>
          {SAMPLE_PROMPTS.slice(0, 3).map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(sample)}
              className="shrink-0 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] hover:text-slate-200 border border-white/[0.05] transition-colors text-[11px] text-slate-300 max-w-[200px] truncate text-left"
              title={sample}
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Controls Section */}
        <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-4">
          <AspectRatioSelector
            value={aspectRatio}
            onChange={setAspectRatio}
            disabled={isGenerating}
          />
          <StyleSelector
            value={style}
            onChange={setStyle}
            disabled={isGenerating}
          />
        </div>

        {/* Action Button & Meta */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-400 w-full sm:w-auto justify-between sm:justify-start">
            <span className="font-mono text-[11px]">{prompt.length} chars</span>
            <span className="hidden sm:inline text-slate-400">·</span>
            <span className="hidden sm:inline text-[11px]">Press ⌘+Enter to run</span>
          </div>

          <button
            type="button"
            disabled={isGenerating || !prompt.trim()}
            onClick={onGenerate}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-heading font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-lg ${
              isGenerating || !prompt.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/[0.05]'
                : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:brightness-110 hover:shadow-indigo-500/25 active:scale-[0.98] border border-white/20'
            }`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Generating Image...</span>
              </>
            ) : (
              <>
                <span>Generate Image</span>
                <Sparkles className="w-4 h-4 text-amber-200" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
