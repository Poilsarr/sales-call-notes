'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, TrendingUp, Crosshair, ExternalLink, Info, Building2, Users } from 'lucide-react';
import UpgradePrompt from '@/components/upgrade-prompt';
import { CompetitorCharts } from '@/components/competitor-charts';

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
    title?: string | null;
    displayName?: string;
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
  summary: { total: number; uniqueCompetitors: number; days: number; topCompetitor?: string | null };
  meta?: { companyName: string | null; watchlistSize: number; mode: 'watchlist' | 'all' };
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
  const router = useRouter();
  const [data, setData] = useState<CIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlanLocked, setIsPlanLocked] = useState(false);
  const [isAuthError, setIsAuthError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const handleUpgradeClose = () => router.push("/app");

  // V2a — watchlist ownership: mode toggle + header meta
  const [mode, setMode] = useState<'watchlist' | 'all'>('watchlist');
  const [meta, setMeta] = useState<{ companyName: string | null; watchlistSize: number; mode: 'watchlist' | 'all' } | null>(null);
  const [bootstrapDone, setBootstrapDone] = useState(false);

  // Bootstrap company/watchlist to decide default mode (watchlist if non-empty else all)
  // Never blocks rendering of error states; failures fallback to discovery mode.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/company', { cache: 'no-store' })
        .then((r) => r.json().catch(() => ({})))
        .catch(() => ({})),
      fetch('/api/competitors', { cache: 'no-store' })
        .then((r) => r.json().catch(() => ({})))
        .catch(() => ({})),
    ])
      .then(([companyRes, compRes]: [any, any]) => {
        if (cancelled) return;
        const companyName: string | null =
          typeof companyRes?.companyName === 'string' && companyRes.companyName.trim().length > 0
            ? companyRes.companyName.trim()
            : null;
        let watchlistSize = 0;
        if (typeof compRes?.watchlistSize === 'number') watchlistSize = compRes.watchlistSize;
        else if (Array.isArray(compRes?.entries)) watchlistSize = compRes.entries.length;
        else if (typeof compRes?.count === 'number') watchlistSize = compRes.count;
        const nextMode: 'watchlist' | 'all' = watchlistSize > 0 ? 'watchlist' : 'all';
        setMeta({ companyName, watchlistSize, mode: nextMode });
        setMode(nextMode);
        setBootstrapDone(true);
      })
      .catch(() => {
        if (!cancelled) {
          setMeta({ companyName: null, watchlistSize: 0, mode: 'all' });
          setMode('all');
          setBootstrapDone(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!bootstrapDone) return;
    // Clear stale failure states up front so a successful retry
    // (or a fresh filter selection) re-renders the real data.
    setError(null);
    setIsAuthError(false);
    setIsPlanLocked(false);
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCompetitor) params.set('competitor', encodeURIComponent(selectedCompetitor));
    params.set('mode', mode);
    const qs = params.toString() ? `?${params.toString()}` : '';
    fetch(`/api/competitive-intelligence${qs}`)
      .then((r) => {
        if (!r.ok) {
          return r.json().catch(() => ({})).then((body) => {
            if (r.status === 403 && body?.code === 'PLAN_REQUIRED') {
              setData(null);
              setIsPlanLocked(true);
              return;
            }
            if (r.status === 401) {
              setData(null);
              setIsAuthError(true);
              return;
            }
            setData(null);
            setError(body?.message || `Request failed (${r.status})`);
          });
        }
        return r.json().then((json: CIResponse) => {
          setData(json);
          // Keep header meta in sync with server truth (companyName/watchlistSize/mode)
          if (json?.meta) {
            setMeta({
              companyName: json.meta.companyName ?? null,
              watchlistSize: typeof json.meta.watchlistSize === 'number' ? json.meta.watchlistSize : meta?.watchlistSize ?? 0,
              mode: json.meta.mode ?? mode,
            });
            // If server says mode differs (e.g., first bootstrap with watchlist on empty should be 'all'), sync UI without extra fetch
            if (json.meta.mode && json.meta.mode !== mode) {
              // Avoid loop: only sync if we haven't already bootstrapped to that mode
              // The effect will re-run due to mode change, but server already returned correct data for its mode,
              // so the next fetch will be redundant but consistent. We let it re-run once.
            }
          }
        });
      })
      .catch(() => {
        setData(null);
        setError('Network error — could not load competitive data.');
      })
      .finally(() => setLoading(false));
  }, [selectedCompetitor, retryCount, mode, bootstrapDone]);

  // Allow retry to re-run bootstrap + intelligence fetch
  useEffect(() => {
    if (retryCount > 0 && !bootstrapDone) {
      // if bootstrap never completed due to network, allow retry to re-bootstrap
      setBootstrapDone(false);
    }
  }, [retryCount, bootstrapDone]);

  if (loading || !bootstrapDone) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  if (isPlanLocked) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Competitive Intelligence</h1>
          <p className="text-zinc-400">
            Track competitor mentions across all your calls. Know what prospects are saying.
          </p>
        </div>
        <UpgradePrompt feature="competitive_intelligence" featureName="Competitive Intelligence" onClose={handleUpgradeClose} />
      </div>
    );
  }

  if (isAuthError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Competitive Intelligence</h1>
        </div>
        <div className="doppel-outer-dark">
          <div className="doppel-inner-dark p-6 sm:p-8">
            <p className="text-zinc-200 font-medium mb-1">Your session expired.</p>
            <p className="text-zinc-500 text-sm mb-5">Sign back in to load your competitive data.</p>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F26522] hover:bg-[#e05a1a] text-white text-sm font-semibold transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Competitive Intelligence</h1>
        </div>
        <div className="doppel-outer-dark">
          <div className="doppel-inner-dark p-6 sm:p-8">
            <p className="text-zinc-200 font-medium mb-1">Couldn&rsquo;t load competitive data.</p>
            <p className="text-zinc-500 text-sm font-mono">{error}</p>
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F26522] hover:bg-[#e05a1a] text-white text-sm font-semibold transition"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mentions = data?.mentions ?? [];
  const trend = data?.trend ?? [];
  const summary = data?.summary ?? { total: 0, uniqueCompetitors: 0, days: 30 };

  // Use server meta watchlistSize for header/toggle; fallback to bootstrap meta
  const watchlistSize = meta?.watchlistSize ?? 0;
  const companyName = meta?.companyName ?? null;
  const effectiveMode = meta?.mode ?? mode;
  const isWatchlistEmpty = watchlistSize === 0;

  // ponytail: deal risks — when mode=watchlist, mentions already scoped to watchlist hits server-side.
  // Client-side slice remains.
  const dealRisks = mentions.filter(m => m.sentiment === 'negative').slice(0, 3);

  const getPlaybookUrl = (competitor: string): string | null => {
    const map: Record<string, string> = {
      'gong': '/vs/gong',
      'otter': '/vs/otter-ai',
      'otter.ai': '/vs/otter-ai',
      'fireflies': '/vs/fireflies',
      'fireflies.ai': '/vs/fireflies',
      'fathom': '/vs/fathom',
      "tl;dv": '/vs/tldv',
      'tldv': '/vs/tldv',
    };
    const key = competitor.toLowerCase().trim();
    return map[key] ?? null;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white mb-2">Competitive Intelligence</h1>
        <p className="text-zinc-400">
          Track competitor mentions across all your calls. Know what prospects are saying.
        </p>
        {/* Header meta strip: Company + Watchlist size */}
        {meta && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {companyName ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300">
                <Building2 className="w-3 h-3 text-zinc-400" />
                {companyName}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-dashed border-white/[0.08] text-zinc-500">
                <Building2 className="w-3 h-3" />
                No company set
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300">
              <Users className="w-3 h-3 text-zinc-400" />
              Watchlist {watchlistSize}
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-500 capitalize">{effectiveMode} mode</span>
            <Link href="/settings?tab=workspace" className="text-[#F26522] hover:text-[#e05a1a] ml-1">
              Manage in Settings →
            </Link>
          </div>
        )}
      </div>

      {/* Watchlist / All toggle — counts from meta/summary */}
      {meta && (
        <div className="flex items-center gap-3">
          <div className="inline-flex p-1 rounded-full bg-zinc-900 border border-zinc-800">
            <button
              data-testid="mode-watchlist"
              onClick={() => setMode('watchlist')}
              disabled={isWatchlistEmpty}
              title={isWatchlistEmpty ? "Add rivals in Settings to enable watchlist" : undefined}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                mode === 'watchlist'
                  ? 'bg-[#F26522] text-white'
                  : 'text-zinc-400 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              Watchlist{watchlistSize > 0 ? ` (${watchlistSize})` : ''}
            </button>
            <button
              data-testid="mode-all"
              onClick={() => setMode('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                mode === 'all' ? 'bg-white text-black' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All{summary.total > 0 ? ` (${summary.total})` : ''}
            </button>
          </div>
          {isWatchlistEmpty && mode === 'all' && (
            <span className="text-xs text-zinc-500">Watchlist empty — showing discovery mode.</span>
          )}
        </div>
      )}

      {dealRisks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="doppel-outer-dark border-red-500/30"
        >
          <div className="doppel-inner-dark p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded bg-red-500/20">
                <Crosshair className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-sm font-semibold text-red-300">Deal Risks Detected</span>
              <span className="ml-auto text-xs text-zinc-400">{dealRisks.length} threat{dealRisks.length > 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-3">
              {dealRisks.map(risk => {
                const playbook = getPlaybookUrl(risk.competitor);
                return (
                  <div key={risk.id} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-sm font-medium text-white">{risk.competitor}</span>
                        {risk.call && (
                          <span className="text-xs text-zinc-500 ml-2">• {new Date(risk.createdAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      {playbook && (
                        <a
                          href={playbook}
                          className="shrink-0 text-[11px] px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
                        >
                          How to beat →
                        </a>
                      )}
                    </div>
                    {risk.context && (
                      <p className="text-sm text-zinc-300 italic">&ldquo;{risk.context}&rdquo;</p>
                    )}
                    {risk.call && (
                      <a
                        href={`/app/calls/${risk.call.id}`}
                        className="inline-flex items-center gap-1 mt-2 text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {risk.call.displayName ?? risk.call.filename}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
          className="doppel-outer-dark"
        >
          <div className="doppel-inner-dark p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Crosshair className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-sm font-medium text-zinc-300">
                {selectedCompetitor ? `Mentions of "${selectedCompetitor}"` : 'Total Mentions'}
              </span>
            </div>
            <p className="text-3xl font-semibold text-white">{summary.total}</p>
            <p className="text-xs text-zinc-400 mt-1">Last {summary.days} days</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="doppel-outer-dark"
        >
          <div className="doppel-inner-dark p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-zinc-300">Competitors Tracked</span>
            </div>
            <p className="text-3xl font-semibold text-white">{summary.uniqueCompetitors}</p>
            <p className="text-xs text-zinc-400 mt-1">Unique names detected</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="doppel-outer-dark"
        >
          <div className="doppel-inner-dark p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-zinc-300">Top Competitor</span>
            </div>
            <p className="text-3xl font-semibold text-white">
              {trend[0]?.competitor ?? 'N/A'}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              {trend[0] ? `${trend[0].count} mentions` : 'No data yet'}
            </p>
          </div>
        </motion.div>
      </div>

      <CompetitorCharts
        trend={trend}
        mentions={mentions}
        selectedCompetitor={selectedCompetitor}
        onSelectCompetitor={setSelectedCompetitor}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="doppel-outer-dark"
      >
        <div className="doppel-inner-dark p-6">
          {mentions.length > 0 &&
            summary.total > 0 &&
            mentions.every((m) => !m.context && !m.sentiment) && (
              <div className="mb-4 flex items-start gap-2.5 p-4 rounded-lg bg-zinc-800/50 border border-zinc-800">
                <Info className="w-4 h-4 text-zinc-400 mt-px shrink-0" />
                <p className="text-[13px] text-zinc-400 leading-relaxed">
                  {mentions.length} mention(s) detected, but these calls were
                  analyzed before competitor tracking shipped &mdash; context
                  and sentiment aren&rsquo;t available for them yet.
                </p>
              </div>
            )}
          <h2 className="text-lg font-medium text-white mb-4">
            {selectedCompetitor
              ? `Mentions of "${selectedCompetitor}"`
              : 'Recent Mentions'}
          </h2>

          {summary.total > mentions.length && (
            <p className="text-xs text-zinc-400 mb-4">
              Showing the most recent {mentions.length} of {summary.total} mentions.
            </p>
          )}

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
                    Add your rivals in Settings → Workspace → Company & Competitors. Until then, discovery mode.
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
                    <Link
                      href="/settings?tab=workspace"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-black text-[12px] font-semibold transition"
                    >
                      Add rivals
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {mentions.map((mention) => {
                const playbook = getPlaybookUrl(mention.competitor);
                return (
                  <div
                    key={mention.id}
                    role="listitem"
                    className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-800"
                  >
                    {mention.context && (
                      <p className="text-sm text-zinc-200 mb-3 leading-relaxed">
                        &ldquo;{mention.context}&rdquo;
                      </p>
                    )}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getSentimentColor(
                            mention.sentiment
                          )}`}
                        >
                          {getSentimentLabel(mention.sentiment)}
                        </div>
                        <span className="text-sm font-medium text-white">
                          {mention.competitor}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {new Date(mention.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {playbook && (
                          <a
                            href={playbook}
                            className="text-[11px] px-2 py-1 rounded bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 transition"
                          >
                            Playbook →
                          </a>
                        )}
                        {mention.call && (
                          <a
                            href={`/app/calls/${mention.call.id}`}
                            className="text-[11px] px-2 py-1 rounded bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 transition flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Call
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
