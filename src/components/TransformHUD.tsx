import React from 'react';
import {
  RotateCcw,
  Grid,
  Maximize2,
  Minimize2,
  Download,
  Camera,
  Loader2,
  Box,
} from 'lucide-react';
import { Scene3DData } from '../types/scene';

interface TransformHUDProps {
  sceneData: Scene3DData | null;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onSetCameraAngle: (view: 'perspective' | 'front' | 'top' | 'side') => void;
  onResetCamera: () => void;
  isExporting: boolean;
  onExportGLB: () => void;
  isTakingSnapshot: boolean;
  onTakeSnapshot: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  hoveredPartName: string | null;
  selectedObjectId: string | null;
}

export const TransformHUD: React.FC<TransformHUDProps> = ({
  sceneData,
  autoRotate,
  onToggleAutoRotate,
  showGrid,
  onToggleGrid,
  onSetCameraAngle,
  onResetCamera,
  isExporting,
  onExportGLB,
  isTakingSnapshot,
  onTakeSnapshot,
  isFullscreen,
  onToggleFullscreen,
  hoveredPartName,
  selectedObjectId,
}) => {
  return (
    <>
      {/* Top Floating Controls Bar */}
      <header
        role="toolbar"
        aria-label="Viewport information and export tools"
        className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none"
      >
        {/* Model Title & Mesh Count Badge */}
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 pointer-events-auto bg-neutral-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-neutral-750 shadow-lg"
        >
          <Box className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold text-neutral-100 tracking-wide">
            {sceneData?.title || 'Interactive 3D Viewport'}
          </span>
          {sceneData?.objects && (
            <span
              aria-label={`${sceneData.objects.length} mesh objects in scene`}
              className="ml-1.5 px-2 py-0.5 text-[11px] font-mono font-medium rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/40"
            >
              {sceneData.objects.length} meshes
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Export GLB Button (Main CTA) */}
          <button
            type="button"
            role="button"
            onClick={onExportGLB}
            disabled={isExporting || !sceneData}
            aria-label={
              isExporting
                ? 'Exporting active 3D model to GLB binary format, please wait'
                : 'Export active 3D scene as GLB file'
            }
            aria-busy={isExporting}
            title="Export scene as a binary .GLB 3D model for Blender, Unity, Three.js, or Web"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            ) : (
              <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span>{isExporting ? 'Exporting GLB...' : 'Export GLB'}</span>
          </button>

          {/* Snapshot Button */}
          <button
            type="button"
            role="button"
            onClick={onTakeSnapshot}
            disabled={isTakingSnapshot}
            aria-label="Capture high-resolution PNG snapshot of 3D scene"
            title="Capture high-resolution PNG snapshot"
            className="p-2 text-neutral-200 hover:text-white bg-neutral-900/90 hover:bg-neutral-800 backdrop-blur-md rounded-xl border border-neutral-750 transition-all cursor-pointer shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            <Camera className="w-4 h-4" aria-hidden="true" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            role="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Exit Fullscreen 3D Viewport' : 'Enter Fullscreen 3D Viewport'}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen 3D View'}
            className="p-2 text-neutral-200 hover:text-white bg-neutral-900/90 hover:bg-neutral-800 backdrop-blur-md rounded-xl border border-neutral-750 transition-all cursor-pointer shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* Bottom Floating Toolbar */}
      <footer
        role="toolbar"
        aria-label="Camera orientation and viewport options"
        className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none"
      >
        {/* Left: Viewport Toggles & Camera Angles */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-xl border border-neutral-750 shadow-xl">
          {/* Auto Rotate Toggle */}
          <button
            type="button"
            role="button"
            onClick={onToggleAutoRotate}
            aria-pressed={autoRotate}
            aria-label={autoRotate ? 'Disable continuous orbit auto-rotation' : 'Enable continuous orbit auto-rotation'}
            title="Toggle Continuous Orbit Auto-Rotation"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-950 ${
              autoRotate
                ? 'bg-indigo-600/40 text-indigo-200 border border-indigo-500/50'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`}
              style={{ animationDuration: '8s' }}
              aria-hidden="true"
            />
            <span>Orbit</span>
          </button>

          {/* Grid Toggle */}
          <button
            type="button"
            role="button"
            onClick={onToggleGrid}
            aria-pressed={showGrid}
            aria-label={showGrid ? 'Hide floor reference grid' : 'Show floor reference grid'}
            title="Toggle Spatial Floor Grid"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-950 ${
              showGrid
                ? 'bg-neutral-800 text-neutral-100'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Grid className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Grid</span>
          </button>

          <div className="w-[1px] h-4 bg-neutral-750 mx-1" aria-hidden="true" />

          {/* Camera Angles Group */}
          <div
            role="group"
            aria-label="Camera preset angles"
            className="flex items-center gap-1 text-xs font-mono text-neutral-300"
          >
            <button
              type="button"
              role="button"
              onClick={() => onSetCameraAngle('perspective')}
              aria-label="Switch to 3D perspective angle"
              title="3D Perspective Angle"
              className="px-2 py-1 rounded hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-950"
            >
              3D
            </button>
            <button
              type="button"
              role="button"
              onClick={() => onSetCameraAngle('front')}
              aria-label="Switch to front orthographic view"
              title="Front Ortho View"
              className="px-2 py-1 rounded hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-950"
            >
              Front
            </button>
            <button
              type="button"
              role="button"
              onClick={() => onSetCameraAngle('side')}
              aria-label="Switch to side profile view"
              title="Side Profile View"
              className="px-2 py-1 rounded hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-950"
            >
              Side
            </button>
            <button
              type="button"
              role="button"
              onClick={() => onSetCameraAngle('top')}
              aria-label="Switch to top bird's eye view"
              title="Top Bird's Eye View"
              className="px-2 py-1 rounded hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-950"
            >
              Top
            </button>
          </div>

          <div className="w-[1px] h-4 bg-neutral-750 mx-1" aria-hidden="true" />

          {/* Reset Camera */}
          <button
            type="button"
            role="button"
            onClick={onResetCamera}
            aria-label="Reset camera position and center point"
            title="Reset camera center and focus"
            className="px-2.5 py-1 rounded text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-950"
          >
            Reset
          </button>
        </div>

        {/* Right: Hover / Selection Info Tooltip */}
        {(hoveredPartName || selectedObjectId) && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-auto bg-neutral-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-indigo-500/40 shadow-lg flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true" />
            <span className="text-xs font-medium text-neutral-100">
              {hoveredPartName || `Selected: ${selectedObjectId}`}
            </span>
          </div>
        )}
      </footer>
    </>
  );
};
