/**
 * Face Recognition Service using face-api.js
 * Provides face detection and recognition functionality for attendance system
 */

// Dynamic import for face-api.js to avoid bundling issues
let faceapi: typeof import('face-api.js') | null = null;

// Models loaded flag
let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

// Model path (relative to public folder)
const MODEL_URL = '/models';

/**
 * Load face-api.js library and models
 * Only loads once, subsequent calls return cached promise
 */
export const loadModels = async (): Promise<void> => {
  if (modelsLoaded) return;
  
  if (loadingPromise) return loadingPromise;
  
  loadingPromise = (async () => {
    try {
      console.log('Loading face-api.js library...');
      
      // Dynamic import of face-api.js
      const faceapiModule = await import('face-api.js');
      faceapi = faceapiModule;
      
      console.log('Loading face detection models...');
      
      // Load the models we need
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      
      modelsLoaded = true;
      console.log('Face detection models loaded successfully');
    } catch (error) {
      console.error('Error loading face detection models:', error);
      loadingPromise = null;
      throw error;
    }
  })();
  
  return loadingPromise;
};

/**
 * Check if models are loaded
 */
export const areModelsLoaded = (): boolean => modelsLoaded;

/**
 * Detect faces in a video element
 * Returns detection result with face count and confidence
 */
export interface FaceDetectionResult {
  detected: boolean;
  faceCount: number;
  confidence: number;
  landmarks: boolean;
  box?: { x: number; y: number; width: number; height: number };
}

export const detectFace = async (
  videoElement: HTMLVideoElement
): Promise<FaceDetectionResult> => {
  if (!modelsLoaded || !faceapi) {
    return { detected: false, faceCount: 0, confidence: 0, landmarks: false };
  }
  
  try {
    // Create detection options
    const detectionOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 320,
      scoreThreshold: 0.5
    });
    
    // Detect with landmarks for better accuracy
    const detections = await faceapi
      .detectAllFaces(videoElement, detectionOptions)
      .withFaceLandmarks();
    
    if (detections.length === 0) {
      return { detected: false, faceCount: 0, confidence: 0, landmarks: false };
    }
    
    // Get the first (usually largest) face
    const detection = detections[0];
    const confidence = Math.round(detection.detection.score * 100);
    const box = detection.detection.box;
    
    return {
      detected: true,
      faceCount: detections.length,
      confidence,
      landmarks: true,
      box: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height
      }
    };
  } catch (error) {
    console.error('Face detection error:', error);
    return { detected: false, faceCount: 0, confidence: 0, landmarks: false };
  }
};

/**
 * Extract face descriptor (embedding) for face recognition/comparison
 */
export const getFaceDescriptor = async (
  videoElement: HTMLVideoElement
): Promise<Float32Array | null> => {
  if (!modelsLoaded || !faceapi) return null;
  
  try {
    const detectionOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 320,
      scoreThreshold: 0.5
    });
    
    const detection = await faceapi
      .detectSingleFace(videoElement, detectionOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    return detection?.descriptor || null;
  } catch (error) {
    console.error('Face descriptor error:', error);
    return null;
  }
};

/**
 * Compare two face descriptors
 * Returns similarity score (0-100, higher is more similar)
 */
export const compareFaces = (
  descriptor1: Float32Array,
  descriptor2: Float32Array
): number => {
  if (!faceapi) return 0;
  
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  // Convert distance to similarity percentage
  // Distance of 0.6 or less is typically considered a match
  const similarity = Math.max(0, Math.min(100, (1 - distance) * 100));
  return Math.round(similarity);
};

/**
 * Draw face detection overlay on canvas
 */
export const drawFaceOverlay = (
  canvas: HTMLCanvasElement,
  videoElement: HTMLVideoElement,
  result: FaceDetectionResult
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx || !result.box) return;
  
  // Match canvas size to video
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  
  // Clear previous drawings
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw face bounding box
  ctx.strokeStyle = result.detected ? '#22c55e' : '#ef4444';
  ctx.lineWidth = 3;
  ctx.strokeRect(result.box.x, result.box.y, result.box.width, result.box.height);
  
  // Draw confidence label
  if (result.detected) {
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(
      `${result.confidence}%`,
      result.box.x,
      result.box.y - 10
    );
  }
};

export default {
  loadModels,
  areModelsLoaded,
  detectFace,
  getFaceDescriptor,
  compareFaces,
  drawFaceOverlay
};
