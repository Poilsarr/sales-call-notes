"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

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

const DWELL_MS = 5600;

function useIsReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

function useCountMetric(metric: string, reducedMotion: boolean) {
  const [display, setDisplay] = useState(metric);
  useEffect(() => {
    if (reducedMotion) {
      setDisplay(metric);
      return;
    }
    const m = metric.match(/^([^\d-]*)(-?\d[\d,]*\.?\d*)(.*)$/);
    if (!m) {
      setDisplay(metric);
      return;
    }
    const prefix = m[1];
    const num = m[2];
    const suffix = m[3];
    const target = parseFloat(num.replace(/,/g, ""));
    if (!Number.isFinite(target)) {
      setDisplay(metric);
      return;
    }
    const decimals = (num.split(".")[1] || "").length;
    const start = performance.now();
    const DURATION = 640;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = target * eased;
      setDisplay(
        `${prefix}${value.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}${suffix}`
      );
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [metric, reducedMotion]);
  return display;
}

export function StudioPersonaSwitcher() {
  const [activeKey, setActiveKey] = useState<PersonaKey>("vpsales");
  const [epoch, setEpoch] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(true);
  const [docHidden, setDocHidden] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useIsReducedMotion();
  const current = PERSONAS[activeKey];
  const metric = useCountMetric(current.metric, reducedMotion);
  const currentIndex = ORDER.indexOf(activeKey);

  const go = useCallback((delta: number) => {
    setActiveKey((prev) => {
      const nextIdx = (ORDER.indexOf(prev) + delta + ORDER.length) % ORDER.length;
      return ORDER[nextIdx];
    });
    setEpoch((e) => e + 1);
  }, []);

  const playing = !reducedMotion && inView && !docHidden && !hovered && !focused;

  useEffect(() => {
    if (playing) setEpoch((e) => e + 1);
  }, [playing]);

  useEffect(() => {
    const onVis = () => setDocHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const node = sectionRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setInView(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => go(1), DWELL_MS);
    return () => clearTimeout(t);
  }, [playing, activeKey, epoch, go]);

  return (
    <section
      ref={sectionRef}
      data-track-section="persona-switcher"
      aria-label="Revenue Team Roles"
      className="py-16 sm:py-20 lg:py-24 bg-white border-b border-black/[0.05] overflow-hidden"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-10 text-center">
        {/* Title */}
        <h2 className="text-[clamp(2rem,4vw,3.25rem)] font-medium tracking-[-0.03em] text-gray-900 leading-[1.1] mb-8">
          Whatever you close, Gauge works for you
        </h2>

        <div
          ref={stageRef}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={(e) => {
            if (stageRef.current && e.relatedTarget && stageRef.current.contains(e.relatedTarget as Node)) return;
            setFocused(false);
          }}
        >
          {/* Persona Selector Pills — progress hairline shows time until auto-advance */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-14" role="tablist">
            {ORDER.map((k) => {
              const p = PERSONAS[k];
              const isSelected = activeKey === k;
              return (
                <button
                  key={k}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    if (k === activeKey) {
                      setEpoch((e) => e + 1);
                      return;
                    }
                    setActiveKey(k);
                    setEpoch((e) => e + 1);
                  }}
                  className={`relative px-4 sm:px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300 ${
                    isSelected
                      ? "bg-gray-900 text-white shadow-sm scale-[1.02]"
                      : "bg-neutral-100 text-gray-600 hover:text-gray-900 hover:bg-neutral-200"
                  }`}
                >
                  <span className="relative z-10">{p.pill}</span>
                  {isSelected && !reducedMotion && (
                    <span aria-hidden="true" className="absolute inset-x-3.5 bottom-[5px] h-[2px] rounded-full overflow-hidden bg-white/20 motion-reduce:hidden">
                      <span
                        key={`${activeKey}-${epoch}`}
                        className={`block h-full w-full rounded-full origin-left bg-white/80 ${
                          playing ? "persona-progress-fill" : "persona-progress-fill persona-progress-paused"
                        }`}
                        style={{ animationDuration: `${DWELL_MS}ms` }}
                      />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Central Visual / Orb & Content Display — auto-cycling live unit */}
          <div className="max-w-2xl mx-auto flex flex-col items-center">
            {/* Baked 3D-render look: all 5 orb layers stacked, crossfade on change */}
            <div className="relative w-44 h-44 sm:w-[15rem] sm:h-[15rem] mb-10 flex items-center justify-center">
              {ORDER.map((k) => {
                const p = PERSONAS[k];
                const isActive = k === activeKey;
                return (
                  <div
                    key={k}
                    aria-hidden={!isActive}
                    className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform,filter] duration-700 ${
                      isActive
                        ? "opacity-100 scale-100 blur-0 z-10"
                        : "opacity-0 scale-[1.16] blur-md pointer-events-none"
                    }`}
                    style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
                  >
                    {/* Breathing ambient glow */}
                    <div
                      className="absolute inset-0 rounded-full persona-orb-glow"
                      style={{
                        background: `radial-gradient(circle at 50% 50%, ${p.accent}99 0%, ${p.accent}22 52%, transparent 74%)`,
                        transform: "scale(1.22)",
                        filter: "blur(22px)",
                        opacity: 0.55,
                      }}
                    />
                    {/* The 3D sphere with idle float */}
                    <div
                      className={`relative w-[10.25rem] h-[10.25rem] sm:w-[12.5rem] sm:h-[12.5rem] rounded-full overflow-hidden persona-orb-float ${
                        isActive ? "" : "pointer-events-none"
                      }`}
                      style={{
                        background: `radial-gradient(circle at 32% 27%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 26%), radial-gradient(circle at 71% 80%, ${p.accent}77 0%, rgba(255,255,255,0) 44%), radial-gradient(circle at 30% 79%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 38%), radial-gradient(circle at 50% 50%, ${p.accent} 0%, ${p.accent}EE 52%, ${p.accent}AA 74%, #26120a 90%, #0d0703 100%)`,
                        boxShadow: `inset -12px -18px 36px rgba(5,3,1,0.5), inset 10px 14px 30px rgba(255,255,255,0.14), inset 3px 4px 16px rgba(255,255,255,0.22), 0 36px 72px -14px ${p.accent}66, 0 16px 36px rgba(15,9,3,0.3)`,
                      }}
                    >
                      {/* Slow conic sheen sweep */}
                      <div
                        aria-hidden="true"
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[175%] h-[175%] rounded-full persona-orb-sheen"
                        style={{
                          background:
                            "conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.32) 48deg, rgba(255,255,255,0) 96deg)",
                          mixBlendMode: "overlay",
                        }}
                      />
                      {/* Studio film grain */}
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full opacity-[0.14] mix-blend-overlay"
                        style={{
                          backgroundImage:
                            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>\")",
                          backgroundSize: "160px 160px",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {/* Synced contact-shadow ellipse */}
              <div
                aria-hidden="true"
                className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-32 h-5 rounded-full persona-orb-shadow"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(22,12,5,0.34) 0%, rgba(22,12,5,0) 68%)",
                  filter: "blur(4px)",
                }}
              />
              {/* Live outcome copy — single overlay, crisply above the crossfading orb */}
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center pointer-events-none persona-copy-in" key={`orb-copy-${activeKey}`}>
                <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-white/70 mb-1 select-none">
                  Outcome
                </span>
                <span className="text-[26px] sm:text-[30px] font-bold text-white tracking-tight leading-none select-none drop-shadow-sm">
                  {metric}
                </span>
                <span className="text-[10px] text-white/80 font-medium mt-1 max-w-[110px] leading-tight select-none">
                  {current.metricLabel}
                </span>
              </div>
            </div>

            {/* Role Title + Description — crossfades with the auto-cycle */}
            <div key={`copy-${activeKey}`} className="contents">
              <h3 className="persona-copy-in text-[22px] sm:text-[26px] font-medium text-gray-900 tracking-tight mb-3">
                {current.title}
              </h3>
              <p
                className="persona-copy-in text-[15px] sm:text-[16px] text-gray-600 leading-relaxed mb-8 max-w-xl"
                style={{ animationDelay: "70ms", animationFillMode: "both" }}
                aria-live="polite"
              >
                {current.description}
              </p>
            </div>

            {/* Pagination Controls & CTA */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => go(-1)}
                className="w-10 h-10 rounded-full border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-100 transition-colors"
                aria-label={`Previous role (${PERSONAS[ORDER[(currentIndex - 1 + ORDER.length) % ORDER.length]].pill})`}
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
                onClick={() => go(1)}
                className="w-10 h-10 rounded-full border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-100 transition-colors"
                aria-label={`Next role (${PERSONAS[ORDER[(currentIndex + 1) % ORDER.length]].pill})`}
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
