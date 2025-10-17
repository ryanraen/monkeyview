import {
  FaceLandmarker,
  PoseLandmarker,
  HandLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision';

export type VisionModels = {
  face: FaceLandmarker | null;
  pose: PoseLandmarker | null;
  hands: HandLandmarker | null;
};

export async function loadVisionModels(): Promise<VisionModels> {
  const fileset = await FilesetResolver.forVisionTasks(
    // Use CDN-hosted WASM assets
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
  );

  const face = await FaceLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
    },
    runningMode: 'VIDEO',
    numFaces: 1,
  });

  const pose = await PoseLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
    },
    runningMode: 'VIDEO',
  });

  const hands = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
    },
    runningMode: 'VIDEO',
    numHands: 2,
  });

  return { face, pose, hands };
}

export function computeSmileIntensity(mouthLandmarks?: { x: number; y: number }[]): number {
  if (!mouthLandmarks || mouthLandmarks.length < 2) return 0;
  const [left, right] = mouthLandmarks; // corners
  const dx = right.x - left.x;
  const dy = right.y - left.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  // Heuristic normalization for 0..1 range
  return Math.max(0, Math.min(1, distance * 2));
}

export function eyebrowsRaised(eyebrowY?: number, eyeY?: number): boolean {
  if (eyebrowY == null || eyeY == null) return false;
  return eyebrowY < eyeY - 0.02; // smaller y is higher on normalized image coords
}

export function handIsRaised(wristY?: number, shoulderY?: number): boolean {
  if (wristY == null || shoulderY == null) return false;
  return wristY < shoulderY - 0.03; // add margin to be less strict
}

export function computeMouthOpen(upperLip?: { y: number }, lowerLip?: { y: number }, eyeDist?: number): number {
  if (!upperLip || !lowerLip) return 0;
  const dy = Math.max(0, (lowerLip.y - upperLip.y));
  const scale = eyeDist && eyeDist > 0 ? eyeDist : 0.25; // fallback scale
  const normalized = dy / scale;
  return Math.max(0, Math.min(1, normalized * 1.8));
}

export function distance2D(a?: { x: number; y: number }, b?: { x: number; y: number }): number {
  if (!a || !b) return 1e9;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}


