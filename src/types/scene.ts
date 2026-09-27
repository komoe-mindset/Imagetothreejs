export type MeshShapeType =
  | 'box'
  | 'sphere'
  | 'cylinder'
  | 'cone'
  | 'torus'
  | 'capsule'
  | 'lathe'
  | 'extruded_polygon'
  | 'ring'
  | 'plane';

export interface Scene3DObject {
  id: string;
  name: string;
  shape: MeshShapeType;
  position: [number, number, number];
  rotation: [number, number, number]; // in degrees
  scale: [number, number, number];
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    radius?: number;
    radiusTop?: number;
    radiusBottom?: number;
    tube?: number;
    radialSegments?: number;
    innerRadius?: number;
    outerRadius?: number;
  };
  polygonPoints?: [number, number][]; // for extruded_polygon
  extrudeDepth?: number;
  bevelEnabled?: boolean;
  lathePoints?: [number, number][]; // for lathe geometry
  color: string;
  roughness: number;
  metalness: number;
  opacity?: number;
  transparent?: boolean;
  wireframe?: boolean;
  visible?: boolean;
}

export interface Scene3DData {
  title: string;
  description: string;
  category: string;
  dominantColors: string[];
  suggestedCameraPosition?: [number, number, number];
  backgroundColor?: string;
  objects: Scene3DObject[];
}

export interface GenerationProgress {
  phase: 'idle' | 'encoding' | 'analyzing' | 'synthesizing' | 'building' | 'complete' | 'error';
  message: string;
  percent: number;
}
