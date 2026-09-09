"use client";

import { useState, useRef } from "react";
import Image from "next/image";
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
          className="group relative block w-full rounded-2xl overflow-hidden border border-gray-200 bg-[#F5F0E6] text-left shadow-[0_18px_60px_-24px_rgba(0,0,0,0.35)] hover:border-[#F26522]/50 hover:shadow-[0_24px_80px_-24px_rgba(242,101,34,0.45)] transition-all duration-500"
          aria-label="Play The 2:14pm Call — Gauge short film (25 seconds)"
        >
          {/* Cinematic cover — real film frame at a compact 2.35:1 ratio */}
          <div className="relative flex items-center justify-center overflow-hidden" style={{ aspectRatio: "2.35 / 1" }}>
            {/* Film frame — slow Ken Burns zoom on hover */}
            <Image
              src="/videos/gauge-hero-poster.jpg"
              alt="Still from The 2:14pm Call — Gauge hero film"
              fill
              sizes="(max-width: 768px) 100vw, 896px"
              className="object-cover scale-100 group-hover:scale-[1.04] transition-transform duration-[2000ms] ease-out"
              loading="lazy"
            />
            {/* Cinematic vignette — keeps edges rich, center open */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-black/25" />
            <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_55%,rgba(0,0,0,0.35)_100%)]" />

            {/* Top chrome — film badges */}
            <div className="absolute top-0 inset-x-0 px-4 sm:px-5 py-3.5 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.18em] uppercase text-white/85 bg-black/45 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F26522] animate-pulse" />
                A short film
              </span>
              <span className="text-[10px] font-mono text-white/75 bg-black/45 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1.5">
                0:25
              </span>
            </div>

            {/* Center — play button with ping ring + title */}
            <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-4 px-6 text-center">
              <span className="relative flex">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#F26522] opacity-30 animate-ping" />
                <span className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#F26522] flex items-center justify-center shadow-xl shadow-[#F26522]/30 group-hover:scale-110 group-hover:shadow-[#F26522]/50 transition-all duration-500">
                  <Play
                    size={28}
                    className="text-white ml-1"
                    fill="currentColor"
                  />
                </span>
              </span>
              <span className="max-w-md">
                <span className="block text-white font-semibold tracking-tight text-lg sm:text-2xl leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
                  The 2:14pm Call
                </span>
                <span className="mt-1.5 inline-block text-[11px] sm:text-[12px] font-medium text-white/85 bg-black/45 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1">
                  Maya vs. the forecast — watch it in 25 seconds
                </span>
              </span>
            </div>

            {/* Bottom chrome — title + meta */}
            <div className="absolute bottom-0 inset-x-0 px-4 sm:px-5 py-3.5 flex items-center justify-between border-t border-white/10 bg-gradient-to-t from-black/50 to-transparent">
              <span className="text-[10px] font-mono tracking-[0.18em] text-white/70 uppercase">
                Gauge · Signal, not noise
              </span>
              <span className="text-[10px] font-mono text-white/60">
                HD · No sound needed
              </span>
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
            preload="none"
            onEnded={handleClose}
            poster="/videos/gauge-hero-poster.jpg"
          >
            <source src="/videos/gauge-hero-25s.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
}
