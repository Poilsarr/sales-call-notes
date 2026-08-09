'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, TrendingUp, Crosshair, ExternalLink } from 'lucide-react';
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
  const router = useRouter();
  const [data, setData] = useState<CIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlanLocked, setIsPlanLocked] = useState(false);
  const [isAuthError, setIsAuthError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  // ponytail: bumping retryCount re-runs the fetch so the error card
  // gets a working "Try again" without a full page reload.
  const [retryCount, setRetryCount] = useState(0);
  // ponytail: close = back to workspace root, not /dashboard.
  const handleUpgradeClose = () => router.push("/app");

  useEffect(() => {
    // Clear stale failure states up front so a successful retry
    // (or a fresh filter selection) re-renders the real data.
    setError(null);
    setIsAuthError(false);
    setIsPlanLocked(false);
    const params = selectedCompetitor ? `?competitor=${encodeURIComponent(selectedCompetitor)}` : '';
    fetch(`/api/competitive-intelligence${params}`)
      .then((r) => {
        // Check r.ok BEFORE parsing — per the karpathy pitfall, a
        // `.then(r => r.json()).then(setData)` pattern would
        // happily treat a 403 PLAN_REQUIRED or 500 error payload
        // as a valid CIResponse, and the page would render
        // empty/garbage. Distinguish the three failure modes:
        //   403 PLAN_REQUIRED → "data" is null, isPlanLocked true
        //                       → render the upgrade prompt only,
        //                         no stat cards (the user can't
        //                         use this feature on their plan)
        //   401 → "data" null, isAuthError true → re-auth prompt
        //   4xx/5xx → "data" null, error string set → error card
        //   network → "data" null, error string set → error card
        //   (same card as 4xx/5xx — no fake-empty fallback)
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
        return r.json().then(setData);
      })
      .catch(() => {
        setData(null);
        setError('Network error — could not load competitive data.');
      })
      .finally(() => setLoading(false));
  }, [selectedCompetitor, retryCount]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  // 403 PLAN_REQUIRED — render the upgrade prompt only, no stat
  // cards (the user can't use this feature on their plan and the
  // stat cards would all show 0, which lies about what the page is
  // doing). Use the full upgrade prompt (not the minimal banner) so
  // the user gets a clear path forward.
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

  // 401 — session expired. Clear message, sign-back-in CTA.
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

  // 4xx/5xx — real error card. Replaces the "blank stat + dead void"
  // failure mode from the 2026-06-30 video.
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

  // ponytail: pre-compute deal risks (negative sentiment = actionable threat)
  const dealRisks = mentions.filter(m => m.sentiment === 'negative').slice(0, 3);

  // ponytail: map competitor names to /vs/* pages for one-click playbooks
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
      </div>

      {/* ponytail: deal risk section — shows first if there are threats */}
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
                    Every uploaded call is scanned for Gong, Otter, Chorus,
                    Fireflies, and 40+ other names. When a prospect mentions
                    one, it shows up here — linked to the call it came from.
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
              {mentions.map((mention) => {
                const playbook = getPlaybookUrl(mention.competitor);
                return (
                  <div
                    key={mention.id}
                    role="listitem"
                    className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-800"
                  >
                    {/* ponytail: context FIRST, competitor name SECOND */}
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
