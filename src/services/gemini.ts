import { Scene3DData, Scene3DObject, MeshShapeType, GenerationProgress } from '../types/scene';

// Storage key constant
export const GEMINI_API_KEY_STORAGE = 'gemini_api_key';

export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  const local = localStorage.getItem(GEMINI_API_KEY_STORAGE);
  if (local && local.trim()) return local.trim();
  // Check build-time/injected process.env.GEMINI_API_KEY
  if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY.trim();
  }
  return '';
}

export function saveApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (key.trim()) {
      localStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(GEMINI_API_KEY_STORAGE);
    }
  }
}

const SYSTEM_PROMPT = `
You are an expert 3D computer graphics engineer and spatial vision AI.
Analyze the provided 2D image (an object, vehicle, prop, character, furniture, creature, architecture, or mechanical gadget) and convert it into a coherent, high-fidelity 3D scene graph composed of 3D primitive meshes and extruded shapes in Three.js coordinates.

Coordinate system:
- Right-handed Y-up (X = left/right, Y = elevation/height, Z = depth forward/backward).
- Ground is at Y = 0. The base of the primary subject should rest around Y = 0 to Y = 0.2.
- The overall bounding box of the composite 3D object should be roughly 2.5 to 5.0 units in extent.
- Center the main subject along X=0 and Z=0.

Mesh Shapes supported:
- 'box': dimensions { width, height, depth }
- 'cylinder': dimensions { radiusTop, radiusBottom, height, radialSegments }
- 'sphere': dimensions { radius, radialSegments }
- 'cone': dimensions { radius, height, radialSegments }
- 'torus': dimensions { radius, tube, radialSegments } (e.g. handles, rims, rings, bagels, tires)
- 'capsule': dimensions { radius, height, radialSegments } (e.g. limbs, pill shapes, rounded rods)
- 'extruded_polygon': polygonPoints [[x, y], ...], extrudeDepth, bevelEnabled (for complex silhouettes, blades, wings, signs)
- 'ring': dimensions { innerRadius, outerRadius }

Output strictly valid JSON matching this exact structure:
{
  "title": "Concise Subject Name",
  "description": "Short explanation of the 3D decomposition and material fidelity",
  "category": "Product | Character | Vehicle | Prop | Architecture | Nature",
  "dominantColors": ["#hex1", "#hex2", "#hex3"],
  "suggestedCameraPosition": [3.5, 3.2, 4.2],
  "backgroundColor": "#090a12",
  "objects": [
    {
      "id": "unique_part_name",
      "name": "Human Readable Part Name",
      "shape": "box" | "cylinder" | "sphere" | "cone" | "torus" | "capsule" | "extruded_polygon" | "ring",
      "position": [x, y, z],
      "rotation": [rx_deg, ry_deg, rz_deg],
      "scale": [1, 1, 1],
      "dimensions": {
        "width": 1.0,
        "height": 1.0,
        "depth": 1.0,
        "radius": 0.5,
        "radiusTop": 0.5,
        "radiusBottom": 0.5,
        "tube": 0.15,
        "innerRadius": 0.3,
        "outerRadius": 0.8
      },
      "polygonPoints": [[0,0], [1,0], [0.8,1], [0,1]], // ONLY if shape is extruded_polygon
      "extrudeDepth": 0.2, // ONLY if shape is extruded_polygon
      "bevelEnabled": true,
      "color": "#RRGGBB",
      "roughness": 0.25, // 0.0 to 1.0
      "metalness": 0.1,  // 0.0 to 1.0
      "opacity": 1.0,
      "transparent": false
    }
  ]
}

Decomposition instructions:
1. Deconstruct the image into 4 to 16 distinct modular 3D parts so that the assembled model resembles the true 3D volume of the image.
2. Be precise with colors: sample the actual hex colors from the 2D image.
3. Realistic materials: shiny ceramics/glass (roughness 0.1-0.2, metalness 0-0.1), metals/chrome (roughness 0.1-0.3, metalness 0.8-1.0), matte plastics/fabrics (roughness 0.6-0.9, metalness 0.0).
4. If the object has rotational symmetry (cup, bottle, vase, rocket), use cylinders, cones, and toruses.
5. If the object has wings, sharp edges, or flat panels, use boxes or extruded_polygon.
`;

