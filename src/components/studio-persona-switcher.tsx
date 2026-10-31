"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";

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
  /** Terminator mix base for this persona's baked-3D form ("obsidian" shading) */
  deep: string;
  /** Entrance rotation settle for this persona's layer */
  spin: string;
  /** 3 key capabilities depicted inside the form */
  components: [string, string, string];
  /** Vertical offset of the chip row inside the form silhouette */
  chipsBottom: string;
  /** Optional max-width that forces the 2+1 chip wrap */
  chipsMaxW?: number;
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
    deep: "#0a1226",
    spin: "5deg",
    components: ["0 bots", "Auto CRM sync", "Action items"],
    chipsBottom: "22px",
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
    deep: "#2b1004",
    spin: "-5.5deg",
    components: ["Slack alerts", "Team radar", "Coach reps"],
    chipsBottom: "22px",
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
    deep: "#0a3a2c",
    spin: "-4deg",
    components: ["MEDDPICC fields", "CRM hygiene", "Zero chasing"],
    chipsBottom: "20px",
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
    deep: "#0e0a24",
    spin: "5deg",
    components: ["Battlecards", "Live trigger", "Competitor named"],
    chipsBottom: "12px",
    chipsMaxW: 246,
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
    deep: "#33200a",
    spin: "-6deg",
    components: ["$9-29/seat", "0 bots", "No platform min"],
    chipsBottom: "10px",
  },
};

const ORDER: PersonaKey[] = ["ae", "vpsales", "revops", "pmm", "founders"];

const DWELL_MS = 5600;

/** sRGB mix: returns `w`-fraction of accent blended into base, as hex. */
function mixHex(accent: string, base: string, w: number): string {
  const av = parseInt(accent.slice(1), 16);
  const bv = parseInt(base.slice(1), 16);
  const ch = (a: number, b: number) => Math.round(a * w + b * (1 - w));
  const r = ch((av >> 16) & 255, (bv >> 16) & 255);
  const g = ch((av >> 8) & 255, (bv >> 8) & 255);
  const b = ch(av & 255, bv & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** Studio film grain (shared SVG data-URI). */
const GRAIN_URI =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>\")";

/** Obsidian baked-sphere recipe: pushed-contrast terminator + strong speculars. */
function sphereStyle(accent: string, deep: string): CSSProperties {
  return {
    background:
      `radial-gradient(circle at 30% 21%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0) 7.5%),` +
      `radial-gradient(circle at 32% 27%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 19%),` +
      `radial-gradient(circle at 78% 86%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 56%),` +
      `radial-gradient(circle at 71% 80%, ${accent}61 0%, rgba(255,255,255,0) 42%),` +
      `radial-gradient(circle at 30% 79%, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 38%),` +
      `radial-gradient(circle at 50% 50%, ${accent} 0%, ${mixHex(accent, "#1d0d04", 0.86)} 52%, ${mixHex(accent, "#150a03", 0.56)} 68%, ${mixHex(accent, "#100902", 0.18)} 84%, #0c0602 98%)`,
    boxShadow:
      `inset -16px -24px 48px rgba(3,1,0,0.62), inset 12px 16px 34px rgba(255,255,255,0.15), ` +
      `inset 3px 5px 18px rgba(255,255,255,0.26), inset 0 0 0 1px rgba(255,255,255,0.05), ` +
      `0 42px 80px -16px ${accent}6E, 0 18px 38px rgba(14,8,3,0.34)`,
  };
}

/** Faceted grid monolith (RevOps): vertical shading + facet edge highlight. */
function monolithStyle(accent: string, deep: string): CSSProperties {
  return {
    background:
      `radial-gradient(ellipse 62% 20% at 36% 6%, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0) 70%),` +
      `linear-gradient(100deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 30%),` +
      `linear-gradient(180deg, rgba(4,14,10,0) 44%, rgba(4,14,10,0.5) 76%, rgba(2,10,8,0.82) 100%),` +
      `linear-gradient(178deg, ${accent} 0%, ${mixHex(accent, "#0a3325", 0.74)} 26%, ${mixHex(accent, "#0a3325", 0.44)} 52%, ${mixHex(accent, "#061b13", 0.18)} 80%, #030f0b 98%)`,
    boxShadow:
      `inset -20px 0 40px rgba(0,0,0,0.5), inset -12px -16px 36px rgba(0,0,0,0.55), ` +
      `inset 10px 12px 28px rgba(255,255,255,0.14), inset 3px 4px 14px rgba(255,255,255,0.2), ` +
      `0 42px 80px -18px ${accent}59, 0 16px 34px rgba(10,14,11,0.32)`,
  };
}

/** Glass lens (PMM): rim glass + deep indigo interior. */
function lensStyle(accent: string, deep: string): CSSProperties {
  return {
    background:
      `radial-gradient(ellipse 46% 30% at 32% 16%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%),` +
      `radial-gradient(ellipse 40% 26% at 68% 88%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%),` +
      `radial-gradient(ellipse at 50% 50%, ${accent} 0%, ${mixHex(accent, "#161233", 0.62)} 42%, ${mixHex(accent, "#0e0b26", 0.3)} 74%, #070513 100%)`,
    boxShadow:
      `inset -16px -14px 40px rgba(3,2,12,0.6), inset 12px 12px 30px rgba(255,255,255,0.14), ` +
      `inset 2px 4px 16px rgba(255,255,255,0.3), 0 40px 78px -16px ${accent}61, 0 16px 34px rgba(9,7,24,0.3)`,
  };
}

/** Mini-orb (Founders satellites): own speculars, reads as separate body. */
function miniStyle(accent: string, deep: string): CSSProperties {
  return {
    background:
      `radial-gradient(circle at 32% 24%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 10%),` +
      `radial-gradient(circle at 72% 80%, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 52%),` +
      `radial-gradient(circle at 31% 80%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 40%),` +
      `radial-gradient(circle at 50% 50%, ${accent} 0%, ${mixHex(accent, "#291806", 0.7)} 46%, ${mixHex(accent, "#1c1104", 0.3)} 80%, #100902 98%)`,
    boxShadow: `inset -8px -10px 20px rgba(4,2,1,0.55), inset 4px 6px 14px rgba(255,255,255,0.16)`,
  };
}

function grain() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 rounded-[inherit] opacity-[0.14] mix-blend-overlay pointer-events-none"
      style={{ backgroundImage: GRAIN_URI, backgroundSize: "160px 160px" }}
    />
  );
}

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

