"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck, Zap, Crosshair, Users, LineChart, Building2 } from "lucide-react";

type PersonaKey = "ae" | "vpsales" | "revops" | "pmm" | "founders";

interface PersonaData {
  title: string;
  pill: string;
  headline: string;
  description: string;
  metric: string;
  metricLabel: string;
  orbBg: string;
  accent: string;
}

const PERSONAS: Record<PersonaKey, PersonaData> = {
  ae: {
    title: "Sales Reps (AEs)",
    pill: "Sales",
    headline: "Zero CRM data entry. 5 hours saved every week.",
    description:
      "Stop spending 45 minutes every evening typing summaries into HubSpot. The Chrome extension captures your call with 0 bots, extracts action items, and syncs to CRM in 60 seconds.",
    metric: "5 hrs/wk",
    metricLabel: "Time saved on CRM admin",
    orbBg: "bg-blue-600",
    accent: "#3b82f6",
  },
  vpsales: {
    title: "VP of Sales & CRO",
    pill: "VP Sales",
    headline: "Spot competitor trends across every rep's deals.",
    description:
      "Know the second Gong or Salesforce enters a pipeline deal. Gauge delivers instant Slack alerts and team radar analytics so you can coach reps before deals slip away.",
    metric: "+28%",
    metricLabel: "Competitive win-rate lift",
    orbBg: "bg-[#F26522]",
    accent: "#F26522",
  },
  revops: {
    title: "RevOps & Sales Ops",
    pill: "RevOps",
    headline: "Pristine CRM deal hygiene without chasing reps.",
    description:
      "Automate MEDDPICC, BANT, and SPICED fields directly into Salesforce and HubSpot. No empty deal stages or missing economic buyers.",
    metric: "100%",
    metricLabel: "CRM data completeness",
    orbBg: "bg-emerald-600",
    accent: "#10b981",
  },
  pmm: {
    title: "Product Marketing & CI",
    pill: "Product Marketing",
    headline: "The last mile of competitive intelligence.",
    description:
      "You spend tens of thousands on battlecards that reps forget to open. Gauge surfaces your talking points right on their screen the second a competitor is named.",
    metric: "2.1s",
    metricLabel: "Live battlecard trigger time",
    orbBg: "bg-indigo-600",
    accent: "#6366f1",
  },
  founders: {
    title: "Founding Sales Teams",
    pill: "Founders",
    headline: "Enterprise sales intelligence on a startup budget.",
    description:
      "Gong costs \$1,400/rep/year with a \$5,000 platform minimum. Gauge gives you 0-bot capture, battlecards, and CRM sync for flat \$9 to \$29/seat.",
    metric: "90%",
    metricLabel: "Cost reduction vs Gong minimums",
    orbBg: "bg-amber-600",
    accent: "#f59e0b",
  },
};

const ORDER: PersonaKey[] = ["ae", "vpsales", "revops", "pmm", "founders"];

export function StudioPersonaSwitcher() {
  const [activeKey, setActiveKey] = useState<PersonaKey>("vpsales");

  const current = PERSONAS[activeKey];
  const currentIndex = ORDER.indexOf(activeKey);

  const prev = () => {
    const nextIdx = (currentIndex - 1 + ORDER.length) % ORDER.length;
    setActiveKey(ORDER[nextIdx]);
  };

  const next = () => {
    const nextIdx = (currentIndex + 1) % ORDER.length;
    setActiveKey(ORDER[nextIdx]);
  };

  return (
    <section
      data-track-section="persona-switcher"
      aria-label="Revenue Team Roles"
      className="py-16 sm:py-20 lg:py-24 bg-white border-b border-black/[0.05] overflow-hidden"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-10 text-center">
        {/* Title (Matching Screenshot 3) */}
        <h2 className="text-[clamp(2rem,4vw,3.25rem)] font-medium tracking-[-0.03em] text-gray-900 leading-[1.1] mb-8">
          Whatever you close, Gauge works for you
        </h2>

        {/* Persona Selector Pills (Matching Screenshot 3) */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-14" role="tablist">
          {ORDER.map((k) => {
            const p = PERSONAS[k];
            const isSelected = activeKey === k;
            return (
              <button
                key={k}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveKey(k)}
                className={`px-4 sm:px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300 ${
                  isSelected
                    ? "bg-gray-900 text-white shadow-sm scale-[1.02]"
                    : "bg-neutral-100 text-gray-600 hover:text-gray-900 hover:bg-neutral-200"
                }`}
              >
                {p.pill}
              </button>
            );
          })}
        </div>

        {/* Central Visual / Orb & Content Display */}
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          {/* CSS 3D Sphere — layered radial-gradients for highlight + depth */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 mb-8 flex items-center justify-center">
            {/* Outer ambient glow ring */}
            <div
              className="absolute inset-0 rounded-full opacity-30 transition-all duration-700"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${current.accent}55 0%, transparent 70%)`,
                transform: "scale(1.18)",
                filter: "blur(18px)",
              }}
            />
            {/* The 3D sphere itself */}
            <div
              className="w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center p-4 text-center transition-all duration-700"
              style={{
                background: `radial-gradient(circle at 32% 30%, rgba(255,255,255,0.55) 0%, transparent 38%), radial-gradient(circle at 68% 72%, rgba(0,0,0,0.22) 0%, transparent 35%), radial-gradient(circle at 50% 50%, ${current.accent} 0%, ${current.accent}99 80%, #0a0a0a 100%)`,
                boxShadow: `inset -6px -6px 18px rgba(0,0,0,0.35), inset 5px 5px 14px rgba(255,255,255,0.18), 0 18px 50px ${current.accent}50, 0 6px 20px rgba(0,0,0,0.25)`,
              }}
            >
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-white/75 mb-1 select-none">
                Outcome
              </span>
              <span className="text-[26px] sm:text-[30px] font-bold text-white tracking-tight leading-none select-none drop-shadow-sm">
                {current.metric}
              </span>
              <span className="text-[10px] text-white/80 font-medium mt-1 max-w-[110px] leading-tight select-none">
                {current.metricLabel}
              </span>
            </div>
          </div>

          {/* Role Title */}
          <h3 className="text-[22px] sm:text-[26px] font-medium text-gray-900 tracking-tight mb-3">
            {current.title}
          </h3>

          {/* Role Headline & Description */}
          <p className="text-[15px] sm:text-[16px] text-gray-600 leading-relaxed mb-8 max-w-xl">
            {current.description}
          </p>

          {/* Pagination Controls & CTA (Matching Screenshot 3) */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={prev}
              className="w-10 h-10 rounded-full border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label="Previous role"
            >
              <ArrowLeft size={16} />
            </button>

            <Link
              href="/features"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all text-[13px] font-semibold"
            >
              <span>Explore features</span>
              <ArrowRight size={14} />
            </Link>

            <button
              type="button"
              onClick={next}
              className="w-10 h-10 rounded-full border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label="Next role"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
