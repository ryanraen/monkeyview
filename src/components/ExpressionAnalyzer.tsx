import { useCallback, useEffect, useRef } from 'react';
import { initMonkeyAssets } from '../utils/monkeyMapper';
import { loadVisionModels, computeSmileIntensity, computeMouthOpen, distance2D } from '../utils/visionUtils';

type Props = {
  videoEl: HTMLVideoElement | null;
  onMonkeyChange: (imagePath: string, label: string) => void;
  intervalMs?: number;
};

export default function ExpressionAnalyzer({ videoEl, onMonkeyChange, intervalMs = 400 }: Props) {
  const modelsRef = useRef<Awaited<ReturnType<typeof loadVisionModels>> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastRunRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadVisionModels(), initMonkeyAssets()]).then(([m]) => {
      if (!cancelled) modelsRef.current = m;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const analyze = useCallback(async () => {
    if (!videoEl || !modelsRef.current) return;
    const { face, pose, hands } = modelsRef.current;
    if (!face || !pose || !hands) return;

    const video = videoEl;
    if (video.readyState < 2) return; // wait until enough data
    const ts = performance.now();
    const faceResult = await face.detectForVideo(video, ts);
    const poseResult = await pose.detectForVideo(video, ts);
    const handsResult = await hands.detectForVideo(video, ts);

    // Extract simple features
    const faceLandmarks = faceResult?.faceLandmarks?.[0];
    const mouthLeft = faceLandmarks?.[61];
    const mouthRight = faceLandmarks?.[291];
    const upperLip = faceLandmarks?.[13];
    const lowerLip = faceLandmarks?.[14];
    const leftEyeOuter = faceLandmarks?.[33];
    const rightEyeOuter = faceLandmarks?.[263];
    const rightBrow = faceLandmarks?.[70];
    const leftBrow = faceLandmarks?.[300];
    const smile = computeSmileIntensity(
      mouthLeft && mouthRight ? [mouthLeft, mouthRight] : undefined
    );
    const eyeDist = leftEyeOuter && rightEyeOuter ? Math.hypot(leftEyeOuter.x - rightEyeOuter.x, leftEyeOuter.y - rightEyeOuter.y) : undefined;
    const mouthOpen = computeMouthOpen(upperLip, lowerLip, eyeDist);

    const poseLm = (poseResult as any)?.landmarks?.[0] || (poseResult as any)?.poseLandmarks?.[0];
    const rightWrist = poseLm?.[16];
    const leftWrist = poseLm?.[15];
    // Simplified pointing: any wrist clearly above the face reference line
    const eyeY = leftEyeOuter && rightEyeOuter ? Math.min(leftEyeOuter.y, rightEyeOuter.y) : undefined;
    const browY = rightBrow && leftBrow ? Math.min(rightBrow.y, leftBrow.y) : rightBrow?.y;
    const faceRefY = (browY ?? eyeY ?? 0.5) + 0.05; // lower the bar so not too high
    const rightAboveFace = rightWrist && faceRefY != null ? rightWrist.y < faceRefY : false;
    const leftAboveFace = leftWrist && faceRefY != null ? leftWrist.y < faceRefY : false;
    const handAboveFace = rightAboveFace || leftAboveFace;

    // Specific mapping for provided images
    // 1) pointing_up_smiling: hand above face line + smile
    if (handAboveFace && smile > 0.12) {
      onMonkeyChange('/monkeys/pointing_up_smiling.png', 'Pointing Up Smiling');
      return;
    }
    // 2) shocked_mouth_open: mouth open only (scale-normalized)
    if (mouthOpen > 0.38) {
      onMonkeyChange('/monkeys/shocked_mouth_open.png', 'Shocked Mouth Open');
      return;
    }
    // 3) thinking_finger_in_mouth: detect wrist close to mouth center (proxy for finger near mouth)
    const mouthCenter = mouthLeft && mouthRight ? { x: (mouthLeft.x + mouthRight.x) / 2, y: (mouthLeft.y + mouthRight.y) / 2 } : undefined;
    // Prefer index fingertip when available (hands model)
    const hand0 = (handsResult as any)?.landmarks?.[0];
    const hand1 = (handsResult as any)?.landmarks?.[1];
    const INDEX_TIP = 8;
    const idx0 = hand0?.[INDEX_TIP];
    const idx1 = hand1?.[INDEX_TIP];
    const dRight = distance2D(mouthCenter as any, idx0 || rightWrist as any);
    const dLeft = distance2D(mouthCenter as any, idx1 || leftWrist as any);
    const nearMouth = Math.min(dRight, dLeft) < 0.18;
    if (nearMouth) {
      onMonkeyChange('/monkeys/thinking_finger_in_mouth.png', 'Thinking Finger In Mouth');
      return;
    }
    // 4) default neutral
    onMonkeyChange('/monkeys/neutral_expression.png', 'Neutral Expression');
  }, [onMonkeyChange, videoEl]);

  const tick = useCallback(() => {
    const now = performance.now();
    if (now - lastRunRef.current >= intervalMs) {
      lastRunRef.current = now;
      analyze();
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [analyze, intervalMs]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tick]);

  return null;
}


