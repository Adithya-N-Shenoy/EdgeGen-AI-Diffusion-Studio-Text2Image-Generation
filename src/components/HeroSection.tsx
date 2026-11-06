import React from 'react';
import { Sparkles, Zap } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="text-center pt-8 pb-6 sm:pt-12 sm:pb-8 max-w-3xl mx-auto px-4">
      {/* Subtle label - clean typographic indicator */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 mb-4 backdrop-blur-sm">
        <Zap className="w-3 h-3 text-indigo-400" />
        <span>Powered by Efficient Diffusion AI</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-4">
        Imagine it.{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
          Generate it.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
        Turn your imagination into stunning visuals with fast, intelligent AI image generation.
      </p>
    </section>
  );
};
