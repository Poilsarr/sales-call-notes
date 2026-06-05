"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { initializePaddle } from "@paddle/paddle-js";
import Nav from "@/components/nav";
import { Crown, CheckCircle, Sparkles, Loader2 } from "lucide-react";
import { PLANS, PlanTier } from "@/lib/plans";

export default function BillingPage() {
  const { user } = useUser();
  const [currentPlan, setCurrentPlan] = useState<PlanTier>("free");
  const [usage, setUsage] = useState(0);
  const [limit, setLimit] = useState<number | "unlimited">(5);
  const [paddle, setPaddle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  useEffect(() => {
    initializePaddle({
      environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "",
    }).then(paddleInstance => {
      if (paddleInstance) {
        setPaddle(paddleInstance);
      }
      setLoading(false);
    });

    if (user?.id) {
      fetch(`/api/billing?userId=${user.id}`)
        .then(r => r.json())
        .then(d => {
          setCurrentPlan(d.plan || "free");
          setUsage(d.usage || 0);
          setLimit(d.limit || 5);
        })
        .catch((err) => console.error("Failed to fetch billing data:", err));
    }
  }, [user?.id]);

  const openCheckout = useCallback((plan: PlanTier) => {
    if (!paddle || !user?.id || upgradeSuccess) return;
    const priceId = PLANS[plan].paddlePriceId;
    if (!priceId) return;

    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customData: { userId: user.id },
      settings: {
        displayMode: "overlay",
        theme: "dark",
        showAddDiscounts: true,
      },
      onSuccess: () => {
        setUpgradeSuccess(true);
        setTimeout(() => window.location.reload(), 1500);
      },
      onClose: () => {
        fetch(`/api/billing?userId=${user.id}`)
          .then(r => r.json())
          .then(d => {
            if (d.plan !== "free") {
              setCurrentPlan(d.plan);
              setLimit(d.limit || 5);
            }
          })
          .catch((err) => console.error("Failed to refresh billing data:", err));
      },
    });
  }, [paddle, user?.id, upgradeSuccess]);

  if (upgradeSuccess) {
    return (
      <main className="min-h-screen bg-linear-black text-white flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <p className="text-lg font-medium">Upgrade successful! Refreshing...</p>
        </div>
      </main>
    );
  }

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
                  <button onClick={() => openCheckout(tier)}
                    disabled={loading || !paddle}
                    className="w-full text-center py-3 rounded-full text-xs font-semibold bg-linear-indigo text-white hover:bg-linear-indigo/80 transition disabled:opacity-50">
                    {loading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : `Upgrade - ${plan.priceLabel}/mo`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-6 rounded-2xl bg-linear-surface border border-linear-secondary flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-yellow-400" />
              <h3 className="text-base font-medium">Enterprise</h3>
            </div>
            <p className="text-xs text-white/40">SSO / SAML, HIPAA compliance, dedicated account manager, and custom terms.</p>
          </div>
          <a href="mailto:sales@callnotepro.com?subject=Enterprise%20Plan%20Inquiry"
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
