"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  poster?: string;
  active: boolean;           // only the active slide autoplays
  muted?: boolean;
  onReady?: () => void;
};

export default function ShortVideo({ src, poster, active, muted = true, onReady }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [hls, setHls] = useState<Hls | null>(null);

  // Attach HLS
  useEffect(() => {
    const video = ref.current!;
    if (!video) return;
    let _hls: Hls | null = null;

    if (Hls.isSupported()) {
      _hls = new Hls({
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 10,
        maxMaxBufferLength: 30
      });
      _hls.loadSource(src);
      _hls.attachMedia(video);
      _hls.on(Hls.Events.MANIFEST_PARSED, () => onReady?.());
      setHls(_hls);
    } else {
      // native HLS (Safari/iOS)
      video.src = src;
      onReady?.();
    }
    return () => {
      try { _hls?.destroy(); } catch {}
      setHls(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Pause when not active or not visible
  useEffect(() => {
    const v = ref.current!;
    if (!v) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!active || !e.isIntersecting) {
          v.pause();
        } else {
          // Try play muted for autoplay
          v.play().catch(() => {});
        }
      });
    }, { threshold: 0.5 });
    io.observe(v);
    return () => io.disconnect();
  }, [active]);

  // Pause on tab hidden
  useEffect(() => {
    const v = ref.current!;
    const onVis = () => { if (document.hidden) v.pause(); else if (active) v.play().catch(()=>{}); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [active]);

  // Tap to play/pause; double tap to like (emit custom)
  const onClick = () => {
    const v = ref.current!;
    if (!v) return;
    if (v.paused) v.play().catch(()=>{}); else v.pause();
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <video
        ref={ref}
        playsInline
        muted={muted}
        loop
        controls={false}
        preload="metadata"
        poster={poster}
        onClick={onClick}
        className="h-full max-h-full aspect-[9/16] rounded-lg will-change-transform"
      />
    </div>
  );
}