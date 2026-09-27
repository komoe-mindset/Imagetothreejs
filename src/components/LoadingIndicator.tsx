import React from 'react';
import { GenerationProgress } from '../types/scene';
import { Loader2, Cpu } from 'lucide-react';

interface LoadingIndicatorProps {
  progress: GenerationProgress;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ progress }) => {
  if (progress.phase === 'idle' || progress.phase === 'complete') return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-heading"
      aria-describedby="loading-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-sm bg-neutral-900 border border-neutral-750 rounded-3xl p-6 shadow-2xl text-center overflow-hidden text-neutral-100">
        {/* Ambient Glow */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Animated 3D Icon */}
        <div className="relative mx-auto w-16 h-16 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 animate-pulse" />
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" aria-hidden="true" />
        </div>

        {/* Phase Title */}
        <h2 id="loading-heading" className="text-base font-bold text-white mb-1.5 flex items-center justify-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" aria-hidden="true" />
          <span>Generating 3D Scene</span>
        </h2>

        {/* Phase Message */}
        <p
          id="loading-description"
          aria-live="polite"
          className="text-xs text-neutral-300 min-h-[36px] flex items-center justify-center px-2"
        >
          {progress.message}
        </p>

        {/* Progress Bar */}
        <div
          role="progressbar"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="3D scene generation progress"
          className="mt-4 space-y-1.5"
        >
          <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-mono text-neutral-400">
            <span>Gemini 2.5 Flash</span>
            <span className="font-semibold text-neutral-200">{progress.percent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
