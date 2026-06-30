'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
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
  // `isLoaded` distinguishes "Clerk hasn't hydrated yet" from
  // "Clerk hydrated and the user is not signed in". Without this,
  // the previous useEffect bailed out on `!user?.id` and never set
  // `loading=false`, leaving the dashboard stuck on "..." / "Loading..."
  // forever on a hard refresh of a signed-in tab (the bug from the
  // 2026-06-30 video walkthrough).
  const { user, isLoaded: clerkLoaded } = useUser();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clerkLoaded) return;
    if (!user?.id) {
      // Clerk is done hydrating and there's no signed-in user. The
      // route is gated, so this branch is rare (the layout would
      // normally redirect), but handle it gracefully instead of
      // leaving the cards stuck on "...".
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    fetch(`/api/analytics?userId=${user.id}&days=30`)
      .then(r => { if (!r.ok) throw new Error('Failed to load analytics'); return r.json(); })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user?.id, clerkLoaded]);

  const pendingActions = data
    ? data.totalActionItems - Math.round(data.totalActionItems * data.completionRate)
    : 0;

  // Show real numbers, not "..." placeholders. The previous version
  // showed "..." while loading AND when data was null, which made
  // signed-in users see an empty dashboard that looked broken
  // (the second bug from the 2026-06-30 video walkthrough).
  const num = (getter: () => number, format: (n: number) => string = String): string => {
    if (loading) return '…';
    return format(getter());
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white mb-2">Dashboard</h1>
        <p className="text-zinc-400">Overview of your call analytics and performance</p>
      </div>

      <BentoGrid>
        <StatCard
          title="Total Calls"
          value={num(() => data?.totalCalls ?? 0)}
          subtitle="Last 30 days"
          trend={data && data.totalCalls > 0 ? 'up' : 'neutral'}
          delay={0}
        />
        <StatCard
          title="Avg Health Score"
          value={num(() => data?.avgHealthScore ?? 0, n => `${n}%`)}
          subtitle="Across all calls"
          trend={data && (data.avgHealthScore ?? 0) >= 50 ? 'up' : 'neutral'}
          delay={0.1}
        />
        <StatCard
          title="Pending Actions"
          value={pendingActions}
          subtitle="Require attention"
          trend={pendingActions > 0 ? 'neutral' : 'up'}
          delay={0.2}
        />
        <StatCard
          title="Avg Close Rate"
          value={num(() => data?.avgCloseProbability ?? 0, n => `${n}%`)}
          subtitle="Enrollment calls"
          trend={data && (data.avgCloseProbability ?? 0) >= 30 ? 'up' : 'neutral'}
          delay={0.3}
        />
        <StatCard
          title="Completion Rate"
          value={num(() => data?.completionRate ?? 0, n => `${Math.round(n * 100)}%`)}
          subtitle="Action items completed"
          trend={data && (data.completionRate ?? 0) >= 0.5 ? 'up' : 'neutral'}
          delay={0.4}
        />
        <StatCard
          title="Recent Calls"
          value={num(() => data?.recentCalls.length ?? 0)}
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
          ) : !data || data.recentCalls.length === 0 ? (
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
    </div>
  );
}
