"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Crosshair, ArrowRight, Radio, Check } from "lucide-react";

type CompetitorHit = {
  competitor: string;
  speaker: "Prospect" | "Agent" | "Champion";
  line: string;
  timestamp: string;
  sentiment: "negative" | "neutral" | "evaluating";
  confidence: number;
};

type DemoCall = {
  id: string;
  customer: string;
  stage: "Discovery" | "Demo" | "Negotiation" | "Procurement";
  rep: string;
  duration: string;
  date: string;
  healthScore: number;
  mentions: number;
  primaryCompetitor: string;
  transcript: Array<{ time: string; speaker: string; text: string }>;
  alerts: CompetitorHit[];
};

// Hardcoded sample data for cold-email / landing demo.
// NOT sourced from DB. Not used in production logic.
const DEMO_CALLS: DemoCall[] = [
  {
    id: "call_acme_discovery",
    customer: "Acme Corp",
    stage: "Discovery",
    rep: "Sarah Chen",
    duration: "23:14",
    date: "Today, 9:42 AM",
    healthScore: 72,
    mentions: 3,
    primaryCompetitor: "Gong",
    transcript: [
      { time: "00:02:11", speaker: "Agent", text: "Walk me through what your team is using today to capture call insights." },
      { time: "00:02:48", speaker: "Prospect", text: "Right now we have Gong on the AE side. It works, but honestly the SDR team doesn't get value out of it." },
      { time: "00:08:33", speaker: "Prospect", text: "We've been told pricing gets aggressive if we add more seats, so we never did." },
      { time: "00:14:22", speaker: "Champion", text: "I'm also evaluating Chorus and Otter for the SDR pod. This quarter we want to standardize." },
      { time: "00:19:01", speaker: "Agent", text: "What's the actual pain with Gong for the SDRs — is it the workflow or the price?" },
    ],
    alerts: [
      { competitor: "Gong", speaker: "Prospect", line: "we have Gong on the AE side", timestamp: "00:02:48", sentiment: "evaluating", confidence: 0.98 },
      { competitor: "Chorus", speaker: "Champion", line: "evaluating Chorus and Otter for the SDR pod", timestamp: "00:14:22", sentiment: "evaluating", confidence: 0.96 },
      { competitor: "Otter", speaker: "Champion", line: "evaluating Chorus and Otter for the SDR pod", timestamp: "00:14:22", sentiment: "evaluating", confidence: 0.94 },
    ],
  },
  {
    id: "call_globex_negotiation",
    customer: "Globex Industries",
    stage: "Negotiation",
    rep: "Marcus Lee",
    duration: "41:02",
    date: "Yesterday, 2:18 PM",
    healthScore: 58,
    mentions: 2,
    primaryCompetitor: "Gong",
    transcript: [
      { time: "00:05:30", speaker: "Agent", text: "How are you thinking about rollout — pilot first or full team?" },
      { time: "00:06:12", speaker: "Prospect", text: "Legal wants to compare against Gong's contract. We have an existing master agreement with them." },
      { time: "00:22:45", speaker: "Champion", text: "If you can match Gong on data residency, this is a no-brainer. Otherwise we stay put." },
    ],
    alerts: [
      { competitor: "Gong", speaker: "Prospect", line: "compare against Gong's contract", timestamp: "00:06:12", sentiment: "negative", confidence: 0.99 },
      { competitor: "Gong", speaker: "Champion", line: "match Gong on data residency", timestamp: "00:22:45", sentiment: "negative", confidence: 0.97 },
    ],
  },
  {
    id: "call_initech_demo",
    customer: "Initech",
    stage: "Demo",
    rep: "Priya Patel",
    duration: "34:50",
    date: "Yesterday, 11:05 AM",
    healthScore: 84,
    mentions: 1,
    primaryCompetitor: "Fireflies",
    transcript: [
      { time: "00:11:20", speaker: "Prospect", text: "We tried Fireflies last year. Adoption died because nobody trusted the summaries." },
      { time: "00:11:48", speaker: "Agent", text: "What specifically broke trust — accuracy, or what the summary left out?" },
      { time: "00:12:33", speaker: "Prospect", text: "Both. Our AE would re-listen to 30% of calls to verify. That defeats the point." },
    ],
    alerts: [
      { competitor: "Fireflies", speaker: "Prospect", line: "tried Fireflies last year. Adoption died", timestamp: "00:11:20", sentiment: "negative", confidence: 0.95 },
    ],
  },
  {
    id: "call_umbrella_discovery",
    customer: "Umbrella Health",
    stage: "Discovery",
    rep: "Jordan Park",
    duration: "18:45",
    date: "2 days ago",
    healthScore: 91,
    mentions: 1,
    primaryCompetitor: "Otter",
    transcript: [
      { time: "00:04:15", speaker: "Prospect", text: "We're a healthcare org. Otter's privacy posture is shaky. Their lawsuit last year killed it for us." },
    ],
    alerts: [
      { competitor: "Otter", speaker: "Prospect", line: "Otter's privacy posture is shaky. Their lawsuit last year killed it", timestamp: "00:04:15", sentiment: "negative", confidence: 0.99 },
    ],
  },
  {
    id: "call_soylent_procurement",
    customer: "Soylent Logistics",
    stage: "Procurement",
    rep: "Sarah Chen",
    duration: "52:30",
    date: "3 days ago",
    healthScore: 45,
    mentions: 4,
    primaryCompetitor: "Gong",
    transcript: [
      { time: "00:03:22", speaker: "Champion", text: "Procurement pushed back. They're deep in a Gong renewal cycle." },
      { time: "00:18:40", speaker: "Prospect", text: "Look, Gong works. We don't need another transcription tool. We need competitive intel." },
    ],
    alerts: [
      { competitor: "Gong", speaker: "Champion", line: "deep in a Gong renewal cycle", timestamp: "00:03:22", sentiment: "negative", confidence: 0.97 },
      { competitor: "Gong", speaker: "Prospect", line: "We don't need another transcription tool", timestamp: "00:18:40", sentiment: "negative", confidence: 0.92 },
    ],
  },
];