// Yield execution to the main thread via MessageChannel / setTimeout
// to prevent long-task frame freezing, optimizing INP and LCP
const yieldToMain = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof queueMicrotask === 'function' && typeof MessageChannel !== 'undefined') {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => resolve();
      channel.port2.postMessage(null);
    } else {
      setTimeout(resolve, 0);
    }
  });
};

export async function convert2DTo3D(
  base64Data: string,
  mimeType: string,
  onProgress?: (progress: GenerationProgress) => void
): Promise<Scene3DData> {
  const apiKey = getStoredApiKey();

  if (!apiKey) {
    throw new Error('MISSING_API_KEY: Please configure your Gemini API Key in the settings dialog.');
  }

  onProgress?.({
    phase: 'encoding',
    message: 'Analyzing pixel geometry and spatial bounds...',
    percent: 15,
  });

  await yieldToMain();

  // Clean base64 data if it contains data URI header
  const cleanBase64 = base64Data.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

  onProgress?.({
    phase: 'analyzing',
    message: 'Calling Gemini 2.5 Flash to synthesize 3D scene graph...',
    percent: 40,
  });

  const modelName = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: 'Analyze this image and generate the complete 3D scene graph matching the specified JSON schema.',
          },
          {
            inlineData: {
              mimeType: mimeType || 'image/png',
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [
        {
          text: SYSTEM_PROMPT,
        },
      ],
    },
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error';
    throw new Error(`Connection failed: ${errorMsg}. Please check your internet connection.`);
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || response.statusText;
    } catch {
      errorDetail = await response.text();
    }
    
    if (response.status === 400 || response.status === 403) {
      if (errorDetail.toLowerCase().includes('api_key') || errorDetail.toLowerCase().includes('key not valid')) {
        throw new Error('INVALID_API_KEY: The provided Gemini API Key is invalid or expired.');
      }
    }
    throw new Error(`Gemini API Error (${response.status}): ${errorDetail}`);
  }

  onProgress?.({
    phase: 'synthesizing',
    message: 'Parsing 3D scene topology and material specifications...',
    percent: 75,
  });

  const data = await response.json();
  const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textOutput) {
    throw new Error('No 3D scene structure generated from the image. Please try again.');
  }

  // Yield to allow browser layout & render before JSON normalization
  await yieldToMain();

  onProgress?.({
    phase: 'building',
    message: 'Assembling Three.js meshes and validating transformations...',
    percent: 90,
  });

  const parsedScene = await parseAndNormalizeSceneAsync(textOutput);

  onProgress?.({
    phase: 'complete',
    message: 'Scene successfully synthesized!',
    percent: 100,
  });

  return parsedScene;
}

