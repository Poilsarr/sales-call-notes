"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { initializePaddle } from "@paddle/paddle-js";
import { Zap, Crown, Sparkles, X, Loader2, CheckCircle } from "lucide-react";
import type { FeatureId, PlanTier } from "@/lib/plans";
import {
  priceIdForCycle,
  tierForFeature,
  tierHasFeature,
  planCoversFeature,
  UPGRADE_PLAN_META,
  type BillingCycle,
  type UpgradePlanTier,
  type UpgradePriceIds,
} from "@/lib/pricing-tiers";

interface UpgradePromptProps {
  feature: FeatureId;
  featureName: string;
  onClose?: () => void;
  minimal?: boolean;
  /** ponytail: SSR-resolved plan from server component, avoids the ~100ms flash where the banner shows before the client-side /api/billing fetch lands. Used by parent to pass user.plan straight from DB. */
  serverPlan?: PlanTier;
  /**
   * Real Paddle price IDs resolved server-side. This client component must
   * NEVER read process.env.PADDLE_* (undefined in the browser bundle) or
   * import lib/plans.ts (its requirePriceId() falls back to placeholder IDs
   * like `pri_pro_monthly` that don't exist in Paddle). Server-component
   * consumers inject the real IDs here; when absent, the component resolves
   * them from the server (GET /api/billing/debug → mappedPriceIds) at
   * checkout time so a placeholder ID can never reach Paddle.
   */
  priceIds?: UpgradePriceIds;
}