function sentimentClasses(s: CompetitorHit["sentiment"]) {
  if (s === "negative") return "bg-red-500/10 text-red-400 border-red-500/20";
  if (s === "evaluating") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return "bg-white/5 text-white/60 border-white/10";
}

export default function DemoPage() {
  const [activeId, setActiveId] = useState(DEMO_CALLS[0].id);
  const [pulse, setPulse] = useState(0);
  const active = DEMO_CALLS.find((c) => c.id === activeId) ?? DEMO_CALLS[0];

  // Animate the "live alert" pulse so the hero moment is obvious on screenshot.
  useEffect(() => {
    const id = setInterval(() => setPulse((p) => p + 1), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-white">
      {/* HEADER */}
      <header className="border-b border-white/5 sticky top-0 bg-[#0a0a0b]/90 backdrop-blur z-10">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#F26522] rotate-45" />
            <span className="text-[14px] font-semibold tracking-tight">CallNote Pro</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/40 hidden sm:inline">
              Live demo · Sample data
            </span>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[12px] rounded-full pl-4 pr-1.5 py-1.5"
            >
              <span>Start free</span>
              <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <ArrowRight size={11} className="text-[#F26522]" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pt-16 sm:pt-20 pb-8">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#F26522] mb-4">
          <Crosshair size={12} /> Competitive Intelligence, live
        </div>
        <h1 className="text-[clamp(1.75rem,5vw,3.4rem)] font-medium leading-[1.1] tracking-[-0.02em] max-w-3xl mb-4">
          See every competitor mention — the second it happens.
        </h1>
        <p className="text-white/50 text-[14px] max-w-2xl mb-2">
          Five sample calls. Real transcript moments where Gong, Chorus, Otter, and Fireflies
          entered the deal. The same engine runs on every paid plan.
        </p>
        <p className="text-white/30 text-[12px]">
          Click a call on the left. Watch the alert panel update.
        </p>
      </section>

      {/* MAIN GRID */}
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
                  Free forever for solo SDRs. Pro at $9/mo with unlimited minutes, CRM sync, and team alerts.
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

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-6 text-center text-[11px] text-white/30">
        Sample data for product demo. Not from real customers. CallNote Pro · {new Date().getFullYear()}
      </footer>
    </main>
  );
}
