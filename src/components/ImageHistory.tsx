import React from 'react';
import { History, Trash2, ArrowUpRight } from 'lucide-react';
import { HistoryItem } from '../types';

interface ImageHistoryProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  selectedId?: string;
}

export const ImageHistory: React.FC<ImageHistoryProps> = ({
  items,
  onSelect,
  onClear,
  selectedId,
}) => {
  if (items.length === 0) return null;

  return (
    <section className="w-full max-w-4xl mx-auto px-4 mt-12 sm:mt-16">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          <h2 className="font-heading font-semibold text-base sm:text-lg text-white">
            Recent Creations
          </h2>
          <span className="text-xs text-slate-400 font-mono">({items.length})</span>
        </div>

        <button
          onClick={onClear}
          className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
          title="Clear session history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Grid of Thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {items.map((item) => {
          const isSelected = selectedId === item.id;
          return (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className={`group relative rounded-xl overflow-hidden glass-card cursor-pointer border transition-all duration-200 ${
                isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-[1.02]'
                  : 'border-white/[0.08] hover:border-indigo-500/40 hover:scale-[1.02]'
              }`}
            >
              <div className="aspect-square w-full overflow-hidden bg-black/40">
                <img
                  src={item.imageUrl}
                  alt={item.prompt}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Hover overlay with prompt snippet and style tag */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end">
                <p className="text-[11px] text-white font-medium line-clamp-2 leading-snug">
                  {item.prompt}
                </p>
                <div className="flex items-center justify-between mt-1 text-[10px] text-indigo-300 font-mono uppercase">
                  <span>{item.style}</span>
                  <span>{item.aspect_ratio}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
