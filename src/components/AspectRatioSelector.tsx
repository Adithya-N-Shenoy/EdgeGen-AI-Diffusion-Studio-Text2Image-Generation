import React from 'react';
import { AspectRatio } from '../types';
import { ASPECT_RATIOS } from '../constants/presets';

interface AspectRatioSelectorProps {
  value: AspectRatio;
  onChange: (value: AspectRatio) => void;
  disabled?: boolean;
}

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400">Aspect Ratio</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-black/30 border border-white/[0.06]">
        {ASPECT_RATIOS.map((option) => {
          const isSelected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.id)}
              className={`flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-indigo-600/30 text-white border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Visual mini aspect ratio box */}
              <span
                className={`inline-block rounded-xs border transition-colors ${
                  isSelected ? 'border-indigo-400 bg-indigo-400/20' : 'border-slate-500'
                } ${
                  option.id === '1:1'
                    ? 'w-3.5 h-3.5'
                    : option.id === '3:4'
                    ? 'w-3 h-4'
                    : option.id === '4:3'
                    ? 'w-4 h-3'
                    : 'w-4.5 h-2.5'
                }`}
              />
              <span>{option.label}</span>
              <span className="text-[10px] text-slate-400 font-mono">({option.ratioText})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