// Asynchronous robust JSON extraction and normalization
async function parseAndNormalizeSceneAsync(rawText: string): Promise<Scene3DData> {
  let cleaned = rawText.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    // Attempt relaxed parsing or fallback regex
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (err2) {
        throw new Error('Failed to parse 3D scene JSON from model response.');
      }
    } else {
      throw new Error('Invalid JSON structure returned by Gemini.');
    }
  }

  if (!parsed || !Array.isArray(parsed.objects) || parsed.objects.length === 0) {
    throw new Error('Model returned an empty scene graph. Please try another image.');
  }

  // Yield before chunked processing if many objects
  await yieldToMain();

  const validShapes: MeshShapeType[] = [
    'box',
    'sphere',
    'cylinder',
    'cone',
    'torus',
    'capsule',
    'lathe',
    'extruded_polygon',
    'ring',
    'plane',
  ];

  const normalizedObjects: Scene3DObject[] = parsed.objects.map((obj: any, index: number) => {
    let rawShape = String(obj.shape || 'box').toLowerCase();
    // Normalize aliases
    if (rawShape === 'cube' || rawShape === 'cuboid' || rawShape === 'rect') rawShape = 'box';
    if (rawShape === 'tube' || rawShape === 'doughnut') rawShape = 'torus';
    if (rawShape === 'pyramid') rawShape = 'cone';
    if (rawShape === 'pill') rawShape = 'capsule';
    if (rawShape === 'circle' || rawShape === 'disc') rawShape = 'cylinder';

    const shape: MeshShapeType = validShapes.includes(rawShape as MeshShapeType)
      ? (rawShape as MeshShapeType)
      : 'box';

    const pos: [number, number, number] = Array.isArray(obj.position) && obj.position.length >= 3
      ? [Number(obj.position[0]) || 0, Number(obj.position[1]) || 0, Number(obj.position[2]) || 0]
      : [0, 1 + index * 0.2, 0];

    const rot: [number, number, number] = Array.isArray(obj.rotation) && obj.rotation.length >= 3
      ? [Number(obj.rotation[0]) || 0, Number(obj.rotation[1]) || 0, Number(obj.rotation[2]) || 0]
      : [0, 0, 0];

    const sca: [number, number, number] = Array.isArray(obj.scale) && obj.scale.length >= 3
      ? [
          Math.max(0.01, Number(obj.scale[0]) || 1),
          Math.max(0.01, Number(obj.scale[1]) || 1),
          Math.max(0.01, Number(obj.scale[2]) || 1),
        ]
      : [1, 1, 1];

    let color = String(obj.color || '#3b82f6').trim();
    if (!color.startsWith('#')) color = '#' + color;
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) color = '#3b82f6';

    const roughness = typeof obj.roughness === 'number' ? Math.min(1, Math.max(0, obj.roughness)) : 0.3;
    const metalness = typeof obj.metalness === 'number' ? Math.min(1, Math.max(0, obj.metalness)) : 0.1;

    return {
      id: obj.id || `mesh_${index + 1}_${shape}`,
      name: obj.name || `Part ${index + 1} (${shape})`,
      shape,
      position: pos,
      rotation: rot,
      scale: sca,
      dimensions: {
        width: Math.max(0.05, Number(obj.dimensions?.width) || 1),
        height: Math.max(0.05, Number(obj.dimensions?.height) || 1),
        depth: Math.max(0.05, Number(obj.dimensions?.depth) || 1),
        radius: Math.max(0.05, Number(obj.dimensions?.radius) || 0.5),
        radiusTop: Math.max(0.01, Number(obj.dimensions?.radiusTop) || Number(obj.dimensions?.radius) || 0.5),
        radiusBottom: Math.max(0.01, Number(obj.dimensions?.radiusBottom) || Number(obj.dimensions?.radius) || 0.5),
        tube: Math.max(0.02, Number(obj.dimensions?.tube) || 0.15),
        radialSegments: Math.max(8, Number(obj.dimensions?.radialSegments) || 24),
        innerRadius: Math.max(0.05, Number(obj.dimensions?.innerRadius) || 0.3),
        outerRadius: Math.max(0.1, Number(obj.dimensions?.outerRadius) || 0.8),
      },
      polygonPoints: Array.isArray(obj.polygonPoints) && obj.polygonPoints.length >= 3 ? obj.polygonPoints : undefined,
      extrudeDepth: Math.max(0.02, Number(obj.extrudeDepth) || 0.2),
      bevelEnabled: obj.bevelEnabled !== false,
      color,
      roughness,
      metalness,
      opacity: typeof obj.opacity === 'number' ? Math.min(1, Math.max(0, obj.opacity)) : 1.0,
      transparent: obj.transparent === true || (typeof obj.opacity === 'number' && obj.opacity < 1),
      visible: true,
    };
  });

  return {
    title: parsed.title || '3D Generated Scene',
    description: parsed.description || 'Decomposed 3D representation from 2D image',
    category: parsed.category || 'Composite Model',
    dominantColors: Array.isArray(parsed.dominantColors) ? parsed.dominantColors : ['#3b82f6', '#10b981'],
    suggestedCameraPosition: Array.isArray(parsed.suggestedCameraPosition) && parsed.suggestedCameraPosition.length === 3
      ? parsed.suggestedCameraPosition
      : [3.5, 3.2, 4.0],
    backgroundColor: parsed.backgroundColor || '#090a12',
    objects: normalizedObjects,
  };
}