export default function UpgradePrompt({ feature, featureName, onClose, minimal, serverPlan, priceIds }: UpgradePromptProps) {
  const { user } = useUser();
  // ponytail: prefer serverPlan (no flash) over the client-fetched plan when available.
  const [currentPlan, setCurrentPlan] = useState<PlanTier>(serverPlan ?? "free");
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paddle, setPaddle] = useState<any>(null);
  const [paddleError, setPaddleError] = useState(false);
  const isProcessing = useRef(false);
  const serverPriceIds = useRef<UpgradePriceIds | null>(null);

  useEffect(() => {
    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_KEY || "";
    initializePaddle({
      environment: clientToken.startsWith("live_") ? "production" : "sandbox",
      token: clientToken,
    }).then(paddleInstance => {
      if (paddleInstance) setPaddle(paddleInstance);
    }).catch(err => {
      console.error("Paddle initialization failed:", err);
      setPaddleError(true);
    });

    if (user?.id) {
      fetch(`/api/billing?userId=${user.id}`)
        .then(r => r.json())
        .then(d => setCurrentPlan(d.plan || "free"))
        .catch(() => {});
    }
  }, [user?.id]);

  // ponytail: real Paddle price IDs are server-only env vars — undefined in
  // the browser bundle, and lib/plans.ts falls back to placeholder IDs that
  // don't exist in Paddle. Resolve the real IDs from the server instead,
  // preferring a server-injected priceIds prop (for server-component
  // consumers) and falling back to a lazy, cached fetch of
  // /api/billing/debug's mappedPriceIds at checkout time.
  const resolvePriceId = useCallback(
    async (tier: UpgradePlanTier, cycle: BillingCycle): Promise<string | null> => {
      if (priceIds) return priceIdForCycle(priceIds, tier, cycle);
      if (!serverPriceIds.current) {
        try {
          const res = await fetch("/api/billing/debug", { cache: "no-store" });
          if (!res.ok) return null;
          const data = await res.json();
          const mapped = data?.mappedPriceIds;
          if (
            mapped &&
            mapped.pro?.length === 2 &&
            mapped.business?.length === 2
          ) {
            serverPriceIds.current = {
              proMonth: mapped.pro[0],
              proYear: mapped.pro[1],
              businessMonth: mapped.business[0],
              businessYear: mapped.business[1],
            };
          } else {
            return null;
          }
        } catch {
          return null;
        }
      }
      return priceIdForCycle(serverPriceIds.current, tier, cycle);
    },
    [priceIds]
  );

  const openCheckout = useCallback(async (targetPlan: UpgradePlanTier) => {
    if (!paddle || paddleError || !user?.id || isProcessing.current) return;

    isProcessing.current = true;
    setUpgrading(targetPlan);

    // Month/year per billing cycle — mirrors pricing-client's priceIdForCycle.
    const priceId = await resolvePriceId(targetPlan, "monthly");
    if (!priceId) {
      isProcessing.current = false;
      setUpgrading(null);
      setPaddleError(true);
      return;
    }
    
    const redirectToWelcome = () => {
      isProcessing.current = false;
      window.location.href = "/welcome";
    };
    
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customData: { userId: user.id, clerkUserId: user.id, feature },
      settings: {
        displayMode: "overlay",
        theme: "dark",
        successUrl: `${window.location.origin}/welcome`,
      },
      onSuccess: redirectToWelcome,
      onCheckoutCompleted: redirectToWelcome,
      onClose: () => {
        isProcessing.current = false;
        setUpgrading(null);
      },
    });
  }, [paddle, user?.id, feature, paddleError, resolvePriceId]);

  const neededPlan = tierForFeature(feature);

  // ponytail: if the user's current plan already includes this feature, render nothing — the prompt is a "this needs plan X" banner, not a "you're amazing" widget. Skipping the render keeps paid users out of the funnel.
  if (currentPlan && planCoversFeature(currentPlan, feature)) {
    return null;
  }

  if (success) {
    return (
      <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
        <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-green-400">Upgraded successfully!</p>
      </div>
    );
  }

  if (minimal) {
    // Minimal mode is used as a "feature requires plan X" banner.
    // The Paddle Checkout button was previously disabled with the
    // text "Unavailable" when paddleError was true (e.g. the
    // NEXT_PUBLIC_PADDLE_CLIENT_KEY env var is missing or
    // Paddle failed to init in the user's region). That was a
    // dead-end — user couldn't upgrade. Fix: when Paddle is
    // unavailable, swap the button to a /pricing link so the
    // user can still reach the upgrade page.
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
        <Crown className="w-4 h-4 text-yellow-400 shrink-0" />
        <p className="text-xs text-yellow-400/80 flex-1">
          {featureName} requires {neededPlan.charAt(0).toUpperCase() + neededPlan.slice(1)} plan
        </p>
        {paddleError ? (
          <Link
            href="/pricing"
            className="px-3 py-1 bg-yellow-500 text-black rounded-full text-[10px] font-bold hover:bg-yellow-400 transition"
          >
            See pricing
          </Link>
        ) : (
          <button
            onClick={() => openCheckout(neededPlan)}
            disabled={upgrading !== null}
            className="px-3 py-1 bg-yellow-500 text-black rounded-full text-[10px] font-bold hover:bg-yellow-400 transition disabled:opacity-50"
          >
            {upgrading ? <Loader2 className="w-3 h-3 animate-spin" /> : `Upgrade - $${UPGRADE_PLAN_META[neededPlan].priceCents / 100}/mo`}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900 border border-zinc-800 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-white/5 rounded-lg transition">
          <X className="w-4 h-4 text-white/40" />
        </button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-indigo-400" />
          </div>
          <h3 className="text-xl font-medium mb-2">Upgrade to access {featureName}</h3>
          <p className="text-sm text-white/50">
            This feature requires the {neededPlan.charAt(0).toUpperCase() + neededPlan.slice(1)} plan or higher.
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {(["pro", "business"] as UpgradePlanTier[]).map(tier => {
            const plan = UPGRADE_PLAN_META[tier];
            const hasFeature = tierHasFeature(tier, feature);
            return (
              <div key={tier}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  tier === neededPlan || currentPlan === "free"
                    ? "border-linear-indigo/30 bg-linear-indigo/5"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                } ${hasFeature ? "opacity-100" : "opacity-40"}`}
                onClick={() => hasFeature && openCheckout(tier)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown className={`w-4 h-4 ${tier === "business" ? "text-yellow-400" : "text-linear-indigo"}`} />
                    <span className="font-medium text-sm">{plan.name}</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {plan.priceLabel}<span className="text-[10px] text-white/40 font-normal">/mo</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-white/40">
                  {hasFeature ? <CheckCircle className="w-3 h-3 text-green-400" /> : <X className="w-3 h-3 text-red-400/50" />}
                  <span>{hasFeature ? `Includes ${featureName}` : "Not included"}</span>
                </div>
                {hasFeature && (
                  paddleError ? (
                    <Link
                      href="/pricing"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 block w-full text-center py-2 rounded-full bg-linear-indigo text-white text-xs font-semibold hover:bg-linear-indigo/80 transition"
                    >
                      See pricing
                    </Link>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); openCheckout(tier); }}
                      disabled={upgrading === tier}
                      className="mt-3 w-full py-2 rounded-full bg-linear-indigo text-white text-xs font-semibold hover:bg-linear-indigo/80 transition disabled:opacity-50">
                      {upgrading === tier ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : `Choose ${plan.name}`}
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>

        {paddleError ? (
          <div className="text-center mb-4">
            <p className="text-xs text-red-400/70 mb-2">Payment system unavailable right now.</p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-xs text-linear-indigo hover:text-white transition"
            >
              View pricing plans →
            </Link>
          </div>
        ) : (
          <p className="text-[11px] text-white/30 text-center">
            Powered by Paddle. Secure payment processing.
          </p>
        )}
      </div>
    </div>
  );
}