/* ------------------------------------------------------------------ */
/* Per-persona 3D forms                                                */
/* ------------------------------------------------------------------ */

function FormCopy({ p, metric, compact }: { p: PersonaData; metric: string; compact?: boolean }) {
  const bias = compact ? "36px" : p.pill === "Product Marketing" ? "24px" : p.pill === "RevOps" ? "40px" : "44px";
  return (
    <div className="psw-copy" style={{ paddingBottom: bias }}>
      <span className={`font-mono font-bold uppercase tracking-[0.22em] text-white/70 mb-1.5 select-none ${compact ? "text-[8.5px]" : "text-[9.5px]"}`}>
        Outcome
      </span>
      <span
        className={`font-extrabold text-white tracking-[-0.024em] leading-none select-none ${compact ? "text-[36px]" : "text-[40px]"}`}
        style={{ textShadow: "0 2px 14px rgba(0,0,0,0.22)" }}
      >
        {metric}
      </span>
      <span
        className={`font-medium text-white/80 leading-tight mt-1.5 mx-auto select-none ${compact ? "text-[9.5px]" : "text-[10.5px]"}`}
        style={{ maxWidth: compact ? 112 : 128, textWrap: "balance" }}
      >
        {p.metricLabel}
      </span>
    </div>
  );
}

