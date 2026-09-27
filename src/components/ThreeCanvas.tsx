import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Scene3DData, Scene3DObject } from '../types/scene';
import { disposeObjectTree, disposeScene } from '../utils/disposeScene';
import { TransformHUD } from './TransformHUD';

interface ThreeCanvasProps {
  sceneData: Scene3DData | null;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  wireframeMode: boolean;
  onExportStart?: () => void;
  onExportComplete?: (filename: string) => void;
  onExportError?: (error: string) => void;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  sceneData,
  selectedObjectId,
  onSelectObject,
  wireframeMode,
  onExportStart,
  onExportComplete,
  onExportError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const meshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // On-demand rendering synchronization flags
  const needsRenderRef = useRef<boolean>(true);
  const isAnimatingRef = useRef<boolean>(false);
  const autoRotateRef = useRef<boolean>(false);
  const animFrameIdRef = useRef<number | null>(null);

  // Viewport Settings
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isTakingSnapshot, setIsTakingSnapshot] = useState<boolean>(false);
  const [hoveredPartName, setHoveredPartName] = useState<string | null>(null);

  // Sync ref with state
  useEffect(() => {
    autoRotateRef.current = autoRotate;
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
    if (autoRotate) {
      startContinuousAnimation();
    } else {
      requestSingleRender();
    }
  }, [autoRotate]);

  /**
   * Request a single frame render on the next animation frame.
   */
  const requestSingleRender = useCallback(() => {
    needsRenderRef.current = true;
    if (!isAnimatingRef.current) {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      animFrameIdRef.current = requestAnimationFrame(() => {
        renderFrame();
        animFrameIdRef.current = null;
      });
    }
  }, []);

  /**
   * Trigger continuous rendering during camera movement or auto-rotation
   */
  const startContinuousAnimation = useCallback((durationMs?: number) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    const startTime = performance.now();

    const loop = (now: number) => {
      const elapsed = now - startTime;
      const keepGoing = autoRotateRef.current || (durationMs !== undefined && elapsed < durationMs);

      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderFrame();

      if (keepGoing) {
        animFrameIdRef.current = requestAnimationFrame(loop);
      } else {
        isAnimatingRef.current = false;
        animFrameIdRef.current = null;
        renderFrame();
      }
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
  }, []);

  /**
   * Performs the actual single WebGL render call
   */
  const renderFrame = () => {
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      needsRenderRef.current = false;
    }
  };

  // Setup Three.js Scene and Renderer
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 460;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(sceneData?.backgroundColor || '#080a10');
    scene.fog = new THREE.FogExp2(sceneData?.backgroundColor || '#080a10', 0.035);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3.8, 3.2, 4.2);
    cameraRef.current = camera;

    // 3. Renderer with soft shadows & ACES Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // Screen reader accessible fallback content and aria attributes
    const canvasElement = renderer.domElement;
    canvasElement.setAttribute('role', 'img');
    canvasElement.setAttribute(
      'aria-label',
      sceneData?.title
        ? `Interactive 3D model viewport of ${sceneData.title}. Use mouse drag or touch to rotate, scroll to zoom, right-click to pan.`
        : 'Interactive 3D model viewport: use mouse or keyboard to rotate and inspect.'
    );
    canvasElement.setAttribute('tabindex', '0');
    canvasElement.innerHTML = `
      <p class="sr-only">
        Interactive 3D model viewport: use mouse drag, touch gestures, or keyboard controls to rotate, pan, and inspect the 3D scene mesh hierarchy.
      </p>
    `;

    container.innerHTML = '';
    container.appendChild(canvasElement);
    rendererRef.current = renderer;

    // 4. Controls with On-Demand Change Listener
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 1.0;
    controls.maxDistance = 20.0;
    controls.autoRotate = autoRotateRef.current;
    controls.autoRotateSpeed = 1.5;
    controls.target.set(0, 1.3, 0);
    controlsRef.current = controls;

    controls.addEventListener('change', () => {
      requestSingleRender();
    });

    const handleControlStart = () => {
      startContinuousAnimation(1200);
    };
    controls.addEventListener('start', handleControlStart);

    // 5. Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.9);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(5, 10, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.camera.left = -4;
    dirLight.shadow.camera.right = 4;
    dirLight.shadow.camera.top = 4;
    dirLight.shadow.camera.bottom = -4;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.7);
    fillLight.position.set(-6, 4, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa78bfa, 0.5);
    rimLight.position.set(0, 5, -8);
    scene.add(rimLight);

    // 6. Ground Shadow Plane & Grid
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.ShadowMaterial({
      opacity: 0.45,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.005;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    const grid = new THREE.GridHelper(16, 32, 0x3b82f6, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);
    gridHelperRef.current = grid;

    const modelGroup = new THREE.Group();
    modelGroup.name = 'AI_3D_Generated_Model';
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Resize handler
    let resizeRaf: number | null = null;
    const handleResize = () => {
      if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        if (!container || !camera || !renderer) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        requestSingleRender();
      });
    };

    window.addEventListener('resize', handleResize);

    // Raycasting for clicking objects
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(modelGroup.children, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const hitId = hit.userData?.id;
        if (hitId) {
          onSelectObject(hitId);
        }
      } else {
        onSelectObject(null);
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(modelGroup.children, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        setHoveredPartName(hit.userData?.name || 'Mesh Part');
      } else {
        setHoveredPartName(null);
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);

    // Initial render
    requestSingleRender();

    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (resizeRaf !== null) {
        cancelAnimationFrame(resizeRaf);
      }
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('start', handleControlStart);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);

      disposeScene(scene, renderer);

      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      modelGroupRef.current = null;
      gridHelperRef.current = null;
      meshMapRef.current.clear();
    };
  }, []);

  // Update Grid
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
      requestSingleRender();
    }
  }, [showGrid, requestSingleRender]);

  // Build Scene Meshes when sceneData changes
  useEffect(() => {
    const scene = sceneRef.current;
    const modelGroup = modelGroupRef.current;
    if (!scene || !modelGroup) return;

    disposeObjectTree(modelGroup);
    meshMapRef.current.clear();

    // Update canvas accessible label for screen readers
    if (rendererRef.current) {
      rendererRef.current.domElement.setAttribute(
        'aria-label',
        sceneData?.title
          ? `Interactive 3D model viewport of ${sceneData.title}. Use mouse drag or touch to rotate, scroll to zoom, right-click to pan.`
          : 'Interactive 3D model viewport: use mouse or keyboard to rotate and inspect.'
      );
    }

    if (!sceneData || !sceneData.objects || sceneData.objects.length === 0) {
      requestSingleRender();
      return;
    }

    if (sceneData.backgroundColor) {
      scene.background = new THREE.Color(sceneData.backgroundColor);
      if (scene.fog) {
        scene.fog.color = new THREE.Color(sceneData.backgroundColor);
      }
    }

    sceneData.objects.forEach((obj: Scene3DObject) => {
      const mesh = createMeshForObject(obj, wireframeMode, selectedObjectId === obj.id);
      if (mesh) {
        mesh.userData = {
          id: obj.id,
          name: obj.name,
          shape: obj.shape,
          originalColor: obj.color,
          roughness: obj.roughness,
          metalness: obj.metalness,
        };
        modelGroup.add(mesh);
        meshMapRef.current.set(obj.id, mesh);
      }
    });

    const box = new THREE.Box3().setFromObject(modelGroup);
    if (!box.isEmpty()) {
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 2.0);

      if (controlsRef.current) {
        controlsRef.current.target.copy(center);
      }

      if (cameraRef.current) {
        const fov = cameraRef.current.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.6;
        cameraZ = Math.max(cameraZ, 3.5);

        const customPos = sceneData.suggestedCameraPosition;
        if (customPos && customPos.length === 3) {
          cameraRef.current.position.set(customPos[0], customPos[1], customPos[2]);
        } else {
          cameraRef.current.position.set(center.x + cameraZ * 0.8, center.y + cameraZ * 0.7, center.z + cameraZ * 0.9);
        }
        cameraRef.current.lookAt(center);
        controlsRef.current?.update();
      }
    }

    startContinuousAnimation(800);
  }, [sceneData]);

  // Update wireframe / selection highlighting dynamically
  useEffect(() => {
    meshMapRef.current.forEach((mesh, id) => {
      const isSelected = id === selectedObjectId;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.wireframe = wireframeMode;
        if (isSelected) {
          mat.emissive = new THREE.Color(0x38bdf8);
          mat.emissiveIntensity = 0.45;
        } else {
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0;
        }
      }
    });
    requestSingleRender();
  }, [wireframeMode, selectedObjectId, requestSingleRender]);

  const createMeshForObject = (
    obj: Scene3DObject,
    wireframe: boolean,
    isSelected: boolean
  ): THREE.Mesh | null => {
    let geometry: THREE.BufferGeometry;
    const dim = obj.dimensions || {};

    try {
      switch (obj.shape) {
        case 'box': {
          geometry = new THREE.BoxGeometry(
            dim.width || 1,
            dim.height || 1,
            dim.depth || 1
          );
          break;
        }
        case 'cylinder': {
          geometry = new THREE.CylinderGeometry(
            dim.radiusTop ?? dim.radius ?? 0.5,
            dim.radiusBottom ?? dim.radius ?? 0.5,
            dim.height || 1,
            dim.radialSegments || 32
          );
          break;
        }
        case 'sphere': {
          geometry = new THREE.SphereGeometry(
            dim.radius || 0.6,
            dim.radialSegments || 32,
            dim.radialSegments ? Math.floor(dim.radialSegments * 0.75) : 24
          );
          break;
        }
        case 'cone': {
          geometry = new THREE.ConeGeometry(
            dim.radius || 0.6,
            dim.height || 1.2,
            dim.radialSegments || 32
          );
          break;
        }
        case 'torus': {
          geometry = new THREE.TorusGeometry(
            dim.radius || 0.8,
            dim.tube || 0.18,
            24,
            dim.radialSegments || 36
          );
          break;
        }
        case 'capsule': {
          geometry = new THREE.CapsuleGeometry(
            dim.radius || 0.4,
            dim.height || 0.8,
            16,
            dim.radialSegments || 24
          );
          break;
        }
        case 'ring': {
          geometry = new THREE.RingGeometry(
            dim.innerRadius || 0.3,
            dim.outerRadius || 0.8,
            32
          );
          break;
        }
        case 'extruded_polygon': {
          if (obj.polygonPoints && obj.polygonPoints.length >= 3) {
            const shape = new THREE.Shape();
            shape.moveTo(obj.polygonPoints[0][0], obj.polygonPoints[0][1]);
            for (let i = 1; i < obj.polygonPoints.length; i++) {
              shape.lineTo(obj.polygonPoints[i][0], obj.polygonPoints[i][1]);
            }
            shape.closePath();
            geometry = new THREE.ExtrudeGeometry(shape, {
              depth: obj.extrudeDepth || 0.25,
              bevelEnabled: obj.bevelEnabled ?? true,
              bevelSegments: 2,
              steps: 1,
              bevelSize: 0.02,
              bevelThickness: 0.02,
            });
          } else {
            geometry = new THREE.BoxGeometry(dim.width || 1, dim.height || 1, dim.depth || 0.25);
          }
          break;
        }
        default:
          geometry = new THREE.BoxGeometry(dim.width || 1, dim.height || 1, dim.depth || 1);
      }
    } catch (e) {
      console.warn('Fallback to BoxGeometry for', obj.name, e);
      geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(obj.color || '#3b82f6'),
      roughness: obj.roughness ?? 0.3,
      metalness: obj.metalness ?? 0.1,
      wireframe: wireframe,
      transparent: obj.transparent || (obj.opacity !== undefined && obj.opacity < 1),
      opacity: obj.opacity ?? 1.0,
      emissive: isSelected ? new THREE.Color(0x38bdf8) : new THREE.Color(0x000000),
      emissiveIntensity: isSelected ? 0.45 : 0,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = obj.name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
    mesh.rotation.set(
      THREE.MathUtils.degToRad(obj.rotation[0]),
      THREE.MathUtils.degToRad(obj.rotation[1]),
      THREE.MathUtils.degToRad(obj.rotation[2])
    );
    mesh.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);

    if (obj.visible === false) {
      mesh.visible = false;
    }

    return mesh;
  };

  const handleExportGLB = useCallback(async () => {
    const modelGroup = modelGroupRef.current;
    if (!modelGroup || modelGroup.children.length === 0) {
      onExportError?.('No active 3D model in the scene to export.');
      return;
    }

    setIsExporting(true);
    onExportStart?.();

    try {
      const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
      const exporter = new GLTFExporter();
      const exportOptions = {
        binary: true,
        onlyVisible: true,
        embedImages: true,
      };

      exporter.parse(
        modelGroup,
        (gltf) => {
          setIsExporting(false);
          const blob = new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const cleanTitle = (sceneData?.title || '3d_scene')
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '_');
          const filename = `${cleanTitle}.glb`;
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          onExportComplete?.(filename);
        },
        (error) => {
          setIsExporting(false);
          console.error('GLTFExporter error:', error);
          onExportError?.('Failed to export GLB model: ' + String(error));
        },
        exportOptions
      );
    } catch (err: unknown) {
      setIsExporting(false);
      const errMsg = err instanceof Error ? err.message : 'Unknown export error';
      onExportError?.(errMsg);
    }
  }, [sceneData, onExportStart, onExportComplete, onExportError]);

  const handleTakeSnapshot = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    setIsTakingSnapshot(true);
    try {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
      const a = document.createElement('a');
      const cleanTitle = (sceneData?.title || '3d_scene')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_');
      a.href = dataUrl;
      a.download = `${cleanTitle}_snapshot.png`;
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsTakingSnapshot(false), 400);
    }
  };

  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current || !modelGroupRef.current) return;
    const box = new THREE.Box3().setFromObject(modelGroupRef.current);
    const center = box.isEmpty() ? new THREE.Vector3(0, 1.2, 0) : box.getCenter(new THREE.Vector3());
    controlsRef.current.target.copy(center);
    cameraRef.current.position.set(3.8, 3.2, 4.2);
    cameraRef.current.lookAt(center);
    controlsRef.current.update();
    startContinuousAnimation(600);
  };

  const handleSetCameraAngle = (view: 'perspective' | 'front' | 'top' | 'side') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const target = controlsRef.current.target;
    const dist = 5.2;

    switch (view) {
      case 'front':
        cameraRef.current.position.set(target.x, target.y, target.z + dist);
        break;
      case 'top':
        cameraRef.current.position.set(target.x, target.y + dist, target.z + 0.001);
        break;
      case 'side':
        cameraRef.current.position.set(target.x + dist, target.y, target.z);
        break;
      case 'perspective':
      default:
        cameraRef.current.position.set(target.x + 3.5, target.y + 2.8, target.z + 3.8);
        break;
    }
    cameraRef.current.lookAt(target);
    controlsRef.current.update();
    startContinuousAnimation(500);
  };

  return (
    <div
      role="region"
      aria-label="3D Viewport canvas and controls"
      className={`relative w-full h-full min-h-[460px] flex flex-col bg-neutral-950 overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50' : 'rounded-2xl border border-neutral-800 shadow-2xl'
      }`}
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing focus:outline-none"
      />

      {/* Accessible Transform HUD (Top & Bottom Controls) */}
      <TransformHUD
        sceneData={sceneData}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onSetCameraAngle={handleSetCameraAngle}
        onResetCamera={handleResetCamera}
        isExporting={isExporting}
        onExportGLB={handleExportGLB}
        isTakingSnapshot={isTakingSnapshot}
        onTakeSnapshot={handleTakeSnapshot}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        hoveredPartName={hoveredPartName}
        selectedObjectId={selectedObjectId}
      />
    </div>
  );
};
