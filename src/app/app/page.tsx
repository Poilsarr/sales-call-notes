'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Brain, Send, MessageSquare, FileText } from 'lucide-react';
import { StatCard, BentoGrid } from '@/components/bento-stats';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface AnalyticsData {
  totalCalls: number;
  totalActionItems: number;
  completionRate: number;
  avgHealthScore: number;
  avgCloseProbability: number;
  recentCalls: Array<{
    id: string;
    filename: string;
    date: string;
    healthScore: number | null;
    sentiment: string | null;
    actionItemCount: number;
    closeProbability: number | null;
  }>;
}

export default function DashboardPage() {
  const { user } = useUser();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatQuery, setChatQuery] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatResult, setChatResult] = useState<{ answer: string; relevantCalls: any[] } | null>(null);

  const askChat = async () => {
    if (!chatQuery.trim() || !user?.id) return;
    setChatLoading(true);
    setChatResult(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: chatQuery, userId: user.id }),
      });
      const payload = await res.json();
      setChatResult(payload);
    } catch {
      setChatResult({ answer: "Failed to query meetings. Please try again.", relevantCalls: [] });
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    setError(null);
    fetch(`/api/analytics?userId=${user.id}&days=30`)
      .then(r => { if (!r.ok) throw new Error('Failed to load analytics'); return r.json(); })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const pendingActions = data
    ? data.totalActionItems - Math.round(data.totalActionItems * data.completionRate)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white mb-2">Dashboard</h1>
        <p className="text-zinc-400">Overview of your call analytics and performance</p>
      </div>

      <BentoGrid>
        <StatCard
          title="Total Calls"
          value={loading ? '...' : data?.totalCalls ?? 0}
          subtitle="Last 30 days"
          trend={data && data.totalCalls > 0 ? 'up' : 'neutral'}
          delay={0}
        />
        <StatCard
          title="Avg Health Score"
          value={loading ? '...' : `${data?.avgHealthScore ?? 0}%`}
          subtitle="Across all calls"
          trend={data && (data.avgHealthScore ?? 0) >= 50 ? 'up' : 'neutral'}
          delay={0.1}
        />
        <StatCard
          title="Pending Actions"
          value={loading ? '...' : pendingActions}
          subtitle="Require attention"
          trend={pendingActions > 0 ? 'neutral' : 'up'}
          delay={0.2}
        />
        <StatCard
          title="Avg Close Rate"
          value={loading ? '...' : `${data?.avgCloseProbability ?? 0}%`}
          subtitle="Enrollment calls"
          trend={data && (data.avgCloseProbability ?? 0) >= 30 ? 'up' : 'neutral'}
          delay={0.3}
        />
        <StatCard
          title="Completion Rate"
          value={loading ? '...' : `${Math.round((data?.completionRate ?? 0) * 100)}%`}
          subtitle="Action items completed"
          trend={data && (data.completionRate ?? 0) >= 0.5 ? 'up' : 'neutral'}
          delay={0.4}
        />
        <StatCard
          title="Recent Calls"
          value={loading ? '...' : data?.recentCalls.length ?? 0}
          subtitle="In last 30 days"
          trend="neutral"
          delay={0.5}
        />
      </BentoGrid>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="doppel-outer"
      >
        <div className="doppel-inner p-6">
          <h2 className="text-lg font-medium text-white mb-4">Recent Calls</h2>
          {error ? (
            <p className="text-red-400 text-center py-8">{error}</p>
          ) : loading ? (
            <p className="text-zinc-500">Loading...</p>
          ) : data?.recentCalls.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No calls analyzed yet. Upload your first call to get started.</p>
          ) : (
            <div className="space-y-3">
              {data?.recentCalls.map((call) => {
                const score = call.healthScore ?? call.closeProbability ?? 0;
                const scoreColor = score >= 70 ? 'bg-emerald-500/10 text-emerald-400' : score >= 40 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400';
                return (
                  <Link
                    key={call.id}
                    href={`/app/calls/${call.id}`}
                    className="flex items-center justify-between py-3 border-b border-zinc-800 hover:bg-zinc-800/50 px-3 rounded-lg transition-colors"
                  >
                    <div>
                      <p className="text-white font-medium">{call.filename}</p>
                      <p className="text-sm text-zinc-500">
                        {call.date ? new Date(call.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown date'}
                        {call.actionItemCount > 0 && ` · ${call.actionItemCount} action items`}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${scoreColor}`}>
                      {Math.round(score)}%
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7, ease: [0.32, 0.72, 0, 1] }}
        className="doppel-outer"
      >
        <div className="doppel-inner p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-[#F26522]" />
            <h2 className="text-sm font-medium text-white">AI Meeting Assistant</h2>
          </div>

          <p className="text-sm text-zinc-500 mb-4">
            Ask questions about your meeting history. Get instant answers with source calls.
          </p>

          <div className="flex gap-2 mb-4">
            <input
              value={chatQuery}
              onChange={(e) => setChatQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askChat()}
              placeholder='Ask anything... e.g., "What objections came up last week?"'
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#F26522]/50"
            />
            <button
              onClick={askChat}
              disabled={chatLoading || !chatQuery.trim()}
              className="px-5 py-3 bg-[#F26522] rounded-xl text-xs font-semibold hover:bg-[#F26522]/80 transition disabled:opacity-50 flex items-center justify-center"
            >
              {chatLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          {chatResult && (
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-start gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-[#F26522] shrink-0 mt-0.5" />
                <p className="text-sm text-zinc-300 leading-relaxed">{chatResult.answer}</p>
              </div>

              {chatResult.relevantCalls?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Source calls</div>
                  {chatResult.relevantCalls.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-2 text-xs text-zinc-500 py-1">
                      <FileText className="w-3 h-3" />
                      <span>{c.filename}</span>
                      <span className="text-zinc-600">{new Date(c.date).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[11px] text-zinc-600 mt-2">
                Searched {chatResult.relevantCalls?.length ? chatResult.relevantCalls.length : "0"} calls
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
