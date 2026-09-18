"use client";

import { useEffect, useRef, useState } from "react";
import { Play, VolumeX, Volume2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export const HERO_SCRUBBABLE_VIDEO_SRC =
  process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || "/videos/gauge-hero-mgmt-35s.mp4";
export const HERO_SCRUBBABLE_POSTER_SRC =
  process.env.NEXT_PUBLIC_DEMO_POSTER_URL ||
  "/videos/gauge-hero-mgmt-poster.jpg";
const CAPTIONS_SRC = "/videos/gauge-hero-mgmt-captions.vtt";

export const HERO_SCRUBBABLE_FILM_SLUG = "hero-scrubbable";
// Container truth: 39s (35s story + 4s pad/outro). Matches the 4-cue VTT
// spanning 00:00–00:39 and the gauge-hero-mgmt-35s.mp4 container.
export const HERO_SCRUBBABLE_DURATION_S = 39;

const ACCENT = "#F26522";

interface ScrubLine {
  /** Seek target in seconds (inside the matching VTT cue). */
  seekS: number;
  /** mm:ss chip shown on the line. */
  stamp: string;
  /** Accessible name fragment, e.g. "hook at 2 seconds". */
  aria: string;
  speaker: string;
  text: string;
}

/**
 * 4 tappable lines — same beats as the 4 VTT cues (hook / how / notes / signal).
 * Rendered by <ScrubSummarySection/> below the fold; this component only
 * listens for `gauge:scrub` events carrying a `seekS` detail.
 */
export const HERO_SCRUBBABLE_LINES: ScrubLine[] = [
  {
    seekS: 2,
    stamp: "00:02",
    aria: "hook at 2 seconds",
    speaker: "Customer",
    text: "We're also looking at Gong — the line nobody wrote down.",
  },
  {
    seekS: 12,
    stamp: "00:12",
    aria: "how it works at 12 seconds",
    speaker: "Gauge",
    text: "Drop in the MP3, hit record, or capture Meet — no bot ever joins.",
  },
  {
    seekS: 22,
    stamp: "00:22",
    aria: "notes at 22 seconds",
    speaker: "Gauge",
    text: "A clean summary, who does what by when, and a draft follow-up.",
  },
  {
    seekS: 32,
    stamp: "00:32",
    aria: "Slack alert at 32 seconds",
    speaker: "Slack",
    text: "Rival named → exact quote, speaker, and call link ping #deal-room-acme.",
  },
];

/**
 * Hero scrubbable video — VIDEO ONLY (HOMEPAGE-V2).
 *
 * First paint = poster <img> only, zero video bytes (`preload="none"`,
 * <video> mounts only on click/scrub). Click unmutes/plays (film_play)
 * or a `gauge:scrub` CustomEvent `{seekS}` (dispatched by
 * <ScrubSummarySection/>) seeks into its VTT cue. Panel fills its column:
 * `h-full min-h-[440px] lg:min-h-[600px]`, poster/video `object-cover`.
 * Transform/opacity only.
 */
export function HeroScrubbableVideo() {
  const [activated, setActivated] = useState(false);
  const [muted, setMuted] = useState(true);
  const [controls, setControls] = useState(false);
  const [pendingSeek, setPendingSeek] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const firedRef = useRef(false);

  const firePlay = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    trackEvent("film_play", {
      film: HERO_SCRUBBABLE_FILM_SLUG,
      duration_s: HERO_SCRUBBABLE_DURATION_S,
    });
  };

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted, activated]);

  // Apply a scrub requested before the <video> mounted.
  useEffect(() => {
    if (activated && pendingSeek !== null && videoRef.current) {
      videoRef.current.currentTime = pendingSeek;
      videoRef.current.play().catch(() => {});
      setPendingSeek(null);
    }
  }, [activated, pendingSeek]);

  const handleActivate = () => {
    if (!activated) setActivated(true);
    if (muted) {
      setMuted(false);
      setControls(true);
    }
    firePlay();
    // Play after mount; effect below handles the first activation.
    requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => {});
    });
  };

  const seek = (ts: number) => {
    firePlay();
    if (!activated) {
      setActivated(true);
      setPendingSeek(ts);
      setMuted(false);
      setControls(true);
      return;
    }
    if (videoRef.current) {
      videoRef.current.currentTime = ts;
      videoRef.current.play().catch(() => {});
    }
    if (muted) {
      setMuted(false);
      setControls(true);
    }
  };

  // Below-fold scrub list drives this player via CustomEvent.
  const seekRef = useRef(seek);
  useEffect(() => {
    seekRef.current = seek;
  });
  useEffect(() => {
    const onScrub = (e: Event) => {
      const seekS = (e as CustomEvent<{ seekS: number }>).detail?.seekS;
      if (typeof seekS === "number" && Number.isFinite(seekS)) {
        seekRef.current(seekS);
      }
    };
    window.addEventListener("gauge:scrub", onScrub);
    return () => window.removeEventListener("gauge:scrub", onScrub);
  }, []);

  return (
    <div
      id="hero-video"
      className="relative h-full min-h-[440px] lg:min-h-[600px] doppel-outer border-2 border-film-ink shadow-[8px_8px_0_#131316] overflow-hidden"
    >
      <div className="doppel-inner absolute inset-0 p-0 overflow-hidden">
        {!activated ? (
          <button
            type="button"
            onClick={handleActivate}
            aria-label="Play management demo — 39 seconds, sound off"
            className="group absolute inset-0 block w-full h-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F26522] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_SCRUBBABLE_POSTER_SRC}
              alt="Management demo preview — sales-call rival alert"
              className="absolute inset-0 w-full h-full object-cover"
              fetchPriority="high"
              decoding="async"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span
                className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg ring-2 ring-white/80 transition-transform duration-200 ease-out group-hover:scale-105"
                style={{ backgroundColor: ACCENT }}
              >
                <Play size={22} className="ml-0.5" fill="currentColor" aria-hidden />
              </span>
            </span>
            <span className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-white bg-black/75 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5">
                For management — 0:39, sound off
              </span>
              <span className="shrink-0 w-11 h-11 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
                <VolumeX size={16} aria-hidden />
              </span>
            </span>
          </button>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted={muted}
              loop
              playsInline
              preload="none"
              poster={HERO_SCRUBBABLE_POSTER_SRC}
              className="absolute inset-0 w-full h-full object-cover"
              controls={controls}
              aria-label="Management demo — 39 seconds"
            >
              <source src={HERO_SCRUBBABLE_VIDEO_SRC} type="video/mp4" />
              <track
                kind="captions"
                src={CAPTIONS_SRC}
                srcLang="en"
                label="English"
                default
              />
              Your browser does not support the video tag.
            </video>
            {muted && (
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-white bg-black/75 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5">
                  For management — 0:39, sound off
                </span>
                <button
                  type="button"
                  onClick={handleActivate}
                  aria-label="Unmute hero video"
                  className="shrink-0 w-11 h-11 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  {muted ? <VolumeX size={16} aria-hidden /> : <Volume2 size={16} aria-hidden />}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
