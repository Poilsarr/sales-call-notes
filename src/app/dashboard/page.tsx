"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Nav from "@/components/nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { StatGrid } from "@/components/ui/stat-grid";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AreaChart } from "@/components/ui/area-chart";
import { DonutChart } from "@/components/ui/donut-chart";
import { Badge } from "@/components/ui/badge";
import CallSearch from "@/components/call-search";
import { getPlan, type PlanTier } from "@/lib/plans";
import {
  BarChart3,
  TrendingUp,
  Target,
  Brain,
  Phone,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  Users,
  ArrowUp,
  ArrowDown,
  Lightbulb,
  Shield,
  Zap,
  MessageSquare,
  Send,
  FileText,
  Crown,
  Activity,
  Clock,
  Layers,
} from "lucide-react";

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
    title?: string | null;
    displayName?: string;
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

type BillingInfo = {
  plan: PlanTier;
  usage: number;
  minuteUsage: number;
  limit: number | "unlimited";
  minuteLimit: number | "unlimited";
};

function normalizeAnalyticsData(payload: Partial<AnalyticsData> | null | undefined): AnalyticsData {
  return {
    scope: payload?.scope || "personal",
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

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const [onboardChecked, setOnboardChecked] = useState(false);

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [days, setDays] = useState(30);
  const [scope, setScope] = useState<"personal" | "team">("personal");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ponytail: onboarding gate — same pattern as /app/layout.tsx
  useEffect(() => {
    if (!user?.id) return;
    fetch("/api/user")
      .then(r => r.json())
      .then(d => {
        if (d.hasOnboarded === false) {
          router.replace("/onboarding");
        } else {
          setOnboardChecked(true);
        }
      })
      .catch(() => setOnboardChecked(true));
  }, [user?.id, router]);

  // AI Meeting Assistant state
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
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/api/analytics?userId=${user.id}&days=${days}&scope=${scope}`).then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Failed to load analytics");
        return payload;
      }),
      fetch("/api/billing", { cache: "no-store" })
        .then(async (r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([analyticsPayload, billingPayload]) => {
        setData(normalizeAnalyticsData(analyticsPayload));
        if (billingPayload) setBilling(billingPayload);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
        setData(null);
        setLoading(false);
      });
  }, [user?.id, days, scope]);

  const chartData = useMemo(() => {
    if (!data) return [];
    const sorted = Object.keys(data.callsByDay).sort();
    return sorted.map((day) => ({ label: formatDateLabel(day), value: data.callsByDay[day] || 0 }));
  }, [data]);

  const scoreTrendData = useMemo(() => {
    if (!data) return [];
    const sorted = Object.keys(data.scoresByDay).sort();
    return sorted.map((day) => ({ label: formatDateLabel(day), value: data.scoresByDay[day] || 0 }));
  }, [data]);

  const plan = billing ? getPlan(billing.plan) : getPlan("free");
  const usagePct =
    billing && typeof billing.limit === "number" && billing.limit > 0
      ? Math.min(100, (billing.usage / billing.limit) * 100)
      : 0;
  const minutePct =
    billing && typeof billing.minuteLimit === "number" && billing.minuteLimit > 0
      ? Math.min(100, (billing.minuteUsage / billing.minuteLimit) * 100)
      : 0;

  if (loading || !onboardChecked) {
    return (
      <div className="min-h-screen bg-linear-black text-white">
        <Nav />
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Header skeleton */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-10">
            <div>
              <div className="h-8 w-40 rounded bg-white/10 animate-pulse mb-2" />
              <div className="h-4 w-64 rounded bg-white/10 animate-pulse" />
            </div>
            <div className="h-10 w-64 rounded-xl bg-white/10 animate-pulse" />
          </div>
          {/* KPI grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="h-3 w-24 rounded bg-white/10 animate-pulse mb-3" />
                <div className="h-7 w-16 rounded bg-white/10 animate-pulse" />
              </div>
            ))}
          </div>
          {/* Charts skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 lg:row-span-2 h-[400px]" />
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 lg:col-span-2 h-[200px]" />
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 lg:col-span-2 h-[180px]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    const message = error || "No analytics data available yet.";
    return (
      <div className="min-h-screen bg-linear-black text-white flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center px-6 py-24">
          <div className="max-w-md w-full text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <BarChart3 className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-lg font-medium mb-2">Analytics unavailable</h2>
            <p className="text-sm text-white/50 mb-6">{message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-full bg-white text-linear-black text-xs font-semibold hover:bg-white/90 transition"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-black text-white">
      <Nav />
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">Analytics</h1>
            <p className="text-white/40 text-sm mt-1">Understand your calls, pipeline, and team performance.</p>
          </div>

          <div className="flex items-center gap-2 p-1 rounded-xl bg-linear-black border border-linear-secondary">
            {(["personal", "team"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setScope(value)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition ${
                  scope === value ? "bg-white text-linear-black" : "text-white/50 hover:text-white"
                }`}
              >
                {value === "personal" ? "Personal" : "Team"}
              </button>
            ))}
            <div className="w-px h-5 bg-white/10 mx-1" />
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                  days === d ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {data.totalCalls === 0 && (
          <div className="mb-8 p-5 rounded-2xl border border-dashed border-[#F26522]/20 bg-[#F26522]/[0.02] flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 flex items-center justify-center shrink-0 animate-pulse">
              <BarChart3 className="w-5 h-5 text-[#F26522]" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white mb-1">No calls yet</h3>
              <p className="text-xs text-white/50">
                Upload an MP3, record in browser, or pipe from the Chrome extension. Your first call shows up here in under 60 seconds.
              </p>
            </div>
            <a
              href="/app/record"
              className="px-5 py-2.5 rounded-full bg-[#F26522] hover:bg-[#e05a1a] text-white text-xs font-semibold transition-colors shrink-0"
            >
              Upload your first call
            </a>
          </div>
        )}

        {/* Semantic recall */}
        <Section
          title="Search your calls"
          description="Ask for any call in plain language — objections, budget talk, next steps."
        >
          <Card>
            <CardContent>
              <CallSearch />
            </CardContent>
          </Card>
        </Section>

        {/* KPI grid */}
        <Section>
          <StatGrid
            stats={[
              {
                label: "Avg health score",
                value: `${data.avgHealthScore}%`,
                icon: <Activity className="w-4 h-4" />,
                change: data.avgHealthScore >= 60 ? "Healthy" : "Needs work",
                changeType: data.avgHealthScore >= 60 ? "positive" : "negative",
              },
              {
                label: "Avg close probability",
                value: `${data.avgCloseProbability}%`,
                icon: <TrendingUp className="w-4 h-4" />,
                change: data.avgCloseProbability >= 50 ? "Strong pipeline" : "Nurture needed",
                changeType: data.avgCloseProbability >= 50 ? "positive" : "negative",
              },
              {
                label: "Total calls",
                value: data.totalCalls,
                icon: <Phone className="w-4 h-4" />,
              },
              {
                label: "Action items",
                value: `${data.totalActionItems} · ${Math.round(data.completionRate * 100)}% done`,
                icon: <Target className="w-4 h-4" />,
              },
            ]}
          />
        </Section>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* AI Assistant */}
          <Card className="lg:row-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-linear-indigo/10 flex items-center justify-center text-linear-indigo">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>AI Meeting Assistant</CardTitle>
                  <CardDescription>Ask anything about your calls.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-80px)]">
              <div className="flex gap-2 mb-4">
                <label htmlFor="ai-assistant-input" className="sr-only">
                  Ask about your calls
                </label>
                <input
                  id="ai-assistant-input"
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askChat()}
                  placeholder='e.g. "What objections came up last week?"'
                  className="flex-1 px-4 py-2.5 rounded-xl bg-linear-black border border-linear-secondary text-sm text-white placeholder-white/50 focus:outline-none focus-visible:outline-2 focus-visible:outline-linear-indigo focus:border-linear-indigo/50"
                />
                <button
                  onClick={askChat}
                  disabled={chatLoading || !chatQuery.trim()}
                  aria-label="Send question"
                  className="px-4 py-2.5 bg-linear-indigo rounded-xl text-xs font-semibold hover:bg-linear-indigo/80 transition disabled:opacity-50"
                >
                  {chatLoading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div
                role="status"
                aria-live="polite"
                aria-busy={chatLoading}
                className="flex-1"
              >
              {chatResult ? (
                <div className="h-full p-4 rounded-xl bg-linear-black border border-linear-secondary overflow-y-auto max-h-[360px]">
                  <div className="flex items-start gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-linear-indigo shrink-0 mt-0.5" />
                    <p className="text-sm text-white/80 leading-relaxed">{chatResult.answer}</p>
                  </div>
                  {chatResult.relevantCalls?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <div className="text-[11px] text-white/40 uppercase tracking-wider mb-2">Source calls</div>
                      {chatResult.relevantCalls.map((c: any) => (
                        <div key={c.id} className="flex items-center gap-2 text-xs text-white/60 py-1">
                          <FileText className="w-3 h-3" />
                          <span className="truncate">{c.displayName ?? c.filename}</span>
                          <span className="text-white/30 shrink-0">{new Date(c.date).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center p-6 rounded-xl bg-linear-black border border-linear-secondary border-dashed">
                  <Brain className="w-8 h-8 text-white/10 mb-3" />
                  <p className="text-sm text-white/40">Ask about objections, next steps, or buyer sentiment.</p>
                </div>
              )}
              </div>
            </CardContent>
          </Card>

          {/* Call volume */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Call volume</CardTitle>
                <Badge variant="info">{chartData.reduce((a, b) => a + b.value, 0)} calls</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <AreaChart data={chartData} height={200} />
            </CardContent>
          </Card>

          {/* Health trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Health score trend</CardTitle>
                <span className="text-xs text-white/40">Avg {data.avgHealthScore}%</span>
              </div>
            </CardHeader>
            <CardContent>
              <AreaChart data={scoreTrendData} height={140} color="#22d3a8" />
            </CardContent>
          </Card>
        </div>

        {/* Usage + signals + sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Plan usage */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-linear-indigo" />
                <CardTitle>Usage</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {billing ? (
                <>
                  <ProgressBar
                    label="Call uploads"
                    sublabel={`${billing.usage} / ${billing.limit}`}
                    value={billing.usage}
                    max={typeof billing.limit === "number" ? billing.limit : 100}
                    color={usagePct > 90 ? "red" : usagePct > 70 ? "amber" : "indigo"}
                  />
                  <ProgressBar
                    label="Minutes"
                    sublabel={`${billing.minuteUsage} / ${billing.minuteLimit}`}
                    value={billing.minuteUsage}
                    max={typeof billing.minuteLimit === "number" ? billing.minuteLimit : 100}
                    color={minutePct > 90 ? "red" : minutePct > 70 ? "amber" : "indigo"}
                  />
                  <div className="pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Plan</span>
                      <span className="text-white font-medium">{plan.name}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-white/40">Unable to load usage.</p>
              )}
            </CardContent>
          </Card>

          {/* Signals */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-linear-indigo" />
                <CardTitle>Buying signals</CardTitle>
              </div>
              <CardDescription>How often key intent signals appeared.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <SignalBar label="Budget" count={data.signals.budgetSignals} total={data.totalCalls} icon={<DollarSign className="w-3.5 h-3.5" />} />
              <SignalBar label="Timeline" count={data.signals.timelineSignals} total={data.totalCalls} icon={<Calendar className="w-3.5 h-3.5" />} />
              <SignalBar label="Decision maker" count={data.signals.dmSignals} total={data.totalCalls} icon={<Users className="w-3.5 h-3.5" />} />
            </CardContent>
          </Card>

          {/* Sentiment */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-linear-indigo" />
                <CardTitle>Sentiment</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <DonutChart
                data={[
                  { label: "Positive", value: data.sentimentCounts.positive, color: "#34d399" },
                  { label: "Neutral", value: data.sentimentCounts.neutral, color: "#fbbf24" },
                  { label: "Negative", value: data.sentimentCounts.negative, color: "#f87171" },
                ]}
                size={120}
                centerValue={data.totalCalls}
                centerLabel="calls"
              />
            </CardContent>
          </Card>
        </div>

        {/* Conversation + leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-linear-indigo" />
                <CardTitle>Conversation flow</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <MiniStat label="Interruptions" value={data.conversationSignals.totalInterruptions} icon={<AlertTriangle className="w-4 h-4" />} />
              <MiniStat label="Questions asked" value={data.conversationSignals.totalQuestionsAsked} icon={<Lightbulb className="w-4 h-4" />} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Crown className="w-4 h-4 text-linear-indigo" />
                <CardTitle>Top performers</CardTitle>
              </div>
              <CardDescription>Ranked by questions asked across calls.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.speakerLeaderboard.length === 0 ? (
                <p className="text-sm text-white/30">No speaker analytics available yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.speakerLeaderboard.map((speaker, idx) => (
                    <div
                      key={speaker.speaker}
                      className="flex items-center justify-between p-3 rounded-xl bg-linear-black border border-linear-secondary"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-xs text-white/50 font-medium">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{speaker.speaker}</div>
                          <div className="text-[11px] text-white/40">{speaker.calls} calls</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/50">
                        <span>{speaker.questionsAsked} questions</span>
                        <span>{speaker.interruptions} interruptions</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent calls */}
        <Section title="Recent calls" description="Latest calls with health, sentiment, and action items.">
          <Card>
            <CardContent className="p-0">
              {data.recentCalls.length === 0 ? (
                <div className="p-8 text-center text-sm text-white/30">No recent calls.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {data.recentCalls.map((call) => (
                    <a
                      key={call.id}
                      href={`/app/calls/${call.id}`}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 hover:bg-white/[0.02] transition group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-linear-indigo/10 flex items-center justify-center text-linear-indigo shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate group-hover:text-linear-indigo transition">
                            {call.displayName ?? call.filename}
                          </p>
                          <p className="text-[11px] text-white/40">
                            {new Date(call.date).toLocaleDateString()}
                            {call.ownerName ? ` · ${call.ownerName}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                        <Badge variant={getHealthVariant(call.healthScore)}>{formatHealth(call.healthScore)}</Badge>
                        {call.sentiment && (
                          <Badge variant={getSentimentVariant(call.sentiment)}>{call.sentiment}</Badge>
                        )}
                        <span className="text-xs text-white/40">{call.actionItemCount} items</span>
                        {call.closeProbability && (
                          <span className="text-xs text-linear-indigo">{Math.round(call.closeProbability)}% close</span>
                        )}
                        {call.topObjection && (
                          <span className="text-xs text-red-400/70 flex items-center gap-1 truncate max-w-[200px]">
                            <AlertTriangle className="w-3 h-3" /> {call.topObjection}
                          </span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Section>
      </div>
    </div>
  );
}

function SignalBar({
  label,
  count,
  total,
  icon,
}: {
  label: string;
  count: number;
  total: number;
  icon: React.ReactNode;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-white/40">{icon}</span>
        <span className="text-xs font-medium text-white/60">{label}</span>
        <span className="text-xs text-white/40 ml-auto">
          {count}/{total}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full bg-linear-indigo transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-linear-black border border-linear-secondary">
      <div className="flex items-center gap-3">
        <span className="text-white/30">{icon}</span>
        <span className="text-sm text-white/60">{label}</span>
      </div>
      <span className="text-lg font-semibold text-white">{value}</span>
    </div>
  );
}

function formatHealth(score: number | null): string {
  if (score === null || score === undefined) return "N/A";
  return `${Math.round(score)}%`;
}

function getHealthVariant(score: number | null): "success" | "warning" | "danger" | "default" {
  if (score === null || score === undefined) return "default";
  if (score >= 70) return "success";
  if (score >= 45) return "warning";
  return "danger";
}

function getSentimentVariant(sentiment: string): "success" | "warning" | "danger" | "default" {
  if (sentiment === "positive") return "success";
  if (sentiment === "negative") return "danger";
  return "warning";
}
