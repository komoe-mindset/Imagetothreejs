import React, { useRef, useState, useCallback, useEffect } from 'react';
import { UploadCloud, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { PRESET_MODELS, PresetItem } from '../data/presets';

interface DropzoneOverlayProps {
  onImageSelected: (base64: string, mimeType: string, filename: string) => void;
  onPresetSelected: (preset: PresetItem) => void;
  selectedImageUrl: string | null;
  selectedImageName: string | null;
  onClearImage: () => void;
  isProcessing: boolean;
}

export const DropzoneOverlay: React.FC<DropzoneOverlayProps> = ({
  onImageSelected,
  onPresetSelected,
  selectedImageUrl,
  selectedImageName,
  onClearImage,
  isProcessing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Handle file reading
  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onImageSelected(base64, file.type, file.name);
    };
    reader.readAsDataURL(file);
  }, [onImageSelected]);

  // Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Keyboard navigation for dropzone
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          processFile(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processFile]);

  return (
    <section aria-labelledby="source-image-heading" className="w-full space-y-4">
      {/* Active Upload Preview or Dropzone */}
      {selectedImageUrl ? (
        <div
          role="region"
          aria-label="Uploaded source image preview"
          className="relative rounded-2xl border border-indigo-500/40 bg-neutral-900/80 p-4 backdrop-blur-sm shadow-xl flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-750 shrink-0">
              <img
                src={selectedImageUrl}
                alt={`Uploaded source preview: ${selectedImageName || '2D input image'}`}
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <span className="truncate">{selectedImageName || '2D Source Image'}</span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5">
                Ready for Gemini 3D decomposition
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              role="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              aria-label="Change uploaded image"
              title="Upload a different image"
              className="px-3 py-1.5 text-xs font-medium text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              Change
            </button>
            <button
              type="button"
              role="button"
              onClick={onClearImage}
              disabled={isProcessing}
              aria-label="Remove active image"
              title="Remove image"
              className="p-1.5 text-neutral-300 hover:text-rose-400 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Image dropzone: drop image file or press enter to browse"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={handleKeyDown}
          className={`relative rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 ${
            isDragOver
              ? 'border-indigo-400 bg-indigo-500/15 scale-[1.01]'
              : 'border-neutral-700 hover:border-neutral-500 bg-neutral-900/60 hover:bg-neutral-900/80'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2.5">
            <div
              className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
              aria-hidden="true"
            >
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-100">
                Drop your 2D image here, or <span className="text-indigo-300 underline underline-offset-2">browse</span>
              </p>
              <p className="text-xs text-neutral-300 mt-1">
                Supports PNG, JPG, WebP, SVG • You can also press <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded border border-neutral-600 text-[10px] font-mono text-neutral-200">Ctrl+V</kbd> to paste
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        id="image-file-input"
        accept="image/*"
        aria-label="Choose 2D image file to convert"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Quick Presets Carousel */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
            <span>Or try instant sample objects</span>
          </span>
          <span className="text-xs font-normal text-neutral-400">1-click 3D scene</span>
        </div>

        <div
          role="group"
          aria-label="Preset 3D sample objects"
          className="grid grid-cols-4 gap-2"
        >
          {PRESET_MODELS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              role="button"
              onClick={() => onPresetSelected(preset)}
              disabled={isProcessing}
              aria-label={`Load preset ${preset.name} (${preset.category})`}
              title={`Load preset ${preset.name}`}
              className="group relative flex flex-col items-center p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-indigo-400/50 transition-all text-left cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-neutral-950 mb-1.5 border border-neutral-800 p-1 flex items-center justify-center">
                <img
                  src={preset.thumbnail}
                  alt={`Illustration of preset ${preset.name}`}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                />
              </div>
              <span className="text-xs font-medium text-neutral-200 truncate w-full text-center group-hover:text-white">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

// Also export alias ImageDropzone for full backward compatibility
export const ImageDropzone = DropzoneOverlay;
