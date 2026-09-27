import React from 'react';
import { Scene3DData, Scene3DObject } from '../types/scene';
import {
  Layers,
  Box,
  Eye,
  EyeOff,
  Sliders,
  Palette,
  FileJson,
  Check,
  Sparkles,
  Info,
} from 'lucide-react';

interface InspectorPanelProps {
  sceneData: Scene3DData | null;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onUpdateObject: (updated: Scene3DObject) => void;
  wireframeMode: boolean;
  onToggleWireframe: () => void;
  onExportJSON: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  sceneData,
  selectedObjectId,
  onSelectObject,
  onUpdateObject,
  wireframeMode,
  onToggleWireframe,
  onExportJSON,
}) => {
  if (!sceneData) {
    return (
      <div
        role="region"
        aria-label="Scene Inspector"
        className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-400 bg-neutral-900/60 rounded-2xl border border-neutral-800"
      >
        <Box className="w-10 h-10 mb-3 text-neutral-500 animate-pulse" aria-hidden="true" />
        <p className="text-sm font-semibold text-neutral-200">No 3D Model Loaded</p>
        <p className="text-xs text-neutral-400 mt-1 max-w-xs">
          Upload an image or pick a sample preset to synthesize a 3D scene graph.
        </p>
      </div>
    );
  }

  const selectedObject = sceneData.objects.find((obj) => obj.id === selectedObjectId);

  const toggleVisibility = (obj: Scene3DObject, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateObject({
      ...obj,
      visible: obj.visible !== false ? false : true,
    });
  };

  return (
    <section aria-labelledby="scene-inspector-heading" className="h-full flex flex-col space-y-4">
      {/* Scene Overview Card */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 backdrop-blur-md shadow-lg space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {sceneData.category || '3D Model'}
            </span>
            <h2 id="scene-inspector-heading" className="text-base font-bold text-white mt-1.5">
              {sceneData.title}
            </h2>
          </div>
          <button
            type="button"
            role="button"
            onClick={onExportJSON}
            aria-label="Export Scene Graph JSON"
            title="Download Scene Graph JSON"
            className="p-2 text-neutral-250 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            <FileJson className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed line-clamp-2">
          {sceneData.description}
        </p>

        {/* Color Palette */}
        {sceneData.dominantColors && sceneData.dominantColors.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-xs text-neutral-400 font-medium mr-1">Palette:</span>
            <div className="flex items-center gap-1.5" role="list" aria-label="Dominant color palette">
              {sceneData.dominantColors.map((hex, i) => (
                <div
                  key={i}
                  role="listitem"
                  aria-label={`Color swatch ${hex}`}
                  className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Viewport Display Settings */}
      <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 backdrop-blur-md flex items-center justify-between">
        <label
          htmlFor="wireframe-toggle-btn"
          className="flex items-center gap-2 text-xs font-semibold text-neutral-200 cursor-pointer"
        >
          <Sliders className="w-4 h-4 text-indigo-400" aria-hidden="true" />
          <span>Wireframe Rendering</span>
        </label>
        <button
          type="button"
          role="switch"
          id="wireframe-toggle-btn"
          aria-checked={wireframeMode}
          aria-label="Toggle wireframe rendering mode"
          onClick={onToggleWireframe}
          className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 ${
            wireframeMode ? 'bg-indigo-600' : 'bg-neutral-800'
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
              wireframeMode ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Mesh Hierarchy List */}
      <div
        role="region"
        aria-label="Scene part hierarchy"
        className="flex-1 flex flex-col min-h-0 rounded-2xl bg-neutral-900 border border-neutral-800 backdrop-blur-md overflow-hidden"
      >
        <div className="p-3.5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-100">
            <Layers className="w-4 h-4 text-indigo-400" aria-hidden="true" />
            <span>Scene Parts ({sceneData.objects.length})</span>
          </div>
          <span className="text-xs text-neutral-400">Click to focus</span>
        </div>

        <div role="list" className="flex-1 overflow-y-auto p-2 space-y-1">
          {sceneData.objects.map((obj) => {
            const isSelected = obj.id === selectedObjectId;
            const isVisible = obj.visible !== false;

            return (
              <div
                key={obj.id}
                role="listitem"
                onClick={() => onSelectObject(isSelected ? null : obj.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer group focus-within:ring-2 focus-within:ring-indigo-400 ${
                  isSelected
                    ? 'bg-indigo-600/25 border border-indigo-500/50 text-white font-medium'
                    : 'hover:bg-neutral-800 text-neutral-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-3.5 h-3.5 rounded-md border border-white/30 shrink-0"
                    style={{ backgroundColor: obj.color }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{obj.name}</p>
                    <p className="text-xs text-neutral-400 font-mono capitalize">
                      {obj.shape}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    role="button"
                    onClick={(e) => toggleVisibility(obj, e)}
                    aria-label={isVisible ? `Hide ${obj.name}` : `Show ${obj.name}`}
                    title={isVisible ? 'Hide part' : 'Show part'}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  >
                    {isVisible ? (
                      <Eye className="w-4 h-4 text-neutral-300" aria-hidden="true" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-neutral-500" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Object Detail Inspector */}
      {selectedObject && (
        <div
          role="region"
          aria-label={`Selected part properties for ${selectedObject.name}`}
          className="p-4 rounded-2xl bg-neutral-900 border border-indigo-500/40 backdrop-blur-md shadow-xl space-y-3"
        >
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/40"
                style={{ backgroundColor: selectedObject.color }}
                aria-hidden="true"
              />
              <span className="text-xs font-bold text-white truncate max-w-[160px]">
                {selectedObject.name}
              </span>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 capitalize">
              {selectedObject.shape}
            </span>
          </div>

          {/* Color & Material Properties */}
          <div className="space-y-3 text-xs">
            {/* Color Swatch / Input */}
            <div className="flex items-center justify-between">
              <label htmlFor="mesh-part-color" className="text-neutral-300 font-medium">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="mesh-part-color"
                  type="color"
                  aria-label={`Color value for ${selectedObject.name}`}
                  value={selectedObject.color}
                  onChange={(e) =>
                    onUpdateObject({
                      ...selectedObject,
                      color: e.target.value,
                    })
                  }
                  className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                />
                <span className="text-neutral-200 font-mono text-xs uppercase">
                  {selectedObject.color}
                </span>
              </div>
            </div>

            {/* Roughness Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-neutral-300 text-xs">
                <label htmlFor="mesh-part-roughness">Roughness</label>
                <span className="font-mono text-neutral-200">
                  {Math.round(selectedObject.roughness * 100)}%
                </span>
              </div>
              <input
                id="mesh-part-roughness"
                type="range"
                min="0"
                max="1"
                step="0.05"
                aria-label={`Roughness for ${selectedObject.name}`}
                value={selectedObject.roughness}
                onChange={(e) =>
                  onUpdateObject({
                    ...selectedObject,
                    roughness: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-indigo-500 h-2 bg-neutral-800 rounded-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              />
            </div>

            {/* Metalness Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-neutral-300 text-xs">
                <label htmlFor="mesh-part-metalness">Metalness</label>
                <span className="font-mono text-neutral-200">
                  {Math.round(selectedObject.metalness * 100)}%
                </span>
              </div>
              <input
                id="mesh-part-metalness"
                type="range"
                min="0"
                max="1"
                step="0.05"
                aria-label={`Metalness for ${selectedObject.name}`}
                value={selectedObject.metalness}
                onChange={(e) =>
                  onUpdateObject({
                    ...selectedObject,
                    metalness: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-indigo-500 h-2 bg-neutral-800 rounded-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              />
            </div>

            {/* Position Display */}
            <div className="pt-1 text-xs text-neutral-300 flex items-center justify-between font-mono">
              <span>Position [X,Y,Z]</span>
              <span className="text-neutral-100 font-semibold">
                {selectedObject.position.map((v) => v.toFixed(2)).join(', ')}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
