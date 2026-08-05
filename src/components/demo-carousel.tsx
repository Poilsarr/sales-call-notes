"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Crosshair, ArrowRight, Check, Radio } from "lucide-react";
import { DEMO_CALLS, sentimentClasses } from "@/lib/demo-data";

/**
 * Interactive demo carousel (Level 5.3 demo route).
 *
 * Client-only because it has two pieces of local state:
 *   - activeId: which sample call is selected
 *   - pulse:    a counter that flips every 1.8s to animate the live dot
 *
 * The page that hosts this is a server component so the carousel is the
 * only JS shipped for the page's interactive bits.
 */
export default function DemoCarousel() {
  const [activeId, setActiveId] = useState(DEMO_CALLS[0].id);
  const [pulse, setPulse] = useState(0);
  const active = DEMO_CALLS.find((c) => c.id === activeId) ?? DEMO_CALLS[0];

  useEffect(() => {
    const id = setInterval(() => setPulse((p) => p + 1), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* CALL LIST */}
        <div className="space-y-2">
          {DEMO_CALLS.map((c) => {
            const isActive = c.id === activeId;
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left rounded-2xl border p-4 transition-all ${
                  isActive
                    ? "bg-white/[0.04] border-[#F26522]/40"
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">
                    {c.stage}
                  </span>
                  <span className="text-[10px] font-mono text-white/30">{c.duration}</span>
                </div>
                <div className="text-[14px] font-semibold mb-1">{c.customer}</div>
                <div className="text-[11px] text-white/40 mb-3">{c.date} · {c.rep}</div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="inline-flex items-center gap-1 text-[#F26522]">
                    <Crosshair size={11} /> {c.mentions} competitor {c.mentions === 1 ? "mention" : "mentions"}
                  </span>
                  <span className="text-white/30">·</span>
                  <span className="text-white/50">{c.primaryCompetitor}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* DETAIL PANE */}
        <div className="space-y-4">
          {/* ALERT CARD (the hero moment) */}
          <div className="doppel-outer">
            <div className="doppel-inner bg-zinc-900/80 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-5">
                <div className={`w-2 h-2 rounded-full bg-[#F26522] ${pulse % 2 === 0 ? "animate-pulse" : "opacity-50"}`} />
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                  Live alert · {active.customer}
                </span>
              </div>
              <div className="space-y-3 font-mono text-[13px]">
                {active.transcript.slice(0, 3).map((seg, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="text-white/30 shrink-0 w-16">{seg.time}</span>
                    <span className="text-white/55 shrink-0 w-20">{seg.speaker}:</span>
                    <span className="text-white/90">&ldquo;{seg.text}&rdquo;</span>
                  </div>
                ))}
                <div className="border-t border-white/10 my-4" />
                {active.alerts.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 text-[12px]">
                    <Crosshair size={14} className="text-[#F26522] mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-semibold">Competitor detected: {a.competitor}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border ${sentimentClasses(a.sentiment)}`}>
                          {a.sentiment}
                        </span>
                        <span className="text-white/30 text-[10px] font-mono">conf {a.confidence.toFixed(2)}</span>
                      </div>
                      <div className="text-white/40">
                        {a.timestamp} · {a.speaker}: &ldquo;{a.line}&rdquo;
                      </div>
                      <div className="text-white/30 mt-1">
                        Slack ping sent to #deal-room-{active.customer.toLowerCase().split(" ")[0]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* VALUE PROPS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { title: "Per-mention ping", desc: "Slack DM the second a competitor name drops. Channel or DM — your call." },
              { title: "Cross-call trend", desc: "See which competitor is rising in your pipeline this month vs last." },
              { title: "Zero manual tagging", desc: "No spreadsheets. No rep reports. The call transcript is the source of truth." },
            ].map((v, i) => (
              <div key={i} className="doppel-outer">
                <div className="doppel-inner bg-zinc-900/60 p-5">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#F26522] mb-3">
                    <Check size={11} /> {v.title}
                  </div>
                  <p className="text-[12px] text-white/60 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="doppel-outer">
            <div className="doppel-inner bg-gradient-to-br from-zinc-900 to-zinc-900/50 p-6 sm:p-8 text-center">
              <Radio size={20} className="text-[#F26522] mx-auto mb-3" />
              <h2 className="text-[20px] sm:text-[24px] font-medium tracking-tight mb-2">
                Get this on your calls.
              </h2>
              <p className="text-white/50 text-[13px] mb-5 max-w-md mx-auto">
                Free forever for solo SDRs. Pro at $9/mo with 1,200 minutes, CRM sync, and team alerts.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2"
                >
                  <span>Start free</span>
                  <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                    <ArrowRight size={13} className="text-[#F26522]" />
                  </span>
                </Link>
                <Link
                  href="/pricing"
                  className="text-[13px] text-white/60 hover:text-white font-medium underline-offset-4 hover:underline"
                >
                  See pricing →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}