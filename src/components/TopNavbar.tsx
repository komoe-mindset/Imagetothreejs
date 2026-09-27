import React from 'react';
import { Box, Key, Wand2, Sparkles, CheckCircle2 } from 'lucide-react';

interface TopNavbarProps {
  hasApiKey: boolean;
  isGenerating: boolean;
  selectedImageUrl: string | null;
  onOpenApiKeyModal: () => void;
  onGenerate3D: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  hasApiKey,
  isGenerating,
  selectedImageUrl,
  onOpenApiKeyModal,
  onGenerate3D,
}) => {
  return (
    <header
      role="banner"
      className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo & Brand Identity */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 p-[1px] shadow-lg shadow-indigo-500/20 flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <div className="w-full h-full bg-neutral-950 rounded-[11px] flex items-center justify-center">
              <Box className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white">
                3D Genesis
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI 2D→3D
              </span>
            </div>
            <p className="text-xs text-neutral-300 hidden sm:block">
              Convert 2D images into interactive Three.js scenes & export GLB
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <nav
          role="navigation"
          aria-label="Application controls"
          className="flex items-center gap-2.5"
        >
          {/* API Key Status / Modal Trigger */}
          <button
            type="button"
            role="button"
            onClick={onOpenApiKeyModal}
            aria-label={hasApiKey ? 'Gemini API Key active, click to manage' : 'Configure Google Gemini API Key'}
            title={hasApiKey ? 'Gemini API Key configured (Click to edit or remove)' : 'Configure Gemini API Key'}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 ${
              hasApiKey
                ? 'bg-neutral-900 border-neutral-700 text-neutral-100 hover:border-neutral-500 hover:bg-neutral-800'
                : 'bg-amber-500/20 border-amber-400/40 text-amber-200 hover:bg-amber-500/30 shadow-md shadow-amber-500/10'
            }`}
          >
            <Key className="w-4 h-4 text-indigo-300 shrink-0" aria-hidden="true" />
            <span>{hasApiKey ? 'Gemini Key Active' : 'Configure API Key'}</span>
          </button>

          {/* Quick Generate Action */}
          <button
            type="button"
            role="button"
            onClick={onGenerate3D}
            disabled={isGenerating || !selectedImageUrl}
            aria-label={
              isGenerating
                ? 'Synthesizing 3D scene from 2D image, please wait'
                : 'Generate 3D scene from uploaded image'
            }
            aria-busy={isGenerating}
            title={
              !selectedImageUrl
                ? 'Please select or upload an image first'
                : isGenerating
                ? 'Generating 3D model with Gemini...'
                : 'Convert image to 3D scene'
            }
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white shadow-lg shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            <Wand2
              className={`w-4 h-4 text-amber-300 shrink-0 ${isGenerating ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">
              {isGenerating ? 'Synthesizing 3D...' : 'Generate 3D Scene'}
            </span>
            <span className="sm:hidden">
              {isGenerating ? 'Generating...' : 'Generate'}
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};
