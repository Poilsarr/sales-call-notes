"use client";

import { useState, useRef } from "react";
import { Play, X } from "lucide-react";

/**
 * Hero video player — a lightweight inline video embed for the landing hero.
 *
 * Shows a thumbnail with a play-button overlay. On click, expands into an
 * inline <video> player. Uses the doppel-outer card system for visual
 * consistency with the rest of the landing page.
 *
 * This is the single highest-leverage conversion add identified in the
 * DESIGN_UX_AUDIT.md — static mockup → real product video.
 */
export function HeroVideoPlayer() {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    setPlaying(true);
    // Small delay so the video element mounts before we call play()
    setTimeout(() => videoRef.current?.play(), 50);
  };

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setPlaying(false);
  };

  return (
    <div>
      {!playing ? (
        <button
          onClick={handlePlay}
          className="group relative w-full rounded-2xl overflow-hidden border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 hover:border-[#F26522]/40 transition-all duration-300"
          aria-label="Play product demo video"
        >
          {/* Thumbnail / placeholder — uses a compact 2.35:1 cinematic ratio */}
          <div className="relative flex items-center justify-center" style={{ aspectRatio: "2.35 / 1" }}>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Play button */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#F26522] flex items-center justify-center shadow-lg shadow-[#F26522]/25 group-hover:scale-110 group-hover:shadow-[#F26522]/40 transition-all duration-500">
                <Play
                  size={28}
                  className="text-white ml-1"
                  fill="currentColor"
                />
              </div>
              <span className="text-[12px] sm:text-[13px] font-medium text-gray-600 group-hover:text-gray-900 transition-colors bg-white/80 backdrop-blur-sm rounded-full px-3 py-1">
                See it in action — 30s
              </span>
            </div>

            {/* Bottom bar with branding */}
            <div className="absolute bottom-0 inset-x-0 px-4 py-3 flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider text-white/70 uppercase">
                Product demo
              </span>
              <span className="text-[10px] font-mono text-white/50">0:30</span>
            </div>
          </div>
        </button>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-black">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 transition-all"
            aria-label="Close video"
          >
            <X size={16} />
          </button>

          <video
            ref={videoRef}
            className="w-full aspect-video"
            controls
            playsInline
            onEnded={handleClose}
            poster="/demo-poster.jpg"
          >
            {/* Replace with your actual demo video */}
            <source src="/demo-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
}
