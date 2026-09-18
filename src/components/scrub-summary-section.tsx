"use client";

import { useState } from "react";
import { HERO_SCRUBBABLE_LINES } from "./hero-scrubbable-video";

const ACCENT = "#F26522";

/**
 * Scrub summary section — below-fold companion to <HeroScrubbableVideo/>.
 *
 * Renders HERO_SCRUBBABLE_LINES verbatim as tappable buttons; each tap
 * dispatches `window CustomEvent('gauge:scrub', {detail:{seekS}})` which
 * the hero player listens for (activate + seek). Tiny client island —
 * no data fetching, no other side effects.
 */
export function ScrubSummarySection() {
  const [lastScrub, setLastScrub] = useState<string | null>(null);
  const scrub = (seekS: number, stamp: string) => {
    setLastScrub(stamp);
    window.dispatchEvent(
      new CustomEvent("gauge:scrub", { detail: { seekS } }),
    );
  };

  return (
    <section
      aria-labelledby="scrub-summary-heading"
      data-track-section="scrub-summary"
      data-testid="scrub-summary"
      className="bg-white border-t border-gray-200 pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-600 mb-3">
            From the film
          </p>
          <h2
            id="scrub-summary-heading"
            className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900"
          >
            Live summary · tap a line to scrub
          </h2>
        </div>
        <div
          className="flex flex-col gap-1.5 max-w-2xl"
          role="group"
          aria-label="Scrubbable story lines"
        >
          {HERO_SCRUBBABLE_LINES.map((line) => (
            <button
              key={line.seekS}
              type="button"
              onClick={() => scrub(line.seekS, line.stamp)}
              aria-label={`Scrub to ${line.aria}`}
              className="w-full text-left flex gap-2.5 p-2.5 rounded-xl border hover:bg-[#F26522]/10 transition min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F26522] focus-visible:ring-offset-1"
              style={{
                borderColor: `${ACCENT}33`,
                backgroundColor: `${ACCENT}0F`,
              }}
            >
              <span
                className="shrink-0 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full"
                style={{ color: ACCENT, backgroundColor: `${ACCENT}14` }}
              >
                {line.speaker}
              </span>
              <span className="text-[12.5px] text-gray-700 leading-snug">
                {line.text}
              </span>
              <span className="shrink-0 text-[10px] font-mono text-gray-600">
                · {line.stamp}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-4 max-w-2xl text-[10px] text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Health 8.2
          </span>
          {" · Rival: Gong · "}
          <span>#deal-room-acme</span>
        </p>
        <p aria-live="polite" role="status" className="sr-only">
          {lastScrub ? `Scrubbed to ${lastScrub}` : ""}
        </p>
      </div>
    </section>
  );
}
