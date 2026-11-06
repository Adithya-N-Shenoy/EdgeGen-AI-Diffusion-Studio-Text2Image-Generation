import React from 'react';
import { ImageStyle } from '../types';
import { IMAGE_STYLES } from '../constants/presets';

interface StyleSelectorProps {
  value: ImageStyle;
  onChange: (value: ImageStyle) => void;
  disabled?: boolean;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-400">Image Style</label>
        <span className="text-[11px] text-slate-400">Prompt enhancement</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 p-1 rounded-xl bg-black/30 border border-white/[0.06]">
        {IMAGE_STYLES.map((style) => {
          const isSelected = value === style.id;
          return (
            <button
              key={style.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(style.id)}
              title={style.description}
              className={`py-2 px-2.5 rounded-lg text-xs font-medium transition-all text-center truncate ${
                isSelected
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {style.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
