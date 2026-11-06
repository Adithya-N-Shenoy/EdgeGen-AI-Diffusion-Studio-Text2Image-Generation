import React from 'react';
import { Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/[0.06] bg-black/40 mt-20 py-8 text-center text-xs text-slate-500">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-heading font-medium text-slate-300">EdgeGen AI</span>
          <span className="text-slate-600">·</span>
          <span>Resource-Efficient Text-to-Image Generation</span>
        </div>

        <div className="flex items-center gap-4 text-slate-500 text-xs">
          <span>SD-Turbo Few-Step Distillation</span>
          <span>·</span>
          <span>Classical Computer Vision</span>
          <span>·</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
};
