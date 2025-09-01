"use client";

import { TipButton } from "../wallet/TipButton";
import { Video } from "../../types";

interface ShortsOverlayProps {
  video: Video;
}

export default function ShortsOverlay({ video }: ShortsOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 flex">
      {/* Left: title/creator */}
      <div className="p-4 md:p-6 self-end w-[70%] space-y-2 pointer-events-auto">
        <div className="text-sm opacity-80">@{video.creator?.handle}</div>
        <div className="text-lg font-semibold line-clamp-2">{video.title}</div>
        <div className="flex gap-2 text-xs opacity-75">
          {video.tags?.slice(0,3).map((t: string) => (
            <span key={t} className="px-2 py-0.5 rounded-full bg-white/10">
              {t}
            </span>
          ))}
        </div>
      </div>
      
      {/* Right rail */}
      <div className="ml-auto flex flex-col items-center justify-end gap-3 p-3 pointer-events-auto">
        <button className="px-3 py-1.5 rounded bg-neutral-800/70 hover:bg-neutral-700 transition-colors">
          Like
        </button>
        <button className="px-3 py-1.5 rounded bg-neutral-800/70 hover:bg-neutral-700 transition-colors">
          Share
        </button>
        <TipButton 
          video={video} 
          creator={video.creator} 
          variant="icon"
          size="sm"
          className="px-3 py-1.5 rounded bg-neutral-800/70 hover:bg-neutral-700 text-white"
        />
      </div>
    </div>
  );
}