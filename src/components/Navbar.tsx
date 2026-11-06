import React from 'react';
import { Sparkles, Info, Github, Moon, Sun, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import { BackendStatus } from '../types';

interface NavbarProps {
  activeTab: 'generate' | 'about';
  setActiveTab: (tab: 'generate' | 'about') => void;
  isDark: boolean;
  toggleTheme: () => void;
  backendStatus: BackendStatus | null;
  onOpenBackendModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  toggleTheme,
  backendStatus,
  onOpenBackendModal,
}) => {
  const isOnline = backendStatus?.online;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#090a0f]/80 backdrop-blur-xl transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => setActiveTab('generate')}
          className="flex items-center gap-2.5 text-left group transition-transform focus:outline-none"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="font-heading font-bold text-lg tracking-tight text-white group-hover:text-indigo-200 transition-colors">
            EdgeGen <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">AI</span>
          </span>
        </button>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'generate'
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              Generate
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'about'
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              About
            </button>
          </nav>

          {/* Backend Connection Indicator Button */}
          <button
            onClick={onOpenBackendModal}
            title={isOnline ? "Backend Connected (SD-Turbo)" : "GPU Backend Settings & Guide"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-all text-slate-300 bg-white/[0.03] border-white/[0.08] hover:border-indigo-500/40 hover:bg-white/[0.06]"
          >
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline font-mono text-[11px] font-medium text-slate-200">
              {isOnline ? (backendStatus?.device === 'cuda' ? 'T4 GPU Active' : 'SD-Turbo Active') : 'GPU Server'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <Github className="w-4 h-4" />
          </a>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
