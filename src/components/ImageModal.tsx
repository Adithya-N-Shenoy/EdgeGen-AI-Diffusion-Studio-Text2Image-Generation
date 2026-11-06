import React, { useEffect, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { downloadImageAs } from '../services/api';

interface ImageModalProps {
  imageUrl: string | null;
  prompt?: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, prompt, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [downloading, setDownloading] = useState<'png' | 'jpg' | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  const handleDownload = async (format: 'png' | 'jpg') => {
    setDownloading(format);
    const filename = `edgegen-full-${Date.now()}`;
    await downloadImageAs(imageUrl, filename, format);
    setDownloading(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Top Header controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="max-w-xl truncate text-xs sm:text-sm text-slate-300 font-medium bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
          {prompt || 'Full Resolution Preview'}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-black/60 rounded-lg border border-white/10 p-1 backdrop-blur-md">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-xs text-slate-400">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {zoom !== 1 && (
              <button
                onClick={() => setZoom(1)}
                className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors border-l border-white/10"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick downloads */}
          <button
            disabled={downloading !== null}
            onClick={() => handleDownload('png')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold backdrop-blur-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PNG</span>
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div 
        className="w-full h-full max-h-[85vh] flex items-center justify-center overflow-auto p-4 cursor-default"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <img
          src={imageUrl}
          alt={prompt || 'Generated full view'}
          style={{ transform: `scale(${zoom})`, transition: 'transform 0.15s ease-out' }}
          className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl origin-center"
        />
      </div>
    </div>
  );
};
