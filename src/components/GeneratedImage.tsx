import React, { useState } from 'react';
import { 
  Download, 
  RotateCw, 
  Copy, 
  Check, 
  Maximize2, 
  Sparkles, 
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { GenerationJob } from '../types';
import { downloadImageAs } from '../services/api';

interface GeneratedImageProps {
  job: GenerationJob;
  onRegenerate: () => void;
  onExpand: (imageUrl: string) => void;
  isGenerating: boolean;
}

export const GeneratedImage: React.FC<GeneratedImageProps> = ({
  job,
  onRegenerate,
  onExpand,
  isGenerating,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<'png' | 'jpg' | null>(null);

  if (!job.image_url) return null;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(job.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = async (format: 'png' | 'jpg') => {
    if (!job.image_url) return;
    setDownloadingFormat(format);
    const filename = `edgegen-${job.prompt.slice(0, 24).replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'image'}-${Date.now()}`;
    try {
      await downloadImageAs(job.image_url, filename, format);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const getAspectClass = () => {
    switch (job.aspect_ratio) {
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
    <div className="w-full max-w-3xl mx-auto px-4 mt-8 animate-in fade-in duration-500">
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl shadow-black/60">
        {/* Header Bar */}
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between text-xs text-slate-400 bg-black/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-medium text-slate-300">Generated Visual</span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-[11px] text-slate-400 uppercase">
              {job.style} · {job.aspect_ratio}
            </span>
            {job.latency_sec && (
              <>
                <span className="text-slate-400">·</span>
                <span className="font-mono text-[11px] text-indigo-300">{job.latency_sec.toFixed(2)}s</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => onExpand(job.image_url!)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Expand Full Resolution"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Expand</span>
          </button>
        </div>

        {/* Image Display Area */}
        <div className="relative group bg-[#050608] flex items-center justify-center overflow-hidden">
          <div className={`w-full ${getAspectClass()} max-h-[640px] flex items-center justify-center`}>
            <img
              src={job.image_url}
              alt={job.prompt}
              className="w-full h-full object-contain cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.01]"
              onClick={() => onExpand(job.image_url!)}
            />
          </div>

          {/* Quick Overlay Action on Image Hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md text-xs font-medium text-white border border-white/20 flex items-center gap-1.5 shadow-lg">
              <Maximize2 className="w-3.5 h-3.5" /> Click to view full resolution
            </span>
          </div>
        </div>

        {/* Action Toolbar Below Image */}
        <div className="p-4 sm:p-5 bg-black/50 border-t border-white/[0.06] space-y-4">
          {/* Prompt Quote */}
          <div className="flex items-start justify-between gap-3 text-xs sm:text-sm text-slate-300 bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
            <p className="italic line-clamp-2 leading-relaxed">
              &ldquo;{job.prompt}&rdquo;
            </p>
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.06] transition-colors"
              title="Copy prompt"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Download PNG Button */}
              <button
                type="button"
                disabled={downloadingFormat !== null}
                onClick={() => handleDownload('png')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.1] transition-all hover:border-indigo-500/40 cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>{downloadingFormat === 'png' ? 'Preparing PNG...' : 'Download PNG'}</span>
              </button>

              {/* Download JPG Button */}
              <button
                type="button"
                disabled={downloadingFormat !== null}
                onClick={() => handleDownload('jpg')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06] transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-purple-400" />
                <span>{downloadingFormat === 'jpg' ? 'Preparing JPG...' : 'Download JPG'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {/* Regenerate Button */}
              <button
                type="button"
                disabled={isGenerating}
                onClick={onRegenerate}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 text-indigo-200 border border-indigo-500/30 transition-all cursor-pointer shadow-sm"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
