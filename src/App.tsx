/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { TopNavbar } from './components/TopNavbar';
import { ThreeCanvas } from './components/ThreeCanvas';
import { DropzoneOverlay } from './components/DropzoneOverlay';
import { InspectorPanel } from './components/InspectorPanel';
import { ApiKeyModal } from './components/ApiKeyModal';
import { LoadingIndicator } from './components/LoadingIndicator';
import { PRESET_MODELS, PresetItem } from './data/presets';
import { Scene3DData, Scene3DObject, GenerationProgress } from './types/scene';
import { convert2DTo3D, getStoredApiKey } from './services/gemini';

export default function App() {
  // Scene State (initialize with first preset for instant interactive 3D preview)
  const [sceneData, setSceneData] = useState<Scene3DData | null>(PRESET_MODELS[0].sceneData);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);

  // Image Upload State
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(PRESET_MODELS[0].thumbnail);
  const [selectedImageName, setSelectedImageName] = useState<string | null>(PRESET_MODELS[0].name);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageMime, setSelectedImageMime] = useState<string | null>(null);

  // Generation Progress & Processing State
  const [progress, setProgress] = useState<GenerationProgress>({
    phase: 'idle',
    message: '',
    percent: 0,
  });

  // API Key State
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  // Toast / Notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 4500);
  }, []);

  // Check API Key on mount
  useEffect(() => {
    const key = getStoredApiKey();
    setHasApiKey(Boolean(key));
  }, []);

  // Handle Image Upload
  const handleImageSelected = (base64: string, mimeType: string, filename: string) => {
    setSelectedImageUrl(base64);
    setSelectedImageName(filename);
    setSelectedImageBase64(base64);
    setSelectedImageMime(mimeType);
    showToast(`Loaded ${filename}. Click "Generate 3D Scene" to convert!`, 'info');
  };

  // Handle Preset Selection
  const handlePresetSelected = (preset: PresetItem) => {
    setSelectedImageUrl(preset.thumbnail);
    setSelectedImageName(preset.name);
    setSelectedImageBase64(null);
    setSelectedImageMime(null);
    setSceneData(preset.sceneData);
    setSelectedObjectId(null);
    showToast(`Loaded preset "${preset.name}". You can inspect meshes or export GLB!`, 'success');
  };

  // Clear Image
  const handleClearImage = () => {
    setSelectedImageUrl(null);
    setSelectedImageName(null);
    setSelectedImageBase64(null);
    setSelectedImageMime(null);
  };

  // Convert 2D to 3D using Gemini
  const handleGenerate3D = async () => {
    const currentKey = getStoredApiKey();
    if (!currentKey) {
      setIsApiKeyModalOpen(true);
      showToast('Please enter your Gemini API Key to enable AI 3D generation.', 'error');
      return;
    }

    if (!selectedImageUrl) {
      showToast('Please upload an image first.', 'error');
      return;
    }

    let base64ToUse = selectedImageBase64;
    let mimeToUse = selectedImageMime || 'image/png';

    // If a preset was selected without raw base64, convert the SVG/data URI to base64
    if (!base64ToUse && selectedImageUrl) {
      try {
        const resp = await fetch(selectedImageUrl);
        const blob = await resp.blob();
        mimeToUse = blob.type || 'image/png';
        base64ToUse = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        showToast('Failed to read image data.', 'error');
        return;
      }
    }

    if (!base64ToUse) {
      showToast('No image data found to convert.', 'error');
      return;
    }

    try {
      setProgress({
        phase: 'encoding',
        message: 'Preparing image payload...',
        percent: 10,
      });

      const newScene = await convert2DTo3D(base64ToUse, mimeToUse, (p) => {
        setProgress(p);
      });

      setSceneData(newScene);
      setSelectedObjectId(null);
      setProgress({ phase: 'complete', message: 'Ready!', percent: 100 });
      showToast(`Successfully synthesized "${newScene.title}" with ${newScene.objects.length} 3D meshes!`, 'success');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown generation error';
      setProgress({ phase: 'idle', message: '', percent: 0 });
      if (errMsg.includes('MISSING_API_KEY') || errMsg.includes('INVALID_API_KEY')) {
        setIsApiKeyModalOpen(true);
      }
      showToast(errMsg, 'error');
    }
  };

  // Update a single object in the scene (material/color tweaks)
  const handleUpdateObject = (updatedObj: Scene3DObject) => {
    if (!sceneData) return;
    setSceneData({
      ...sceneData,
      objects: sceneData.objects.map((obj) => (obj.id === updatedObj.id ? updatedObj : obj)),
    });
  };

  // Export JSON Scene Graph
  const handleExportJSON = () => {
    if (!sceneData) return;
    const blob = new Blob([JSON.stringify(sceneData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sceneData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_scene.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded scene graph JSON!', 'success');
  };

  const isGenerating = progress.phase !== 'idle' && progress.phase !== 'complete';

  return (
    <div className="min-h-screen bg-[#07080d] text-neutral-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Skip Navigation Link for keyboard screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Top Navigation Bar Component */}
      <TopNavbar
        hasApiKey={hasApiKey}
        isGenerating={isGenerating}
        selectedImageUrl={selectedImageUrl}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onGenerate3D={handleGenerate3D}
      />

      {/* Main App Layout */}
      <main
        id="main-content"
        className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* Left Column: Image Dropzone, Presets, and Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          {/* Section 1: 2D Source Image & Presets */}
          <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" aria-hidden="true" />
                <h2
                  id="source-image-heading"
                  className="text-xs font-bold uppercase tracking-wider text-neutral-200"
                >
                  Step 1: Source 2D Image
                </h2>
              </div>
              <span className="text-xs text-neutral-400 font-mono">Gemini 2.5 Flash</span>
            </div>

            <DropzoneOverlay
              onImageSelected={handleImageSelected}
              onPresetSelected={handlePresetSelected}
              selectedImageUrl={selectedImageUrl}
              selectedImageName={selectedImageName}
              onClearImage={handleClearImage}
              isProcessing={isGenerating}
            />

            {/* Main AI Generation Button */}
            <button
              type="button"
              role="button"
              onClick={handleGenerate3D}
              disabled={isGenerating || !selectedImageUrl}
              aria-label="Convert uploaded 2D image into 3D scene using Gemini"
              title="Convert Image to 3D scene"
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              <Sparkles className="w-4 h-4 text-amber-300" aria-hidden="true" />
              <span>Convert Image to 3D with Gemini</span>
            </button>
          </div>

          {/* Section 2: Hierarchy Inspector & Material Tweaks */}
          <div className="flex-1 min-h-[420px]">
            <InspectorPanel
              sceneData={sceneData}
              selectedObjectId={selectedObjectId}
              onSelectObject={setSelectedObjectId}
              onUpdateObject={handleUpdateObject}
              wireframeMode={wireframeMode}
              onToggleWireframe={() => setWireframeMode(!wireframeMode)}
              onExportJSON={handleExportJSON}
            />
          </div>
        </div>

        {/* Right Column: Three.js 3D Viewport Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4 sticky top-24">
          <div className="w-full h-[620px] relative">
            <ThreeCanvas
              sceneData={sceneData}
              selectedObjectId={selectedObjectId}
              onSelectObject={setSelectedObjectId}
              wireframeMode={wireframeMode}
              onExportStart={() => showToast('Preparing binary GLB model export...', 'info')}
              onExportComplete={(filename) =>
                showToast(`Exported "${filename}" successfully! Ready for Blender/Unity/Three.js.`, 'success')
              }
              onExportError={(err) => showToast(err, 'error')}
            />
          </div>

          {/* Help & Feature Highlights Footer Bar */}
          <footer className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
              <span>
                <strong className="text-white">Features:</strong> Procedural extrusions, PBR standard materials, soft contact shadows, OrbitControls.
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-neutral-300 font-medium">
              <span>Left Click: Rotate</span>
              <span>Right Click: Pan</span>
              <span>Scroll: Zoom</span>
            </div>
          </footer>
        </div>
      </main>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={(key) => {
          setHasApiKey(Boolean(key));
          if (key) {
            showToast('Gemini API Key saved in localStorage!', 'success');
          } else {
            showToast('Gemini API Key removed.', 'info');
          }
        }}
      />

      {/* Loading Progress Indicator Overlay */}
      <LoadingIndicator progress={progress} />

      {/* Toast Notification Banner */}
      {toast && (
        <div
          role="status"
          aria-live="assertive"
          className="fixed bottom-6 right-6 z-50 animate-bounce-in max-w-sm"
        >
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border ${
              toast.type === 'success'
                ? 'bg-emerald-950 border-emerald-500/50 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950 border-rose-500/50 text-rose-200'
                : 'bg-neutral-900 border-indigo-500/50 text-neutral-100'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
            )}
            <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
