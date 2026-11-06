import React, { useState, useEffect } from 'react';
import { Sparkles, Layers, Cpu } from 'lucide-react';
import { AspectRatio } from '../types';
import { PRESENTATION_LOADING_MESSAGES } from '../constants/presets';

interface GenerationLoaderProps {
  aspectRatio: AspectRatio;
  progress?: number;
}

export const GenerationLoader: React.FC<GenerationLoaderProps> = ({
  aspectRatio,
  progress = 0,
}) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % PRESENTATION_LOADING_MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square';
      case '3:4':
        return 'aspect-[3/4]';
      case '4:3':
        return 'aspect-[4/3]';
      case '16:9':
        return 'aspect-video';
      default:
        return 'aspect-square';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mt-8">
      <div
        className={`relative w-full ${getAspectRatioClass()} max-h-[580px] rounded-2xl overflow-hidden glass-panel border border-indigo-500/30 flex flex-col items-center justify-center p-6 text-center shadow-2xl shadow-indigo-950/40`}
      >
        {/* Ambient background glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/30 via-purple-950/20 to-pink-950/30 opacity-70" />

        {/* Animated glowing mesh circle */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-40 animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-black/60 border border-white/20 flex items-center justify-center text-indigo-300 shadow-inner">
            <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
        </div>

        {/* Dynamic Presentation Message */}
        <div className="relative z-10 max-w-md">
          <h3 className="font-heading font-semibold text-lg sm:text-xl text-white mb-2 transition-all duration-500">
            {PRESENTATION_LOADING_MESSAGES[messageIndex]}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Applying few-step diffusion synthesis and edge-aware refinement
          </p>

          {/* Clean Progress bar */}
          <div className="w-48 sm:w-64 h-1.5 bg-white/10 rounded-full mx-auto mt-6 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(progress, 15)}%` }}
            />
          </div>
        </div>

        {/* Shimmer sweep effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full animate-shimmer" />
      </div>
    </div>
  );
};
