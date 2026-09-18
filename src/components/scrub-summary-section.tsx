"use client";

import { useState } from "react";
import { HERO_SCRUBBABLE_LINES } from "./hero-scrubbable-video";

const ACCENT = "#F26522";

const SPEAKER_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  Customer: { backgroundColor: "#131316", color: "#fff" },
  Gauge: { backgroundColor: ACCENT, color: "#fff" },
  Slack: { backgroundColor: "#047857", color: "#fff" },
};

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
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-14 items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-gray-600 mb-3">
              From the film
            </p>
            <h2
              id="scrub-summary-heading"
              className="text-[clamp(1.5rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-4"
            >
              Live summary · tap a line to scrub
            </h2>
            <p className="text-gray-600 text-[14px] leading-relaxed mb-6 max-w-md">
              Four beats from the 39-second film — hook, how it works, notes,
              Slack alert. Tapping a line seeks the hero player above.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[12px] font-mono">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-gray-700">
                <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Health 8.2
              </span>
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-gray-700">
                Rival: Gong
              </span>
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-gray-700">
                #deal-room-acme
              </span>
            </div>
            <p aria-live="polite" role="status" className="mt-4 text-[14px] text-gray-600 min-h-[20px]">
              {lastScrub ? `Playing from ${lastScrub} in the film above ↑` : "Pick a moment — the film jumps straight to it."}
            </p>
          </div>
          <div className="doppel-outer">
            <div
              className="doppel-inner flex flex-col gap-3 p-4 sm:p-6 bg-[#FFFDF7]"
              role="group"
              aria-label="Scrubbable story lines"
            >
              {HERO_SCRUBBABLE_LINES.map((line, i) => {
                const active = lastScrub === line.stamp;
                const speakerStyle = SPEAKER_STYLES[line.speaker] ?? {
                  backgroundColor: "#131316",
                  color: "#fff",
                };
                return (
                  <button
                    key={line.seekS}
                    type="button"
                    onClick={() => scrub(line.seekS, line.stamp)}
                    aria-label={`Scrub to ${line.aria}`}
                    aria-pressed={active}
                    className={`w-full text-left flex items-center gap-3 p-4 sm:p-5 rounded-2xl border-2 transition min-h-[64px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F26522] focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                      active
                        ? "border-gray-900 bg-white shadow-[4px_4px_0_#131316]"
                        : "border-gray-900/10 bg-white hover:border-gray-900/40 hover:shadow-[4px_4px_0_rgba(19,19,22,0.12)]"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="hidden sm:flex shrink-0 w-8 h-8 rounded-full items-center justify-center text-[12px] font-mono font-semibold text-gray-500 bg-gray-100"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex flex-col gap-1.5 min-w-0 flex-1">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span
                          className="shrink-0 text-[12px] font-mono font-semibold px-2.5 py-1 rounded-full"
                          style={speakerStyle}
                        >
                          {line.speaker}
                        </span>
                        <span className="shrink-0 text-[12px] font-mono text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
                          {line.stamp}
                        </span>
                      </span>
                      <span className="text-[14px] sm:text-[15px] text-gray-900 leading-relaxed tracking-tight">
                        {line.text}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[15px] transition-colors ${
                        active ? "text-white" : "text-gray-400 bg-gray-100"
                      }`}
                      style={active ? { backgroundColor: ACCENT } : undefined}
                    >
                      →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <p aria-live="polite" role="status" className="sr-only">
          {lastScrub ? `Scrubbed to ${lastScrub}` : ""}
        </p>
      </div>
    </section>
  );
}
