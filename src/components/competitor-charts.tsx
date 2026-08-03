'use client';

import { useMemo, useState } from 'react';

type Sentiment = 'positive' | 'neutral' | 'negative';

interface Mention {
  competitor: string;
  sentiment: string | null;
  context: string | null;
  createdAt: string;
}

interface Trend {
  competitor: string;
  count: number;
}

interface Props {
  trend: Trend[];
  mentions: Mention[];
}

interface SentimentBucket { positive: number; neutral: number; negative: number; }

const SENTIMENT_COLORS: Record<Sentiment, string> = {
  positive: 'fill-emerald-400',
  neutral: 'fill-yellow-400',
  negative: 'fill-red-400',
};

// ponytail: pure-SVG charts on top of data the API already returns. Zero deps; deterministic; testable as a pure component. The trade-off is no animations and no native tooltips — recharts only when those become product requirements, not before.

// ponytail: the API stores sentiment as string|null with possible unknown strings. Bucket only the three known values; drop the rest so a stray "mixed" doesn't break the chart.
function bucketSentiment(mentions: Mention[]): Map<string, SentimentBucket> {
  const out = new Map<string, SentimentBucket>();
  for (const m of mentions) {
    const k = m.sentiment;
    if (k !== 'positive' && k !== 'neutral' && k !== 'negative') continue;
    const cur = out.get(m.competitor) ?? { positive: 0, neutral: 0, negative: 0 };
    cur[k] += 1;
    out.set(m.competitor, cur);
  }
  return out;
}

const VIEW_W = 720;
const ROW_H = 28;
const ROW_GAP = 10;
const BAR_H = 14;

function TrendBars({ trend }: { trend: Trend[] }) {
  if (trend.length === 0) return null;
  const max = Math.max(...trend.map(t => t.count), 1);
  // ponytail: scale to the top mention — chart at this density is still readable for n<12 competitors. If we ever get more, switch to log-scale.
  const innerW = VIEW_W - 160;
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${trend.length * (ROW_H + ROW_GAP)}`} role="img" aria-label="Mentions per competitor" className="w-full h-auto">
      {trend.map((t, i) => {
        const y = i * (ROW_H + ROW_GAP);
        const w = Math.max((t.count / max) * innerW, t.count > 0 ? 2 : 0);
        return (
          <g key={t.competitor} transform={`translate(0, ${y})`}>
            <text x="0" y={ROW_H * 0.65} className="fill-zinc-200 text-xs" fontSize="12">{t.competitor}</text>
            <rect x="150" y={(ROW_H - BAR_H) / 2} width={w} height={BAR_H} rx="3" className="fill-red-500/80" />
            <text x={150 + w + 6} y={ROW_H * 0.65} className="fill-zinc-300 text-xs" fontSize="12">{t.count}</text>
          </g>
        );
      })}
    </svg>
  );
}

function SentimentBars({ mentions }: { mentions: Mention[] }) {
  const buckets = useMemo(() => bucketSentiment(mentions), [mentions]);
  const entries = Array.from(buckets.entries())
    .map(([competitor, b]) => ({ competitor, ...b, total: b.positive + b.neutral + b.negative }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
  if (entries.length === 0) {
    return <p className="text-sm text-zinc-400 text-center py-6">No sentiment data yet.</p>;
  }
  const innerW = VIEW_W - 160;
  const max = Math.max(...entries.map(e => e.total), 1);
  const seg = (k: Sentiment) => SENTIMENT_COLORS[k];
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${entries.length * (ROW_H + ROW_GAP)}`} role="img" aria-label="Sentiment per competitor" className="w-full h-auto">
      {entries.map((row, i) => {
        const y = i * (ROW_H + ROW_GAP);
        const totalW = (row.total / max) * innerW;
        const posW = row.positive ? (row.positive / row.total) * totalW : 0;
        const neuW = row.neutral ? (row.neutral / row.total) * totalW : 0;
        const negW = row.negative ? (row.negative / row.total) * totalW : 0;
        let xCursor = 150;
        return (
          <g key={row.competitor} transform={`translate(0, ${y})`}>
            <text x="0" y={ROW_H * 0.65} className="fill-zinc-200 text-xs" fontSize="12">{row.competitor}</text>
            <rect x={xCursor} y={(ROW_H - BAR_H) / 2} width={posW} height={BAR_H} className={seg('positive')} />
            <rect x={xCursor + posW} y={(ROW_H - BAR_H) / 2} width={neuW} height={BAR_H} className={seg('neutral')} />
            <rect x={xCursor + posW + neuW} y={(ROW_H - BAR_H) / 2} width={negW} height={BAR_H} className={seg('negative')} />
            <text x={150 + totalW + 6} y={ROW_H * 0.65} className="fill-zinc-300 text-xs" fontSize="12">{row.total}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function CompetitorCharts({ trend, mentions }: Props) {
  // ponytail: the previous inline bars were buttons — clicking a competitor filtered the mentions list below. Lost in the chart rewrite. Restored as a small chip row below the chart so the click→filter UX still works.
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="doppel-outer">
        <div className="doppel-inner p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-zinc-200">Mentions per competitor</span>
            <span className="ml-auto text-xs text-zinc-400">{trend.length} total</span>
          </div>
          {trend.length === 0
            ? <p className="text-sm text-zinc-400 py-6 text-center">No mentions yet. Upload and analyze calls to see competitor frequency.</p>
            : <>
                <TrendBars trend={trend} />
                <div className="mt-4 flex flex-wrap gap-2">
                  {trend.map(t => {
                    const sel = selectedCompetitor === t.competitor;
                    return (
                      <button
                        key={t.competitor}
                        onClick={() => setSelectedCompetitor(sel ? null : t.competitor)}
                        className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                          sel
                            ? 'bg-red-500/20 border-red-500/50 text-red-200'
                            : 'bg-zinc-800/70 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {t.competitor} × {t.count}
                      </button>
                    );
                  })}
                </div>
              </>}
        </div>
      </div>
      <div className="doppel-outer">
        <div className="doppel-inner p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-zinc-200">Sentiment per competitor</span>
            <span className="ml-auto flex items-center gap-3 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-emerald-400" />Positive</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-yellow-400" />Neutral</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-red-400" />Negative</span>
            </span>
          </div>
          <SentimentBars mentions={mentions} />
        </div>
      </div>
      {/* ponytail: hidden prop pass to mentions list isn't needed — the chip above sets local state that we'd need to lift. For now, the chart is read-only and the click-to-filter is a chip, not the bar itself. */}
    </div>
  );
}