function FormChips({ p, active, epoch, compact }: { p: PersonaData; active: boolean; epoch: number; compact?: boolean }) {
  const [b1, b2, b3] = p.components;
  return (
    <div
      key={active ? `on-${epoch}` : "off"}
      className="psw-chips"
      style={{ bottom: compact ? "6px" : p.chipsBottom, maxWidth: compact ? 130 : (p.chipsMaxW ?? 210), gap: compact ? 4 : undefined }}
    >
      {[b1, b2, b3].map((label, i) => (
        <span
          key={label}
          className={`psw-chip psw-chip-in ${compact ? "psw-chip--sm" : ""}`}
          style={{ animationDelay: `${120 + i * 320}ms`, borderColor: `${p.accent}59` }}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

/** AE: baked sphere with wrapping waveform bands (sound rings). */
function FormSales({ p, metric, active, epoch }: { p: PersonaData; metric: string; active: boolean; epoch: number }) {
  return (
    <div className="psw-form-outer" style={{ width: 260, height: 260 }}>
      <svg className="psw-bands-svg" viewBox="0 0 430 430" fill="none" aria-hidden="true">
        <g transform="rotate(-7 215 215)">
          <ellipse className="psw-dash-a" cx="215" cy="215" rx="152" ry="50" stroke="#60a5fa" strokeOpacity="0.72" strokeWidth="4.5" strokeLinecap="round" strokeDasharray="6 4" pathLength={320} />
        </g>
        <g transform="rotate(10 215 215)">
          <ellipse className="psw-dash-b" cx="215" cy="215" rx="168" ry="34" stroke="#3b82f6" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 3.5" pathLength={260} />
        </g>
      </svg>
      <div className="relative w-full h-full psw-float">
        <div className="absolute inset-0 rounded-full overflow-hidden" style={sphereStyle(p.accent, p.deep)}>
          <div aria-hidden="true" className="persona-orb-sheen absolute left-1/2 top-1/2 w-[175%] h-[175%] rounded-full" style={{ background: "conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.34) 48deg, rgba(255,255,255,0) 96deg)", mixBlendMode: "overlay" }} />
          {grain()}
        </div>
        <FormCopy p={p} metric={metric} />
        <FormChips p={p} active={active} epoch={epoch} />
      </div>
    </div>
  );
}

/** VP Sales: baked sphere wrapped in rotating radar arcs + trailing sweep. */
function FormVpSales({ p, metric, active, epoch }: { p: PersonaData; metric: string; active: boolean; epoch: number }) {
  return (
    <div className="psw-form-outer" style={{ width: 260, height: 260 }}>
      <svg className="psw-radar-svg" viewBox="0 0 420 420" fill="none" aria-hidden="true">
        <circle className="psw-spin-36" cx="210" cy="210" r="148" pathLength={100} stroke="#F26522" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" strokeDasharray="34 66" />
        <circle className="psw-spin-25" cx="210" cy="210" r="170" pathLength={100} stroke="#F26522" strokeOpacity="0.34" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="56 44" strokeDashoffset="62" />
        <circle className="psw-spin-17" cx="210" cy="210" r="194" pathLength={100} stroke="#F26522" strokeOpacity="0.24" strokeWidth="1.25" strokeLinecap="round" strokeDasharray="20 80" strokeDashoffset="40" />
      </svg>
      <div className="psw-sweep psw-spin-11" aria-hidden="true" />
      <div className="relative w-full h-full psw-float">
        <div className="absolute inset-0 rounded-full overflow-hidden" style={sphereStyle(p.accent, p.deep)}>
          <div aria-hidden="true" className="persona-orb-sheen absolute left-1/2 top-1/2 w-[175%] h-[175%] rounded-full" style={{ background: "conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.34) 48deg, rgba(255,255,255,0) 96deg)", mixBlendMode: "overlay" }} />
          {grain()}
        </div>
        <FormCopy p={p} metric={metric} />
        <FormChips p={p} active={active} epoch={epoch} />
      </div>
    </div>
  );
}

/** RevOps: faceted grid monolith with rotating lattice. */
function FormRevOps({ p, metric, active, epoch }: { p: PersonaData; metric: string; active: boolean; epoch: number }) {
  return (
    <div className="psw-form-outer" style={{ width: 248, height: 306 }}>
      <div className="relative w-full h-full psw-float">
        <div className="absolute inset-0 rounded-[46px] overflow-hidden" style={monolithStyle(p.accent, p.deep)}>
          <div aria-hidden="true" className="psw-latt-wrap">
            <div className="psw-latt-grid psw-spin-36" />
          </div>
          <div aria-hidden="true" className="psw-facet" />
          <div aria-hidden="true" className="psw-facet2" />
          <div aria-hidden="true" className="psw-sheen-lin" />
          {grain()}
        </div>
        <FormCopy p={p} metric={metric} />
        <FormChips p={p} active={active} epoch={epoch} />
      </div>
    </div>
  );
}

/** PMM: glass lens with a scanning beam sweep. */
function FormPmm({ p, metric, active, epoch }: { p: PersonaData; metric: string; active: boolean; epoch: number }) {
  return (
    <div className="psw-form-outer" style={{ width: 326, height: 204 }}>
      <div className="relative w-full h-full psw-float">
        <div className="absolute inset-0 rounded-[50%] overflow-hidden" style={lensStyle(p.accent, p.deep)}>
          <div aria-hidden="true" className="psw-scan">
            <div className="psw-scan-beam" />
          </div>
          <div aria-hidden="true" className="psw-rim-t" />
          <div aria-hidden="true" className="psw-rim-b" />
          {grain()}
        </div>
        <FormCopy p={p} metric={metric} />
        <FormChips p={p} active={active} epoch={epoch} />
      </div>
    </div>
  );
}

/** Founders: core orb + 3 spherical mini-orbs on tilted orbit rings. */
function FormFounders({ p, metric, active, epoch }: { p: PersonaData; metric: string; active: boolean; epoch: number }) {
  const miniTones = ["#fbbf24", "#f59e0b", "#fbbf24"];
  return (
    <div className="psw-form-outer" style={{ width: 400, height: 300 }}>
      <div className="relative w-full h-full psw-float">
        <div className="psw-orbit-ring psw-orbit-ring--a">
          <div className="psw-orbit-arm psw-orbit-arm--a">
            <div className="psw-mini-pos">
              <div className="psw-mini-spin psw-mini-spin--a">
                <div className="psw-mini-in" style={miniStyle(miniTones[0], p.deep)} />
              </div>
            </div>
          </div>
        </div>
        <div className="psw-orbit-ring psw-orbit-ring--b">
          <div className="psw-orbit-arm psw-orbit-arm--b">
            <div className="psw-mini-pos">
              <div className="psw-mini-spin psw-mini-spin--b">
                <div className="psw-mini-in" style={miniStyle(miniTones[1], p.deep)} />
              </div>
            </div>
          </div>
        </div>
        <div className="psw-orbit-ring psw-orbit-ring--c">
          <div className="psw-orbit-arm psw-orbit-arm--c">
            <div className="psw-mini-pos">
              <div className="psw-mini-spin psw-mini-spin--c">
                <div className="psw-mini-in" style={miniStyle(miniTones[2], p.deep)} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] rounded-full overflow-hidden z-10" style={sphereStyle(p.accent, p.deep)}>
          <div aria-hidden="true" className="persona-orb-sheen absolute left-1/2 top-1/2 w-[175%] h-[175%] rounded-full" style={{ background: "conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.34) 48deg, rgba(255,255,255,0) 96deg)", mixBlendMode: "overlay" }} />
          {grain()}
          <FormCopy p={p} metric={metric} compact />
          <FormChips p={p} active={active} epoch={epoch} compact />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export function StudioPersonaSwitcher() {
  const [activeKey, setActiveKey] = useState<PersonaKey>("vpsales");
  const [epoch, setEpoch] = useState(0);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(true);
  const [docHidden, setDocHidden] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useIsReducedMotion();
  const current = PERSONAS[activeKey];
  const metric = useCountMetric(current.metric, reducedMotion);

  const go = useCallback((delta: number) => {
    setActiveKey((prev) => {
      const nextIdx = (ORDER.indexOf(prev) + delta + ORDER.length) % ORDER.length;
      return ORDER[nextIdx];
    });
    setEpoch((e) => e + 1);
  }, []);

  const playing = !reducedMotion && inView && !docHidden && !focused;

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

  const glowStyle = (accent: string, w: number, h = w) => ({
    background: `radial-gradient(circle at 50% 50%, ${accent}1F 0%, ${accent}0A 46%, rgba(255,255,255,0) 70%)`,
    width: `${w}px`,
    height: `${h}px`,
    marginLeft: `-${w / 2}px`,
    marginTop: `-${h / 2}px`,
    transform: "scale(1.3)",
    filter: "blur(26px)",
    opacity: 0.55,
  });

  const formFor = (k: PersonaKey, p: PersonaData) => {
    switch (k) {
      case "ae":
        return <FormSales p={p} metric={metric} active={k === activeKey} epoch={epoch} />;
      case "vpsales":
        return <FormVpSales p={p} metric={metric} active={k === activeKey} epoch={epoch} />;
      case "revops":
        return <FormRevOps p={p} metric={metric} active={k === activeKey} epoch={epoch} />;
      case "pmm":
        return <FormPmm p={p} metric={metric} active={k === activeKey} epoch={epoch} />;
      case "founders":
        return <FormFounders p={p} metric={metric} active={k === activeKey} epoch={epoch} />;
    }
  };

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

        {/* Autoplay pause conditions: focus-within (keyboard), tab-hidden, off-screen,
            prefers-reduced-motion. Deliberately NO pause-on-hover: touch devices fire a
            synthetic mouseenter that never gets a mouseleave, which froze the cycle
            permanently on iPad/Mobile Safari (owner-reported 2026-10-31). */}
        <div
          ref={stageRef}
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={(e) => {
            if (stageRef.current && e.relatedTarget && stageRef.current.contains(e.relatedTarget as Node)) return;
            setFocused(false);
          }}
        >
          {/* Persona pills — passive indicators: auto-highlight as the cycle runs */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-14" aria-hidden="true">
            {ORDER.map((k) => {
              const p = PERSONAS[k];
              const isSelected = activeKey === k;
              return (
                <span
                  key={k}
                  data-pill-active={String(isSelected)}
                  className={`relative px-4 sm:px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300 ${
                    isSelected ? "bg-gray-900 text-white shadow-sm scale-[1.02]" : "bg-neutral-100 text-gray-600"
                  }`}
                >
                  <span className="relative z-10">{p.pill}</span>
                  {isSelected && !reducedMotion && (
                    <span className="absolute inset-x-3.5 bottom-[5px] h-[2px] rounded-full overflow-hidden bg-white/20 motion-reduce:hidden">
                      <span
                        key={`${activeKey}-${epoch}`}
                        className={`block h-full w-full rounded-full origin-left bg-white/80 ${
                          playing ? "persona-progress-fill" : "persona-progress-fill persona-progress-paused"
                        }`}
                        style={{ animationDuration: `${DWELL_MS}ms` }}
                      />
                    </span>
                  )}
                </span>
              );
            })}
          </div>

          {/* Central visual — one signature 3D form per persona, auto-crossfading */}
          <div className="max-w-2xl mx-auto flex flex-col items-center">
            <div className="psw-stage relative w-full max-w-[460px] h-[300px] sm:h-[420px] mb-8 sm:mb-10 flex items-center justify-center">
              {ORDER.map((k) => {
                const p = PERSONAS[k];
                const isActive = k === activeKey;
                const glowW = k === "revops" ? 300 : k === "pmm" ? 380 : k === "founders" ? 336 : 264;
                const glowH = k === "pmm" ? 300 : glowW;
                return (
                  <div
                    key={k}
                    data-active={String(isActive)}
                    aria-hidden={!isActive}
                    className={`psw-layer ${isActive ? "psw-layer--on" : "psw-layer--off"}`}
                    style={{ ["--psw-spin" as string]: p.spin }}
                  >
                    {/* Breathing ambient glow */}
                    <div
                      aria-hidden="true"
                      className="psw-glow absolute left-1/2 top-1/2 rounded-full"
                      style={glowStyle(p.accent, glowW, glowH)}
                    />
                    {formFor(k, p)}
                  </div>
                );
              })}
              {/* Synced contact-shadow ellipse */}
              <div
                aria-hidden="true"
                className="absolute bottom-[34px] left-1/2 -translate-x-1/2 w-[230px] h-[30px] rounded-full psw-shadow z-[2]"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(22,12,5,0.40) 0%, rgba(22,12,5,0) 68%)",
                  filter: "blur(5px)",
                }}
              />
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

            {/* CTA */}
            <Link
              href="/features"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all text-[13px] font-semibold"
            >
              <span>Explore features</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
