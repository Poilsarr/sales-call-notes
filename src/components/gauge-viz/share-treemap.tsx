"use client";
import { motion } from "framer-motion";
import { useMemo } from "react";

type Trend = { competitor: string; count: number };
type Mention = { competitor: string; sentiment: string | null };

const COLORS = ["#5e6ad2", "#7170ff", "#22d3a8", "#F26522", "#e879f9", "#38bdf8", "#fbbf24", "#f87171"];

export function ShareTreemap({
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
  const tiles = useMemo(() => {
    if (trend.length === 0) return [];
    const total = trend.reduce((s, t) => s + t.count, 0) || 1;
    // sentiment map for border
    const byComp = new Map<string, { neg: number; total: number }>();
    for (const m of mentions) {
      const b = byComp.get(m.competitor) ?? { neg: 0, total: 0 };
      b.total += 1;
      if ((m.sentiment || "").toLowerCase() === "negative") b.neg += 1;
      byComp.set(m.competitor, b);
    }
    // sort desc
    const sorted = [...trend].sort((a, b) => b.count - a.count);
    const W = 720, H = 180;
    const GAP = 6;
    // simple slice-and-dice: first half horizontal, second half vertical — good enough for 5-8 items
    // For n<=4: 2x2 grid feel; for n>4: horizontal strip
    const rects: { x: number; y: number; w: number; h: number; t: Trend; share: number; negRatio: number; color: string }[] = [];
    let x = 0;
    const availW = W - GAP * (sorted.length - 1);
    for (let i = 0; i < sorted.length; i++) {
      const t = sorted[i];
      const share = t.count / total;
      const w = Math.max(36, Math.round(share * availW));
      // last gets remainder
      const finalW = i === sorted.length - 1 ? W - x : w;
      const b = byComp.get(t.competitor);
      const negRatio = b ? b.neg / b.total : 0;
      rects.push({ x, y: 0, w: finalW, h: H, t, share: share * 100, negRatio, color: COLORS[i % COLORS.length] });
      x += finalW + GAP;
    }
    return rects;
  }, [trend, mentions]);

  if (tiles.length === 0) return null;

  return (
    <div className="doppel-outer-dark">
      <div className="doppel-inner-dark p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-zinc-200">Share of Voice</span>
          <span className="text-xs text-zinc-500">tile = share · red border = &gt;50% threat</span>
        </div>
        <svg viewBox="0 0 720 180" className="w-full h-auto" role="img" aria-label="Share of voice treemap">
          {tiles.map((tile, i) => {
            const isSelected = selectedCompetitor === tile.t.competitor;
            const isDimmed = !!(selectedCompetitor && !isSelected);
            const isThreat = tile.negRatio > 0.5;
            return (
              <motion.g
                key={tile.t.competitor}
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: isDimmed ? 0.35 : 1 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 220, damping: 20 }}
                style={{ cursor: "pointer" }}
                onClick={() => onSelect(isSelected ? null : tile.t.competitor)}
              >
                <rect
                  x={tile.x}
                  y={tile.y}
                  width={tile.w}
                  height={tile.h}
                  rx={12}
                  fill={tile.color}
                  opacity={isSelected ? 0.95 : 0.82}
                  stroke={isThreat ? "#f87171" : isSelected ? "#fff" : "rgba(255,255,255,0.08)"}
                  strokeWidth={isThreat ? 2.2 : 1}
                />
                {/* gloss */}
                <rect x={tile.x} y={tile.y} width={tile.w} height={tile.h * 0.45} rx={12} fill="white" opacity={0.08} />
                <text x={tile.x + tile.w / 2} y={tile.y + tile.h / 2 - 8} textAnchor="middle" fontSize={13} fill="#fff" fontWeight={700} style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.35)", strokeWidth: 3 }}>
                  {tile.t.competitor}
                </text>
                <text x={tile.x + tile.w / 2} y={tile.y + tile.h / 2 + 10} textAnchor="middle" fontSize={11} fill="rgba(255,255,255,0.9)" fontWeight={600}>
                  {tile.share.toFixed(0)}% · ×{tile.t.count}
                </text>
                {isThreat && (
                  <text x={tile.x + tile.w / 2} y={tile.y + tile.h / 2 + 24} textAnchor="middle" fontSize={9} fill="#fee2e2" fontWeight={700}>
                    THREAT
                  </text>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
