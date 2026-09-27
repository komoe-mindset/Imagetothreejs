import * as THREE from 'three';

/**
 * Recursively disposes all geometries, materials, textures, and child nodes
 * from a Three.js Object3D hierarchy (Mesh, Group, Scene, etc.)
 */
export function disposeObjectTree(object: THREE.Object3D): void {
  object.traverse((child) => {
    // 1. Dispose Geometries
    if ('geometry' in child && child.geometry instanceof THREE.BufferGeometry) {
      child.geometry.dispose();
    }

    // 2. Dispose Materials & Material Textures
    if ('material' in child) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const mat of materials) {
        if (!mat) continue;

        // Traverse material properties to dispose textures
        for (const key of Object.keys(mat)) {
          const val = (mat as Record<string, any>)[key];
          if (val && typeof val === 'object' && 'isTexture' in val && typeof val.dispose === 'function') {
            val.dispose();
          }
        }

        // Dispose material program and uniforms
        if (typeof mat.dispose === 'function') {
          mat.dispose();
        }
      }
    }
  });

  // Clear parent-child references
  while (object.children.length > 0) {
    const child = object.children[0];
    object.remove(child);
  }
}

/**
 * Comprehensive dispose function for an entire Three.js scene and optionally
 * the WebGLRenderer and WebGL context to completely avoid memory leaks
 * and context loss.
 */
export function disposeScene(
  scene: THREE.Scene | null,
  renderer?: THREE.WebGLRenderer | null
): void {
  if (scene) {
    disposeObjectTree(scene);
    if (scene.background && typeof (scene.background as any).dispose === 'function') {
      (scene.background as any).dispose();
    }
    if (scene.environment && typeof (scene.environment as any).dispose === 'function') {
      (scene.environment as any).dispose();
    }
    scene.clear();
  }

  if (renderer) {
    try {
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      // Nullify references
      const gl = renderer.getContext?.();
      if (gl) {
        const loseCtx = gl.getExtension('WEBGL_lose_context');
        if (loseCtx) {
          loseCtx.loseContext();
        }
      }
    } catch (e) {
      console.warn('Error during WebGLRenderer disposal:', e);
    }
  }
}
