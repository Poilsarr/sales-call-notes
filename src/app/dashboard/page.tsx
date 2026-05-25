"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { BarChart3, TrendingUp, Target, Brain, Phone, CheckCircle, AlertTriangle, DollarSign, Calendar, Users, ArrowUp, ArrowDown, Lightbulb, Shield, Zap } from "lucide-react";

type AnalyticsData = {
  scope: string;
  totalCalls: number;
  totalActionItems: number;
  completionRate: number;
  avgHealthScore: number;
  avgCloseProbability: number;
  callsByDay: Record<string, number>;
  scoresByDay: Record<string, number>;
  sentimentCounts: { positive: number; neutral: number; negative: number };
  signals: { budgetSignals: number; timelineSignals: number; dmSignals: number };
  conversationSignals: { totalInterruptions: number; totalQuestionsAsked: number };
  speakerLeaderboard: Array<{
    speaker: string;
    calls: number;
    questionsAsked: number;
    interruptions: number;
  }>;
  recentCalls: Array<{
    id: string;
    filename: string;
    date: string;
    healthScore: number | null;
    sentiment: string | null;
    actionItemCount: number;
    closeProbability: number | null;
    topObjection: string | null;
    ownerName: string | null;
    assigneeName: string | null;
  }>;
};

function normalizeAnalyticsData(payload: Partial<AnalyticsData> | null | undefined): AnalyticsData {
  return {
    scope: payload?.scope || 'personal',
    totalCalls: payload?.totalCalls || 0,
    totalActionItems: payload?.totalActionItems || 0,
    completionRate: payload?.completionRate || 0,
    avgHealthScore: payload?.avgHealthScore || 0,
    avgCloseProbability: payload?.avgCloseProbability || 0,
    callsByDay: payload?.callsByDay || {},
    scoresByDay: payload?.scoresByDay || {},
    sentimentCounts: payload?.sentimentCounts || { positive: 0, neutral: 0, negative: 0 },
    signals: payload?.signals || { budgetSignals: 0, timelineSignals: 0, dmSignals: 0 },
    conversationSignals: payload?.conversationSignals || { totalInterruptions: 0, totalQuestionsAsked: 0 },
    speakerLeaderboard: payload?.speakerLeaderboard || [],
    recentCalls: payload?.recentCalls || [],
  };
}

