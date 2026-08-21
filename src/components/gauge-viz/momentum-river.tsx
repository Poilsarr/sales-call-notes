"use client";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

type Mention = { competitor: string; sentiment: string | null; createdAt: string };

function dayKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function buildDays(mentions: Mention[], days = 30): { label: string; pos: number; neu: number; neg: number; total: number }[] | null {
  if (mentions.length === 0) return null;
  const byDay = new Map<string, { pos: number; neu: number; neg: number }>();
  for (const m of mentions) {
    const k = dayKey(new Date(m.createdAt));
    const b = byDay.get(k) ?? { pos: 0, neu: 0, neg: 0 };
    const s = (m.sentiment || "neutral").toLowerCase();
    if (s === "positive") b.pos += 1;
    else if (s === "negative") b.neg += 1;
    else b.neu += 1;
    byDay.set(k, b);
  }
  if (byDay.size === 0) return null;
  // find latest
  let latest = new Date(0);
  for (const m of mentions) {
    const d = new Date(m.createdAt);
    if (d > latest) latest = d;
  }
  const start = new Date(Date.UTC(latest.getUTCFullYear(), latest.getUTCMonth(), latest.getUTCDate() - (days - 1)));
  const out: ReturnType<typeof buildDays> = [] as any;
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const k = dayKey(d);
    const b = byDay.get(k) ?? { pos: 0, neu: 0, neg: 0 };
    out!.push({
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      ...b,
      total: b.pos + b.neu + b.neg,
    });
  }
  return out;
}

function bezierArea(values: number[], W: number, H: number): string {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1);
  const step = W / Math.max(1, values.length - 1);
  const pts = values.map((v, i) => ({ x: i * step, y: H - (v / max) * H }));
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x} ${H} L ${W} ${H} L 0 ${H} Z`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  d += ` L ${W} ${H} L 0 ${H} Z`;
  return d;
}

export function MomentumRiver({ mentions }: { mentions: Mention[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const days = useMemo(() => buildDays(mentions, 30), [mentions]);

  if (!days) return null;

  const W = 720, H = 136, PAD_X = 4;
  const innerW = W - PAD_X * 2;

  // stacked: neg at bottom (threat base), neu middle, pos top
  const negVals = days.map((d) => d.neg);
  const neuVals = days.map((d) => d.neu + d.neg); // cumulative
  const posVals = days.map((d) => d.pos + d.neu + d.neg);

  const negPath = bezierArea(negVals, innerW, H);
  const neuPath = bezierArea(neuVals, innerW, H);
  const posPath = bezierArea(posVals, innerW, H);

  const maxTotal = Math.max(1, ...days.map((d) => d.total));

  return (
    <div className="doppel-outer-dark">
      <div className="doppel-inner-dark p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-200">Momentum River</span>
          <span className="text-xs text-zinc-500">Last 30 days · stacked sentiment</span>
        </div>

        <div className="relative" onMouseLeave={() => setHoverIdx(null)}>
          <svg viewBox={`0 0 ${W} ${H + 26}`} className="w-full h-auto" role="img" aria-label="Momentum river — stacked sentiment over the last 30 days">
            <defs>
              <linearGradient id="grad-pos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0.18} />
              </linearGradient>
              <linearGradient id="grad-neu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.18} />
              </linearGradient>
              <linearGradient id="grad-neg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#f87171" stopOpacity={0.22} />
              </linearGradient>
            </defs>

            {/* grid */}
            <g opacity={0.22}>
              {[0.25, 0.5, 0.75].map((t) => (
                <line key={t} x1={PAD_X} x2={W - PAD_X} y1={H * t} y2={H * t} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />
              ))}
            </g>

            {/* areas — bottom to top so threat base is visible */}
            <motion.path
              d={posPath}
              fill="url(#grad-pos)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.1, ease: [0.19, 1, 0.22, 1] }}
              style={{ transform: `translateX(${PAD_X}px)` }}
            />
            <motion.path d={neuPath} fill="url(#grad-neu)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} style={{ transform: `translateX(${PAD_X}px)` }} />
            <motion.path d={negPath} fill="url(#grad-neg)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }} style={{ transform: `translateX(${PAD_X}px)` }} />

            {/* hit areas + hover guideline */}
            {days.map((d, i) => {
              const x = PAD_X + (i * innerW) / Math.max(1, days.length - 1);
              const showLabel = i % 5 === 0 || i === days.length - 1;
              return (
                <g key={i} onMouseEnter={() => setHoverIdx(i)}>
                  <rect x={x - 8} y={0} width={16} height={H} fill="transparent" />
                  {showLabel && (
                    <text x={x} y={H + 16} textAnchor="middle" fontSize={9.5} fill="rgba(161,161,170,0.9)">
                      {d.label}
                    </text>
                  )}
                </g>
              );
            })}
            {hoverIdx !== null && (
              <motion.line
                x1={PAD_X + (hoverIdx * innerW) / Math.max(1, days.length - 1)}
                x2={PAD_X + (hoverIdx * innerW) / Math.max(1, days.length - 1)}
                y1={0}
                y2={H}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={1}
                strokeDasharray="3 4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            )}
          </svg>

          {hoverIdx !== null && (() => {
            const d = days[hoverIdx];
            const prev = hoverIdx > 0 ? days[hoverIdx - 1] : null;
            const delta = prev ? d.total - prev.total : 0;
            const left = (hoverIdx / Math.max(1, days.length - 1)) * 100;
            return (
              <div
                className="absolute z-10 -translate-x-1/2 rounded-xl border border-white/10 bg-[#1c1c20] px-3 py-2 shadow-xl pointer-events-none"
                style={{ left: `${left}%`, top: 8 }}
              >
                <div className="text-xs font-semibold text-white">{d.label} · {d.total} {d.total === 1 ? "mention" : "mentions"} {delta !== 0 && <span className={delta > 0 ? "text-red-400" : "text-emerald-400"}>({delta > 0 ? "+" : ""}{delta})</span>}</div>
                <div className="text-[11px] text-zinc-400 flex gap-2"><span className="text-red-400">● {d.neg} threat</span><span className="text-amber-300">● {d.neu} neutral</span><span className="text-emerald-400">● {d.pos} pos</span></div>
              </div>
            );
          })()}
        </div>

        <div className="mt-2 flex gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-zinc-500"><span className="h-2 w-2 rounded-sm" style={{ background: "#f87171" }} />Threat</span>
          <span className="inline-flex items-center gap-1.5 text-zinc-500"><span className="h-2 w-2 rounded-sm" style={{ background: "#fbbf24" }} />Neutral</span>
          <span className="inline-flex items-center gap-1.5 text-zinc-500"><span className="h-2 w-2 rounded-sm" style={{ background: "#34d399" }} />Positive</span>
          <span className="ml-auto text-zinc-600">threat river swelling = deals at risk</span>
        </div>
      </div>
    </div>
  );
}
