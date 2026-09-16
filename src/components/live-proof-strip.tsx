"use client";

import { useState } from "react";

const TABS = [
  {
    id: "acme",
    label: "Acme",
    call: "Acme Corp · Discovery",
    time: "00:14:22",
    speaker: "Sarah Chen",
    rival: "Gong",
    confidence: 0.96,
    quote:
      "We're also evaluating Gong and Chorus for the rollout.",
    slack: "#deal-room-acme",
  },
  {
    id: "vandelay",
    label: "Vandelay",
    call: "Vandelay Industries · Demo",
    time: "11:42:08",
    speaker: "Priya Shah",
    rival: "Otter.ai",
    confidence: 0.91,
    quote:
      "Our current contract with Otter expires in Q3 — what would migration look like?",
    slack: "#deal-room-vandelay",
  },
  {
    id: "stark",
    label: "Stark",
    call: "Stark Industries · Closing",
    time: "09:03:51",
    speaker: "Marcus Lee",
    rival: "Fireflies.ai",
    confidence: 0.99,
    quote:
      "Fireflies is cheaper but your competitive-intel alerts are the deciding factor.",
    slack: "#deal-room-stark",
  },
] as const;

/**
 * LiveProofStrip — tap-a-call proof section (#try-it).
 * Reuses the hero product-preview card markup verbatim (doppel-outer,
 * Live summary header, action items, Health 8.2 footer) with the
 * customer line swapped per tab quote.
 */
export default function LiveProofStrip() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = TABS[activeIdx];

  return (
    <section
      id="try-it"
      data-track-section="try-it"
      aria-label="Live proof — tap a call"
      className="bg-[#EFEFEF] pt-14 sm:pt-16 lg:pt-20 pb-14 sm:pb-16 lg:pb-20 border-t border-gray-200"
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
        <h2 className="text-[clamp(1.5rem,4vw,2.5rem)] font-medium leading-[1.1] tracking-[-0.02em] text-gray-900 mb-2">
          Don&apos;t take our word for it — tap a call.
        </h2>
        <p className="text-gray-500 text-[14px] mb-6">
          Real rival mentions, caught live with the exact line and timestamp.
        </p>

        <div className="flex gap-2 mb-6" aria-label="Sample calls">
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              aria-pressed={i === activeIdx}
              aria-label={`Show ${tab.rival} mention in ${tab.label}`}
              onClick={() => setActiveIdx(i)}
              className={`rounded-full border-2 border-gray-900 px-4 py-1.5 text-[13px] font-medium transition-colors ${
                i === activeIdx
                  ? "bg-gray-900 text-white"
                  : "text-gray-900 hover:bg-gray-900 hover:text-white"
              }`}
            >
              {tab.label} · {tab.rival} {tab.confidence.toFixed(2)}
            </button>
          ))}
        </div>

        <div className="relative max-w-xl">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rotate-[-2deg] w-24 h-6 bg-film-amber/60 border border-black/10 z-10" aria-hidden />
          <div className="doppel-outer border-2 border-film-ink shadow-[8px_8px_0_#131316]">
            <div className="doppel-inner p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#F26522] animate-pulse" />
                <span className="text-[10px] font-mono tracking-wider text-gray-400 font-medium uppercase">Live summary</span>
                <span className="ml-auto text-[9px] font-mono text-gray-300">{active.call}</span>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="shrink-0 text-[10px] font-mono font-medium text-[#F26522] bg-[#F26522]/[0.08] px-2 py-0.5 rounded-full leading-none mt-0.5">{active.speaker}</span>
                  <p className="text-[12.5px] text-gray-600 leading-snug">
                    {active.quote}{" "}
                    <span className="text-[10px] font-mono text-gray-400">· {active.time}</span>
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="shrink-0 text-[10px] font-mono font-medium text-[#2563eb] bg-[#2563eb]/[0.08] px-2 py-0.5 rounded-full leading-none mt-0.5">You</span>
                  <p className="text-[12.5px] text-gray-600 leading-snug">Understood. Want me to loop in your procurement lead next call, or send a one-pager for the consolidation review?</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Action items</span>
                  <span className="text-[10px] font-mono text-gray-300">3 found</span>
                </div>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-[11.5px] text-gray-700">
                    <span className="w-1 h-1 rounded-full bg-[#F26522]" />
                    <span className="flex-1">Send procurement one-pager</span>
                    <span className="text-[9px] font-mono text-gray-400">THU</span>
                  </li>
                  <li className="flex items-center gap-2 text-[11.5px] text-gray-700">
                    <span className="w-1 h-1 rounded-full bg-[#F26522]" />
                    <span className="flex-1">Loop in procurement lead</span>
                    <span className="text-[9px] font-mono text-gray-400">FRI</span>
                  </li>
                  <li className="flex items-center gap-2 text-[11.5px] text-gray-700">
                    <span className="w-1 h-1 rounded-full bg-[#F26522]" />
                    <span className="flex-1">Schedule Q3 vendor review</span>
                    <span className="text-[9px] font-mono text-gray-400">NEXT</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Health 8.2
                </span>
                <span className="flex items-center gap-1.5">
                  Rival: {active.rival}
                </span>
                <span className="flex items-center gap-1.5">
                  {active.slack}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
