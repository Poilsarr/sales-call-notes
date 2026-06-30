'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Crosshair, ExternalLink } from 'lucide-react';
import UpgradePrompt from '@/components/upgrade-prompt';

interface CompetitorMention {
  id: string;
  competitor: string;
  context: string | null;
  sentiment: string | null;
  mentionedBy: string | null;
  timestamp: number | null;
  createdAt: string;
  call: {
    id: string;
    filename: string;
    createdAt: string;
  } | null;
}

interface TrendItem {
  competitor: string;
  count: number;
}

interface CIResponse {
  mentions: CompetitorMention[];
  trend: TrendItem[];
  summary: { total: number; uniqueCompetitors: number; days: number };
}

function getSentimentColor(sentiment: string | null) {
  if (sentiment === 'negative') return 'text-red-400 bg-red-500/10 border-red-500/20';
  if (sentiment === 'positive') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
}

function getSentimentLabel(sentiment: string | null) {
  if (sentiment === 'negative') return 'Threat';
  if (sentiment === 'positive') return 'Positive';
  return 'Neutral';
}

export default function IntelligencePage() {
  const [data, setData] = useState<CIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);

  useEffect(() => {
    const params = selectedCompetitor ? `?competitor=${encodeURIComponent(selectedCompetitor)}` : '';
    fetch(`/api/competitive-intelligence${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ mentions: [], trend: [], summary: { total: 0, uniqueCompetitors: 0, days: 30 } }))
      .finally(() => setLoading(false));
  }, [selectedCompetitor]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  const mentions = data?.mentions ?? [];
  const trend = data?.trend ?? [];
  const summary = data?.summary ?? { total: 0, uniqueCompetitors: 0, days: 30 };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white mb-2">Competitive Intelligence</h1>
        <p className="text-zinc-400">
          Track competitor mentions across all your calls. Know what prospects are saying.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
          className="doppel-outer"
        >
          <div className="doppel-inner p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Crosshair className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-sm text-zinc-500">Total Mentions</span>
            </div>
            <p className="text-3xl font-semibold text-white">{summary.total}</p>
            <p className="text-xs text-zinc-600 mt-1">Last {summary.days} days</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="doppel-outer"
        >
          <div className="doppel-inner p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm text-zinc-500">Competitors Tracked</span>
            </div>
            <p className="text-3xl font-semibold text-white">{summary.uniqueCompetitors}</p>
            <p className="text-xs text-zinc-600 mt-1">Unique names detected</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="doppel-outer"
        >
          <div className="doppel-inner p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm text-zinc-500">Top Competitor</span>
            </div>
            <p className="text-3xl font-semibold text-white">
              {trend[0]?.competitor ?? 'N/A'}
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              {trend[0] ? `${trend[0].count} mentions` : 'No data yet'}
            </p>
          </div>
        </motion.div>
      </div>

      <UpgradePrompt feature="competitive_alerts" featureName="Competitive Alerts" minimal />

      {trend.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="doppel-outer"
        >
          <div className="doppel-inner p-6">
            <h2 className="text-lg font-medium text-white mb-4">Mention Frequency</h2>
            <div className="space-y-3">
              {trend.map((item) => {
                const maxCount = trend[0].count;
                const width = Math.max((item.count / maxCount) * 100, 4);
                const isSelected = selectedCompetitor === item.competitor;
                return (
                  <button
                    key={item.competitor}
                    onClick={() =>
                      setSelectedCompetitor(isSelected ? null : item.competitor)
                    }
                    className={`w-full text-left transition-all ${
                      isSelected ? 'opacity-100' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-zinc-300 font-medium">
                        {item.competitor}
                        {isSelected && (
                          <span className="ml-2 text-xs text-zinc-500">(filtered)</span>
                        )}
                      </span>
                      <span className="text-sm text-zinc-500">{item.count}x</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="doppel-outer"
        >
          <div className="doppel-inner p-6">
            <h2 className="text-lg font-medium text-white mb-4">Mention Frequency</h2>
            <p className="text-sm text-zinc-500 text-center py-8">No trend data available yet. Upload and analyze calls to see competitor mention trends.</p>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="doppel-outer"
      >
        <div className="doppel-inner p-6">
          <h2 className="text-lg font-medium text-white mb-4">
            {selectedCompetitor
              ? `Mentions of "${selectedCompetitor}"`
              : 'Recent Mentions'}
          </h2>

          {mentions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 sm:p-10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 flex items-center justify-center shrink-0">
                  <Crosshair className="w-5 h-5 text-[#F26522]" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-white mb-1">
                    No competitor mentions found yet.
                  </p>
                  <p className="text-[13px] text-zinc-400 leading-relaxed mb-5">
                    Every call is scanned for Gong, Otter, Chorus, Fireflies,
                    and 40+ other names. The moment a prospect says one,
                    it shows up here with the exact line and the speaker.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="/app/record"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F26522] hover:bg-[#e05a1a] text-white text-[12px] font-semibold transition"
                    >
                      Upload a call
                    </a>
                    <a
                      href="/extension"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-[12px] font-semibold transition"
                    >
                      Set up the extension
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {mentions.map((mention, i) => (
                <div
                  key={mention.id}
                  role="listitem"
                  className="flex items-start gap-4 p-4 rounded-lg bg-zinc-800/50 border border-zinc-800"
                >
                  <div
                    className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border ${getSentimentColor(
                      mention.sentiment
                    )}`}
                  >
                    {getSentimentLabel(mention.sentiment)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">
                        {mention.competitor}
                      </span>
                      <span className="text-xs text-zinc-600">
                        {new Date(mention.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {mention.context && (
                      <p className="text-sm text-zinc-400 line-clamp-2">
                        &ldquo;{mention.context}&rdquo;
                      </p>
                    )}
                    {mention.call && (
                      <a
                        href={`/app/calls/${mention.call.id}`}
                        className="inline-flex items-center gap-1 mt-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {mention.call.filename}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
