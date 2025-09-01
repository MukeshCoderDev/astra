"use client";

import { useEffect, useMemo, useState, startTransition } from "react";
import { useNavigate } from "react-router-dom";
import ShortVideo from "./ShortVideo";
import ShortsOverlay from "./ShortsOverlay";
import { Video } from "../../types";

interface ShortsViewerProps {
  items: Video[];
  initialId?: string;
}

export default function ShortsViewer({ items, initialId }: ShortsViewerProps) {
  const initialIndex = Math.max(0, items.findIndex(i => i.id === initialId));
  const [index, setIndex] = useState(initialIndex === -1 ? 0 : initialIndex);
  const navigate = useNavigate();

  // Render only prev/current/next for performance
  const windowItems = useMemo(() => {
    const prev = items[index - 1];
    const curr = items[index];
    const next = items[index + 1];
    return [prev, curr, next].filter(Boolean) as Video[];
  }, [items, index]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") setIndex((i) => Math.min(i + 1, items.length - 1));
      if (e.key === "ArrowUp") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length]);

  // Touch swipe navigation
  useEffect(() => {
    let startY = 0;
    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dy) < 40) return;
      if (dy < 0) setIndex((i) => Math.min(i + 1, items.length - 1));
      else setIndex((i) => Math.max(i - 1, 0));
    };
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [items.length]);

  // Preconnect/prefetch next manifest to warm CDN
  useEffect(() => {
    const next = items[index + 1];
    if (!next?.hlsUrl) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "fetch";
    link.href = next.hlsUrl;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, [items, index]);

  // Update URL (replace, not push) for deep linking
  useEffect(() => {
    const id = items[index]?.id;
    if (!id) return;
    startTransition(() => {
      navigate(`/shorts/${id}`, { replace: true });
    });
  }, [index, items, navigate]);

  return (
    <div className="h-[calc(100vh-64px)] w-full overflow-hidden relative flex items-center justify-center">
      {/* Track translates vertically by index to mimic a stack without re-rendering everything */}
      <div
        className="h-full w-full relative"
        style={{ contain: "content" as any }}
      >
        {windowItems.map((v, k) => {
          // Determine if this item is active based on its relation to index
          const isCurr = (k === (items[index - 1] ? 1 : 0));
          return (
            <div key={v.id} className="absolute inset-0 flex items-center justify-center">
              <ShortVideo src={v.hlsUrl} poster={v.poster} active={isCurr} />
              <ShortsOverlay video={v} />
            </div>
          );
        })}
      </div>

      {/* Simple indicators and nav */}
      <div className="absolute top-3 left-4 text-sm opacity-80">Shorts</div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        <button 
          aria-label="Previous video" 
          onClick={() => setIndex((i) => Math.max(i - 1, 0))} 
          className="px-2 py-1 rounded bg-neutral-800/70 hover:bg-neutral-700 transition-colors disabled:opacity-50"
          disabled={index === 0}
        >
          ↑
        </button>
        <button 
          aria-label="Next video" 
          onClick={() => setIndex((i) => Math.min(i + 1, items.length - 1))} 
          className="px-2 py-1 rounded bg-neutral-800/70 hover:bg-neutral-700 transition-colors disabled:opacity-50"
          disabled={index === items.length - 1}
        >
          ↓
        </button>
      </div>
    </div>
  );
}