export default function DashboardPage() {
  const { user } = useUser();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);
  const [scope, setScope] = useState<'personal' | 'team'>('personal');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/analytics?userId=${user.id}&days=${days}&scope=${scope}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load analytics');
        }
        return payload;
      })
      .then((payload) => {
        setData(normalizeAnalyticsData(payload));
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        setData(null);
        setLoading(false);
      });
  }, [user?.id, days, scope]);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-black text-white flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-t-2 border-linear-indigo animate-spin" />
          <Brain className="absolute inset-0 m-auto w-6 h-6 text-linear-indigo animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-black text-white flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-linear-black text-white flex items-center justify-center">
        <p className="text-white/40">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-medium tracking-tight">Analytics</h1>
            <p className="text-white/40 text-sm mt-1">Call performance overview</p>
          </div>
          <div className="flex gap-2">
            {(['personal', 'team'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setScope(value)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition ${
                  scope === value ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                {value === 'personal' ? 'Personal' : 'Team'}
              </button>
            ))}
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition ${
                  days === d ? 'bg-linear-indigo text-white' : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard icon={<Phone className="w-4 h-4" />} label="Total Calls" value={data.totalCalls.toString()} />
          <StatCard icon={<Target className="w-4 h-4" />} label="Action Items" value={data.totalActionItems.toString()} />
          <StatCard
            icon={<CheckCircle className="w-4 h-4" />}
            label="Completion Rate"
            value={`${Math.round(data.completionRate * 100)}%`}
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Avg Health Score"
            value={`${data.avgHealthScore}%`}
            accent={data.avgHealthScore >= 60 ? "text-green-400" : data.avgHealthScore >= 40 ? "text-yellow-400" : "text-red-400"}
          />
          <StatCard
            icon={<Zap className="w-4 h-4" />}
            label="Avg Close Probability"
            value={`${data.avgCloseProbability}%`}
            accent={data.avgCloseProbability >= 60 ? "text-green-400" : data.avgCloseProbability >= 40 ? "text-yellow-400" : "text-red-400"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 p-6 rounded-2xl linear-surface linear-border">
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">Call Signals</h3>
            <div className="grid grid-cols-3 gap-4">
              <SignalBar label="Budget" count={data.signals.budgetSignals} total={data.totalCalls} icon={<DollarSign className="w-3.5 h-3.5" />} />
              <SignalBar label="Timeline" count={data.signals.timelineSignals} total={data.totalCalls} icon={<Calendar className="w-3.5 h-3.5" />} />
              <SignalBar label="Decision Maker" count={data.signals.dmSignals} total={data.totalCalls} icon={<Users className="w-3.5 h-3.5" />} />
            </div>
          </div>
          <div className="p-6 rounded-2xl linear-surface linear-border">
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">Sentiment</h3>
            <div className="space-y-3">
              <SentimentRow label="Positive" count={data.sentimentCounts.positive} color="text-green-400" icon={<ArrowUp className="w-3 h-3" />} />
              <SentimentRow label="Neutral" count={data.sentimentCounts.neutral} color="text-yellow-400" icon={<ArrowUp className="w-3 h-3 opacity-0" />} />
              <SentimentRow label="Negative" count={data.sentimentCounts.negative} color="text-red-400" icon={<ArrowDown className="w-3 h-3" />} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-2xl linear-surface linear-border">
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">Conversation Flow</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="Interruptions" value={String(data.conversationSignals.totalInterruptions)} />
              <StatCard icon={<Lightbulb className="w-4 h-4" />} label="Questions Asked" value={String(data.conversationSignals.totalQuestionsAsked)} />
            </div>
          </div>
          <div className="p-6 rounded-2xl linear-surface linear-border">
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">Speaker Leaderboard</h3>
            <div className="space-y-3">
              {data.speakerLeaderboard.length === 0 ? (
                <p className="text-sm text-white/30">No speaker analytics available yet.</p>
              ) : (
                data.speakerLeaderboard.map((speaker) => (
                  <div key={speaker.speaker} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="text-white">{speaker.speaker}</div>
                      <div className="text-white/35 text-xs">{speaker.calls} calls</div>
                    </div>
                    <div className="text-right text-xs text-white/50">
                      <div>{speaker.questionsAsked} questions</div>
                      <div>{speaker.interruptions} interruptions</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl linear-surface linear-border mb-8">
          <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">Recent Calls</h3>
          <div className="space-y-2">
            {data.recentCalls.map(call => (
              <div key={call.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 text-xs">
                <div className="flex items-center gap-3">
                  <Phone className="w-3.5 h-3.5 text-white/40" />
                  <span className="font-medium">{call.filename}</span>
                  <span className="text-white/30">{new Date(call.date).toLocaleDateString()}</span>
                  {call.ownerName && <span className="text-white/30">Owner: {call.ownerName}</span>}
                  {call.assigneeName && <span className="text-white/30">Assigned: {call.assigneeName}</span>}
                </div>
                <div className="flex items-center gap-4">
                  <span className={`${call.healthScore !== null && call.healthScore !== undefined && call.healthScore >= 60 ? 'text-green-400' : call.healthScore !== null && call.healthScore !== undefined && call.healthScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {call.healthScore !== null && call.healthScore !== undefined ? `${Math.round(call.healthScore * 100)}%` : 'N/A'}
                  </span>
                  <span className="text-white/40">{call.actionItemCount} items</span>
                  {call.closeProbability && (
                    <span className="text-linear-indigo">{Math.round(call.closeProbability)}% close</span>
                  )}
                  {call.topObjection && (
                    <span className="text-red-400/70 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {call.topObjection}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div className="p-5 rounded-2xl linear-surface linear-border">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-white/40">{icon}</span>
        <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">{label}</span>
      </div>
      <span className={`text-2xl font-semibold tracking-tight ${accent || 'text-white'}`}>{value}</span>
    </div>
  );
}

function SignalBar({ label, count, total, icon }: { label: string; count: number; total: number; icon: React.ReactNode }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-white/40">{icon}</span>
        <span className="text-xs font-medium text-white/60">{label}</span>
        <span className="text-xs text-white/40 ml-auto">{count}/{total}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full bg-linear-indigo transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SentimentRow({ label, count, color, icon }: { label: string; count: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-2">
        <span className={color}>{icon}</span>
        <span className="text-white/60">{label}</span>
      </span>
      <span className={`font-medium ${color}`}>{count}</span>
    </div>
  );
}
