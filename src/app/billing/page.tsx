"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import Link from "next/link";
import Nav from "@/components/nav";
import UsageDisplay from "@/components/usage-display";
import {
  Crown, CheckCircle, Sparkles, Loader2, AlertTriangle, Ban, Info, RefreshCw,
} from "lucide-react";
import { PLANS, PlanTier } from "@/lib/plans";

export default function BillingPage() {
  const { user } = useUser();
  const [currentPlan, setCurrentPlan] = useState<PlanTier>("free");
  const [usage, setUsage] = useState(0);
  const [limit, setLimit] = useState<number | "unlimited">(5);
  const [minuteUsage, setMinuteUsage] = useState(0);
  const [minuteLimit, setMinuteLimit] = useState<number | "unlimited">(300);
  const [teamMemberCount, setTeamMemberCount] = useState(1);
  const [teamMemberLimit, setTeamMemberLimit] = useState<number | "unlimited">(1);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [paddleSubscriptionId, setPaddleSubscriptionId] = useState<string | null>(null);
  const [cancellationEffectiveDate, setCancellationEffectiveDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetch(`/api/billing?userId=${user.id}`)
      .then(r => r.json())
      .then(d => {
        const plan: PlanTier = d.plan || "free";
        setCurrentPlan(plan);
        setUsage(d.usage || 0);
        setLimit(d.limit || 5);
        setMinuteUsage(d.minuteUsage || 0);
        setMinuteLimit(d.minuteLimit || 300);
        setTeamMemberCount(d.teamMemberCount || 1);
        setTeamMemberLimit(d.teamMemberLimit || 1);
        setSubscriptionStatus(d.subscriptionStatus || null);
        setPaddleSubscriptionId(d.paddleSubscriptionId || null);
        setCancellationEffectiveDate(d.cancellationEffectiveDate || null);
      })
      .catch((err) => console.error("Failed to fetch billing data:", err))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleCancel = useCallback(async () => {
    if (!user?.id || cancelling) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Subscription cancelled.");
        setCurrentPlan("free");
        setSubscriptionStatus("cancelled");
        setLimit(5);
        setMinuteLimit(300);
        setTeamMemberLimit(1);
        setShowCancelConfirm(false);
      } else {
        toast.error(data.error || "Cancellation failed");
      }
    } catch {
      toast.error("Cancellation failed");
    } finally {
      setCancelling(false);
    }
  }, [user?.id, cancelling]);

  const handleSync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/billing/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.synced) {
        toast.success(`Subscription synced: ${data.plan} plan active.`);
        window.location.reload();
      } else if (res.ok) {
        toast.info(data.message || "No active subscription found.");
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  const availablePlans: PlanTier[] = ["free", "pro", "business"];

  return (
    <main className="min-h-screen bg-linear-black text-white">
      <Nav />
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-medium tracking-tight">Billing & Plan</h1>
            <p className="text-white/40 text-sm mt-1">
              Current plan: <span className="text-linear-indigo font-medium">{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</span>
              {limit !== "unlimited" && (
                <span className="text-white/30"> &middot; {usage}/{limit} uploads this month</span>
              )}
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-white/10 text-white hover:bg-white/20 border border-white/10 transition disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Refresh subscription
          </button>
        </div>

        {limit !== "unlimited" && (
          <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="flex justify-between text-xs text-white/40 mb-2">
              <span>Monthly uploads</span>
              <span>{usage} / {limit}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-linear-indigo transition-all" style={{ width: `${Math.min((usage / (limit as number)) * 100, 100)}%` }} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availablePlans.map((tier) => {
            const plan = PLANS[tier];
            const isCurrent = currentPlan === tier;
            return (
              <div key={tier} className={`p-6 rounded-2xl bg-linear-surface border border-linear-secondary flex flex-col ${
                isCurrent ? 'ring-1 ring-linear-indigo/50' : ''
              }`}>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    {tier === "business" ? (
                      <Crown className="w-4 h-4 text-yellow-400" />
                    ) : tier === "pro" ? (
                      <Sparkles className="w-4 h-4 text-linear-indigo" />
                    ) : null}
                    <h3 className="text-lg font-medium">{plan.name}</h3>
                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-linear-indigo/20 text-linear-indigo rounded-full text-[9px] font-bold uppercase tracking-wider">Active</span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-semibold">
                      {plan.price === 0 ? "Free" : plan.priceLabel}
                    </span>
                    {plan.price > 0 && <span className="text-sm text-white/40">/mo</span>}
                  </div>
                  {plan.uploadLimit !== "unlimited" ? (
                    <p className="text-xs text-white/40 mt-1">{plan.uploadLimit} uploads/mo</p>
                  ) : (
                    <p className="text-xs text-green-400/60 mt-1">Unlimited uploads</p>
                  )}
                </div>

                <div className="flex-1 space-y-2.5 mb-8">
                  {[
                    "Upload & transcribe",
                    "AI summaries & action items",
                    tier !== "free" ? "Browser recording" : null,
                    tier === "pro" || tier === "business" ? "CRM sync (HubSpot, Salesforce)" : null,
                    tier === "business" ? "Slack integration" : null,
                    tier === "pro" || tier === "business" ? "AI Chat" : null,
                    tier !== "free" ? "Analytics dashboard" : null,
                    tier === "business" ? "Team workspace" : null,
                    tier === "business" ? "API & Webhooks" : null,
                    "Priority support",
                  ].filter(Boolean).map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                      <CheckCircle className="w-3.5 h-3.5 text-linear-indigo shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <div className="w-full text-center py-3 rounded-full text-xs font-semibold bg-white/5 text-white/40 border border-white/5">
                    Current Plan
                  </div>
                ) : plan.price === 0 ? (
                  <button onClick={async () => {
                    if (!user?.id || currentPlan === "free") return;
                    await fetch("/api/billing", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ userId: user.id, plan: "free" }),
                    });
                    window.location.reload();
                  }}
                    disabled={currentPlan === "free"}
                    className="w-full text-center py-3 rounded-full text-xs font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/10 transition disabled:opacity-50">
                    Downgrade
                  </button>
                ) : (
                  <Link
                    href="/pricing"
                    className="block w-full text-center py-3 rounded-full text-xs font-semibold bg-linear-indigo text-white hover:bg-linear-indigo/80 transition"
                  >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : `Upgrade - ${plan.priceLabel}/mo`}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {subscriptionStatus === "cancelled" && (
          <div className="mt-6 p-6 rounded-2xl bg-linear-surface border border-amber-500/20">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-amber-400 mb-1">Subscription Cancelled</h3>
                <p className="text-xs text-white/40">
                  You have access until{" "}
                  {cancellationEffectiveDate
                    ? new Date(cancellationEffectiveDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "the end of your billing period"}
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        {currentPlan !== "free" && subscriptionStatus === "active" && (
          <div className="mt-6 p-6 rounded-2xl bg-linear-surface border border-linear-secondary">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-linear-indigo shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium mb-1">Auto-Renewal</h3>
                  <p className="text-xs text-white/40">
                    Your <strong>{PLANS[currentPlan].name}</strong> plan renews
                    automatically at <strong>{PLANS[currentPlan].priceLabel}/month</strong>.
                    You will be billed on the same date each month.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-green-500/20 text-green-400 shrink-0 ml-4">
                Active
              </span>
            </div>
          </div>
        )}

        {currentPlan !== "free" && (
          <div className="mt-6 p-6 rounded-2xl bg-linear-surface border border-linear-secondary">
            <h3 className="text-sm font-medium mb-4">Monthly Usage</h3>
            <div className="space-y-4">
              <UsageDisplay
                used={usage}
                limit={limit}
                label="Uploads"
                unit="uploads"
              />
              <UsageDisplay
                used={minuteUsage}
                limit={minuteLimit}
                label="Call Minutes"
                unit="min"
              />
              <UsageDisplay
                used={teamMemberCount}
                limit={teamMemberLimit}
                label="Team Members"
                unit="members"
              />
            </div>
          </div>
        )}

        {currentPlan !== "free" && subscriptionStatus === "active" && (
          <div className="mt-6 p-6 rounded-2xl bg-linear-surface border border-red-500/20">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-400 mb-1">Cancel Subscription</h3>
                <p className="text-xs text-white/40">
                  Your <strong>{PLANS[currentPlan].name}</strong> plan will be
                  cancelled. You will retain access until the end of your billing
                  period. This action cannot be undone.
                </p>
              </div>
            </div>
            {showCancelConfirm ? (
              <div className="flex items-center gap-3 ml-8">
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                >
                  {cancelling ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Confirm Cancellation"
                  )}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition"
                >
                  Keep Plan
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="ml-8 px-4 py-2 rounded-full text-xs font-semibold bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 transition"
              >
                <Ban className="w-3 h-3 inline mr-1" />
                Cancel Plan
              </button>
            )}
          </div>
        )}

        <div className="mt-6 p-6 rounded-2xl bg-linear-surface border border-linear-secondary flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-yellow-400" />
              <h3 className="text-base font-medium">Enterprise</h3>
            </div>
            <p className="text-xs text-white/40">SSO / SAML, HIPAA compliance, dedicated account manager, and custom terms.</p>
          </div>
          <a href="mailto:sales@usegauge.com?subject=Enterprise%20Plan%20Inquiry"
            className="px-6 py-2.5 rounded-full text-xs font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-all duration-500 shrink-0">
            Contact Sales
          </a>
        </div>

        <div className="mt-8 p-6 rounded-2xl bg-linear-surface border border-linear-secondary">
          <h2 className="text-sm font-medium mb-4">Plan Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 pr-4 text-white/40">Feature</th>
                  {availablePlans.map(t => <th key={t} className="text-center py-2 px-3 text-white/40">{PLANS[t].name}</th>)}
                  <th className="text-center py-2 px-3 text-white/20">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Uploads/mo", "5", "Unlimited", "Unlimited", "Custom"],
                  ["Minutes/mo", "300", "1,200", "6,000", "Unlimited"],
                  ["Call duration", "30 min", "90 min", "4 hrs", "Custom"],
                  ["Team members", "1", "Up to 5", "Unlimited", "Unlimited"],
                  ["AI Chat", "—", "✓", "✓", "✓"],
                  ["CRM Sync", "—", "✓", "✓", "✓"],
                  ["Slack", "—", "✓", "✓", "✓"],
                  ["API Access", "—", "✓", "✓", "✓"],
                  ["SSO / SAML", "—", "—", "—", "✓"],
                  ["HIPAA", "—", "—", "—", "✓"],
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 pr-4 text-white/60">{row[0]}</td>
                    {row.slice(1, 4).map((cell, j) => (
                      <td key={j} className={`text-center py-2 px-3 ${cell === "✓" ? "text-green-400" : cell === "—" ? "text-white/20" : "text-white/60"}`}>
                        {cell}
                      </td>
                    ))}
                    <td className="text-center py-2 px-3 text-white/30">{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
