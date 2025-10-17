import { useEffect, useRef } from 'react';

type CameraFeedProps = {
  onStreamReady?: (video: HTMLVideoElement) => void;
};

export default function CameraFeed({ onStreamReady }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        const video = videoRef.current!;
        if (cancelled) return;
        video.muted = true; // allow autoplay
        video.playsInline = true;
        if (video.srcObject !== stream) {
          video.srcObject = stream;
        }
        await new Promise<void>((resolve) => {
          if (video.readyState >= 1) return resolve();
          const onLoaded = () => {
            video.removeEventListener('loadedmetadata', onLoaded);
            resolve();
          };
          video.addEventListener('loadedmetadata', onLoaded, { once: true });
        });
        if (!cancelled) {
          await video.play().catch(() => {});
          onStreamReady?.(video);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Webcam error', e);
      }
    }
    start();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onStreamReady]);

  return (
    <video ref={videoRef} className="w-full h-auto rounded-lg bg-black" playsInline muted />
  );
}


