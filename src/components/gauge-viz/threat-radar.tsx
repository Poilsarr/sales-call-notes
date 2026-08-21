"use client";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { velocity, recencyWeight, daysSince } from "@/lib/viz/math";

type Mention = { competitor: string; sentiment: string | null; createdAt: string };
type Trend = { competitor: string; count: number };

const SENTIMENT_FILL: Record<string, string> = {
  negative: "#f87171",
  positive: "#34d399",
  neutral: "#fbbf24",
};
const SENTIMENT_BG: Record<string, string> = {
  negative: "rgba(248,113,113,0.18)",
  positive: "rgba(52,211,153,0.18)",
  neutral: "rgba(251,191,36,0.18)",
};

export function ThreatRadar({
  trend,
  mentions,
  selectedCompetitor,
  onSelect,
}: {
  trend: Trend[];
  mentions: Mention[];
  selectedCompetitor: string | null;
  onSelect: (c: string | null) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);

  const points = useMemo(() => {
    if (trend.length === 0) return [];
    const now = Date.now();
    const total = trend.reduce((s, t) => s + t.count, 0) || 1;

    // bucket per competitor
    const byComp = new Map<string, { total: number; neg: number; last: number; count7: number; countPrior7: number }>();
    for (const m of mentions) {
      const t = new Date(m.createdAt).getTime();
      const ageDays = (now - t) / 86400000;
      const b = byComp.get(m.competitor) ?? { total: 0, neg: 0, last: t, count7: 0, countPrior7: 0 };
      b.total += 1;
      if ((m.sentiment || "").toLowerCase() === "negative") b.neg += 1;
      if (t > b.last) b.last = t;
      if (ageDays <= 7) b.count7 += 1;
      else if (ageDays <= 14) b.countPrior7 += 1;
      byComp.set(m.competitor, b);
    }

    const enriched = trend.map((t) => {
      const b = byComp.get(t.competitor) ?? { total: t.count, neg: 0, last: now - 15 * 86400000, count7: 0, countPrior7: 0 };
      const share = t.count / total;
      const vel = velocity(b.count7, b.countPrior7);
      const velNorm = Math.min(1, vel / 2.5);
      const rec = (now - b.last) / 86400000;
      const recW = recencyWeight(rec);
      const risk = b.neg * recW * (0.5 + share);
      const domSent = b.neg / Math.max(1, b.total) > 0.5 ? "negative" : b.neg > 0 ? "neutral" : "neutral";
      // Threat tier
      return { ...t, share, vel, velNorm, rec, risk, domSent, neg: b.neg };
    });

    // sort by risk desc, angle distributed by risk order (top threats spread)
    enriched.sort((a, b) => b.risk - a.risk || b.share - a.share);

    return enriched.map((e, i) => {
      const cx = 180, cy = 180;
      const baseR = 44, maxR = 138;
      const angle = (i / Math.max(1, enriched.length)) * Math.PI * 2 - Math.PI / 2;
      // velocity pushes outward, share nudges
      const r = baseR + e.velNorm * (maxR - baseR) + e.share * 10;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      const dotR = 8 + e.share * 18 + Math.min(6, e.neg * 1.2);
      return { ...e, x, y, r: dotR, angle, radius: r };
    });
  }, [trend, mentions]);

  if (points.length === 0) return null;
  if (points.length < 3) {
    // Fallback to compact KPI ring when too few competitors to be a radar
    return (
      <div className="doppel-outer-dark">
        <div className="doppel-inner-dark p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-200">Threat Radar</span>
            <span className="text-xs text-zinc-500">Add more rivals to unlock radar</span>
          </div>
          <div className="flex gap-3">
            {points.map((p) => (
              <div key={p.competitor} className="flex-1 rounded-xl bg-white/[0.04] border border-white/5 p-3 text-center">
                <div className="text-sm text-white font-medium">{p.competitor}</div>
                <div className="text-xs text-zinc-400">{p.count} mentions · {p.neg} threat</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="doppel-outer-dark">
      <div className="doppel-inner-dark p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-200">Threat Radar</span>
          <span className="text-xs text-zinc-500">{points.length} rivals · outer = accelerating</span>
        </div>
        <div className="relative">
          <svg viewBox="0 0 360 360" className="w-full h-auto" role="img" aria-label="Threat radar — velocity vs share, color is sentiment">
            {/* rings */}
            {[0.33, 0.66, 1].map((t, idx) => (
              <motion.circle
                key={idx}
                cx={180} cy={180} r={44 + t * (138 - 44)}
                fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={idx === 2 ? 1.2 : 1}
                strokeDasharray={idx === 0 ? "4 6" : undefined}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.9, delay: idx * 0.08, ease: [0.19, 1, 0.22, 1] }}
              />
            ))}
            {/* crosshair */}
            <line x1={180} y1={20} x2={180} y2={340} stroke="rgba(255,255,255,0.04)" />
            <line x1={20} y1={180} x2={340} y2={180} stroke="rgba(255,255,255,0.04)" />
            {/* center — you */}
            <circle cx={180} cy={180} r={18} fill="rgba(94,106,210,0.18)" stroke="rgba(94,106,210,0.6)" strokeWidth={1.2} />
            <text x={180} y={184} textAnchor="middle" fontSize={9} fill="#a5b4fc" fontWeight={600}>YOU</text>

            {/* points */}
            {points.map((p, i) => {
              const isSelected = selectedCompetitor === p.competitor;
              const isDimmed = selectedCompetitor && !isSelected;
              const isHovered = hover === p.competitor;
              return (
                <motion.g
                  key={p.competitor}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: isDimmed ? 0.18 : 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 14, delay: i * 0.055 }}
                  whileHover={{ scale: 1.08 }}
                  onHoverStart={() => setHover(p.competitor)}
                  onHoverEnd={() => setHover(null)}
                  onClick={() => onSelect(isSelected ? null : p.competitor)}
                  style={{ cursor: "pointer" }}
                >
                  {/* halo for top threat */}
                  {i === 0 && (
                    <circle cx={p.x} cy={p.y} r={p.r + 8} fill={SENTIMENT_BG[p.domSent] || "rgba(251,191,36,0.12)"} />
                  )}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={p.r}
                    fill={SENTIMENT_FILL[p.domSent] || "#fbbf24"}
                    stroke={isSelected ? "#fff" : "rgba(0,0,0,0.6)"}
                    strokeWidth={isSelected ? 2 : 1.2}
                    opacity={isDimmed ? 0.5 : 0.95}
                  />
                  {/* label */}
                  <text
                    x={p.x}
                    y={p.y - p.r - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fill={isHovered || isSelected ? "#fff" : "#e4e4e7"}
                    fontWeight={isSelected ? 700 : 500}
                    style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.55)", strokeWidth: 3, strokeLinejoin: "round" }}
                  >
                    {p.competitor}
                  </text>
                  <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={8.5} fill="#18181b" fontWeight={700}>
                    {p.count}
                  </text>
                </motion.g>
              );
            })}
          </svg>

          {/* tooltip */}
          {hover && (() => {
            const p = points.find((x) => x.competitor === hover);
            if (!p) return null;
            // Convert SVG coords to container % (approx)
            const left = (p.x / 360) * 100;
            const top = (p.y / 360) * 100;
            return (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl border border-white/10 bg-[#1c1c20] px-3 py-2 shadow-xl"
                style={{ left: `${left}%`, top: `${top}%`, transform: "translate(-50%, -12px)" }}
              >
                <div className="text-xs font-semibold text-white">{p.competitor}</div>
                <div className="text-[11px] text-zinc-400">{p.count} mentions · {p.neg} threat · vel {p.vel.toFixed(1)}× · {p.share >= 0.01 ? `${(p.share * 100).toFixed(0)}% share` : "—"}</div>
              </div>
            );
          })()}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500"><span className="h-2 w-2 rounded-full" style={{ background: "#f87171" }} />Threat</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500"><span className="h-2 w-2 rounded-full" style={{ background: "#fbbf24" }} />Mixed</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500"><span className="h-2 w-2 rounded-full" style={{ background: "#34d399" }} />Positive</span>
          <span className="ml-auto text-[11px] text-zinc-600">outer ring = accelerating · click to filter</span>
        </div>
      </div>
    </div>
  );
}
