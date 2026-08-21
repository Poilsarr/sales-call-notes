"use client";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { daysSince } from "@/lib/viz/math";

type Mention = { competitor: string; sentiment: string | null; createdAt: string; context: string | null };

function bucketSentimentRecency(mentions: Mention[], now: number) {
  const map = new Map<string, { positive: number; neutral: number; negative: number; contexts: string[]; last: number }>();
  for (const m of mentions) {
    const s = (m.sentiment || "neutral").toLowerCase();
    const key = ["positive", "negative"].includes(s) ? s : "neutral";
    const entry = map.get(m.competitor) ?? { positive: 0, neutral: 0, negative: 0, contexts: [], last: 0 };
    (entry as any)[key] += 1;
    if (m.context && entry.contexts.length < 3) entry.contexts.push(m.context);
    const t = new Date(m.createdAt).getTime();
    if (t > entry.last) entry.last = t;
    map.set(m.competitor, entry);
  }
  return map;
}

export function BattleHeatmap({
  mentions,
  selectedCompetitor,
  onSelect,
}: {
  mentions: Mention[];
  selectedCompetitor: string | null;
  onSelect: (c: string | null) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (mentions.length === 0) return [];
    const now = Date.now();
    const map = bucketSentimentRecency(mentions, now);
    const arr = Array.from(map.entries()).map(([competitor, v]) => {
      const total = v.positive + v.neutral + v.negative;
      const rec = (now - v.last) / 86400000;
      const recW = Math.exp(-rec / 7); // 0..1
      return { competitor, ...v, total, rec, recW, risk: v.negative * recW };
    });
    // sort by risk desc
    arr.sort((a, b) => b.risk - a.risk || b.total - a.total);
    return arr.slice(0, 10);
  }, [mentions]);

  const maxCell = useMemo(() => {
    if (rows.length === 0) return 1;
    return Math.max(1, ...rows.flatMap((r) => [r.positive, r.neutral, r.negative]));
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="doppel-outer-dark">
        <div className="doppel-inner-dark p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-200">Battlecard Heatmap</span>
            <span className="text-xs text-zinc-500">sentiment × recency</span>
          </div>
          <p className="text-sm text-zinc-500 py-6 text-center">No sentiment data yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doppel-outer-dark">
      <div className="doppel-inner-dark p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-zinc-200">Battlecard Heatmap</span>
          <span className="text-xs text-zinc-500">rows = risk · cell = count × recency</span>
        </div>
        {/* header */}
        <div className="grid grid-cols-[1fr_64px_64px_64px] gap-2 mb-2 px-1">
          <span className="text-[11px] uppercase tracking-widest text-zinc-500">Rival</span>
          <span className="text-[11px] uppercase tracking-widest text-emerald-400 text-center">Pos</span>
          <span className="text-[11px] uppercase tracking-widest text-zinc-400 text-center">Neu</span>
          <span className="text-[11px] uppercase tracking-widest text-red-400 text-center">Threat</span>
        </div>

        <motion.div
          className="space-y-2"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {rows.map((r) => {
            const isSelected = selectedCompetitor === r.competitor;
            const isDimmed = !!(selectedCompetitor && !isSelected);
            return (
              <motion.div
                key={r.competitor}
                variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                className={`grid grid-cols-[1fr_64px_64px_64px] gap-2 items-center rounded-xl border px-3 py-2 transition-colors ${isSelected ? "bg-red-500/10 border-red-500/30" : "bg-white/[0.03] border-white/5 hover:border-white/10"} ${isDimmed ? "opacity-40" : ""}`}
                onClick={() => onSelect(isSelected ? null : r.competitor)}
                onHoverStart={() => setHover(r.competitor)}
                onHoverEnd={() => setHover(null)}
                style={{ cursor: "pointer" }}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate flex items-center gap-1.5">
                    {r.competitor}
                    {r.risk > 1.5 && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                  </div>
                  <div className="text-[11px] text-zinc-500">{r.total} total · {r.rec < 1 ? "today" : `${Math.round(r.rec)}d ago`}</div>
                </div>
                {(["positive", "neutral", "negative"] as const).map((k) => {
                  const count = r[k];
                  const alpha = count === 0 ? 0 : 0.22 + (count / maxCell) * 0.55 * (k === "negative" ? 1 : 0.85) * (0.6 + r.recW * 0.4);
                  const bg =
                    k === "positive"
                      ? `rgba(52,211,153,${alpha})`
                      : k === "negative"
                        ? `rgba(248,113,113,${alpha})`
                        : `rgba(251,191,36,${alpha})`;
                  const border =
                    k === "positive" ? "rgba(52,211,153,0.35)" : k === "negative" ? "rgba(248,113,113,0.35)" : "rgba(251,191,36,0.35)";
                  return (
                    <motion.div
                      key={k}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
                      style={{ transformOrigin: "center" }}
                      className="h-9 rounded-lg border flex items-center justify-center text-sm font-semibold"
                    >
                      <div
                        className="h-full w-full rounded-lg flex items-center justify-center"
                        style={{ background: bg, borderColor: border, borderWidth: 1, borderStyle: "solid", color: count > 0 ? "#fff" : "rgba(255,255,255,0.35)" }}
                      >
                        {count}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            );
          })}
        </motion.div>

        {/* hover context */}
        {hover && (() => {
          const r = rows.find((x) => x.competitor === hover);
          if (!r || r.contexts.length === 0) return null;
          return (
            <div className="mt-3 rounded-xl bg-[#0a0a0b] border border-white/5 p-3">
              <div className="text-xs font-medium text-zinc-300 mb-1">Recent context — {r.competitor}</div>
              <div className="space-y-1">
                {r.contexts.map((c, i) => (
                  <div key={i} className="text-xs text-zinc-500 italic leading-relaxed">“{c.slice(0, 160)}”</div>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="mt-3 text-[11px] text-zinc-600">click a row to filter · Threat column = where to deploy playbook</div>
      </div>
    </div>
  );
}
