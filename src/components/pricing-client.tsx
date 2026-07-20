"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { TIERS } from "@/lib/pricing-tiers";
import SiteFooter from "@/components/site-footer";

type BillingCycle = "monthly" | "annual";

/**
 * Server-side detected country code (from x-vercel-ip-country), or null.
 * If null, we do NOT pass a country to Paddle — PricePreview auto-detects
 * from the visitor's IP. We never forward an "unknown" sentinel.
 */
function BillingToggle({
  cycle,
  onChange,
}: {
  cycle: BillingCycle;
  onChange: (c: BillingCycle) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white border border-gray-200 mt-8">
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-all ${
          cycle === "monthly"
            ? "bg-[#0a0a0b] text-white"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("annual")}
        className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-all flex items-center gap-1.5 ${
          cycle === "annual"
            ? "bg-[#0a0a0b] text-white"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        Annual
        <span
          className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
            cycle === "annual" ? "bg-[#F26522] text-white" : "bg-[#F26522]/10 text-[#F26522]"
          }`}
        >
          Save 17%
        </span>
      </button>
    </div>
  );
}

export default function PricingClient({
  initialCountry,
}: {
  initialCountry: string | null;
}) {
  const { user, isSignedIn, isLoaded: clerkLoaded } = useUser();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [paddleReady, setPaddleReady] = useState(false);
  const [paddleError, setPaddleError] = useState(false);

  // Map tier name -> formatted total string from Paddle PricePreview.
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [pricesLoading, setPricesLoading] = useState(true);

  const environment = process.env.PADDLE_ENV;
  if (!environment || (environment !== "sandbox" && environment !== "production")) {
    throw new Error(
      `PADDLE_ENV must be "sandbox" or "production" (got "${environment ?? "undefined"}"). ` +
        `Refusing to start Paddle against an unknown environment.`
    );
  }
  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_KEY;
  if (!clientToken) {
    throw new Error(
      "NEXT_PUBLIC_PADDLE_CLIENT_KEY is not set. Refusing to start Paddle checkout."
    );
  }

  const priceIdForCycle = useCallback(
    (tier: (typeof TIERS)[number]) =>
      cycle === "annual" ? tier.priceId.year : tier.priceId.month,
    [cycle]
  );

  // Initialize Paddle once.
  useEffect(() => {
    let cancelled = false;
    initializePaddle({
      environment: environment as "sandbox" | "production",
      token: clientToken,
      // Prefill the customer's email if they're signed in.
      ...(user?.primaryEmailAddress?.emailAddress
        ? { pwCustomer: { email: user.primaryEmailAddress.emailAddress } }
        : {}),
    })
      .then((instance) => {
        if (cancelled) return;
        if (instance) {
          setPaddle(instance);
          setPaddleReady(true);
        } else {
          setPaddleError(true);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Paddle initialization failed:", err);
        setPaddleError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [environment, clientToken, user?.primaryEmailAddress?.emailAddress]);

  // Fetch localized prices whenever cycle (or country) changes.
  useEffect(() => {
    if (!paddleReady || !paddle) return;
    let cancelled = false;
    setPricesLoading(true);

    const items = TIERS.map((tier) => ({
      priceId: priceIdForCycle(tier),
      quantity: 1,
    }));

    paddle
      .PricePreview({
        items,
        // Only pass a country if the server actually detected one.
        ...(initialCountry ? { address: { countryCode: initialCountry } } : {}),
      })
      .then((res) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        res.data.details.lineItems.forEach((lineItem, i) => {
          const tier = TIERS[i];
          if (tier) {
            map[tier.name] = lineItem.formattedTotals.total;
          }
        });
        setPrices(map);
        setPricesLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Paddle PricePreview failed:", err);
        setPricesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [paddle, paddleReady, cycle, initialCountry, priceIdForCycle]);

  const openCheckout = useCallback(
    (tier: (typeof TIERS)[number]) => {
      if (!paddle || !paddleReady) return;
      if (!isSignedIn) {
        window.location.href = `/sign-up?redirect=/pricing`;
        return;
      }
      paddle.Checkout.open({
        items: [{ priceId: priceIdForCycle(tier), quantity: 1 }],
        ...(user?.primaryEmailAddress?.emailAddress
          ? { customer: { email: user.primaryEmailAddress.emailAddress } }
          : {}),
        customData: {
          clerkUserId: user?.id,
        },
        settings: {
          displayMode: "overlay",
          variant: "one-page",
          theme: "light",
          successUrl: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/welcome`,
        },
      });
    },
    [paddle, paddleReady, isSignedIn, user, priceIdForCycle]
  );

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="pt-36 pb-8 sm:pt-40 sm:pb-12 px-5 sm:px-8 lg:px-12 bg-[#EFEFEF] overflow-hidden">
        <div className="max-w-[1440px] mx-auto text-center">
          <div className="eyebrow inline-flex items-center gap-2 mb-6">
            <CheckCircle size={12} /> Simple, transparent pricing
          </div>
          <h1 className="text-[clamp(2rem,5vw,4.5rem)] font-medium leading-[1.08] tracking-[-0.03em] mb-4">
            Free for SDRs.
            <br />
            <span className="text-gray-400">Scale when you need to.</span>
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-[14px]">
            No hidden fees. No AI credit traps. Prices shown in your local currency. Start
            free, upgrade only when your team grows.
          </p>

          <BillingToggle cycle={cycle} onChange={setCycle} />
        </div>
      </section>

      {/* Plans */}
      <section className="pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-28 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto mb-6 flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F26522]/10 text-[#F26522] text-[11px] font-semibold">
            <CheckCircle size={11} /> Flat-rate pricing
          </span>
          <span className="text-[12px] text-gray-500">
            5 reps on Fireflies = <strong className="text-gray-700">$50/mo</strong>. 5 reps on us =
            your local price. No per-seat games.
          </span>
        </div>

        <div className="max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TIERS.map((tier) => {
            const isPopular = tier.name === "Pro";
            const price = prices[tier.name];
            const showPrice =
              !!price && !pricesLoading && !paddleError;
            const periodLabel =
              cycle === "annual" ? "/month, billed annually" : "/month";
            return (
              <div
                key={tier.name}
                className={`doppel-outer h-full flex flex-col ${
                  isPopular ? "ring-[#F26522]/30 ring-2" : ""
                }`}
              >
                <div
                  className={`doppel-inner p-6 sm:p-8 h-full flex flex-col relative ${
                    isPopular ? "bg-[#F26522]/[0.02]" : ""
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#F26522] text-[10px] font-bold uppercase tracking-[0.15em] text-white whitespace-nowrap">
                      Most popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-[16px] font-semibold tracking-tight mb-1">{tier.name}</h3>
                    <div className="flex items-baseline gap-2 flex-wrap min-h-[2rem]">
                      {pricesLoading ? (
                        <Loader2 size={18} className="animate-spin text-gray-400" />
                      ) : showPrice ? (
                        <>
                          <span className="text-[clamp(1.5rem,3vw,2.5rem)] font-semibold tracking-tight">
                            {price}
                          </span>
                          <span className="text-[12px] text-gray-400">{periodLabel}</span>
                        </>
                      ) : paddleError ? (
                        <span className="text-[14px] text-gray-400">
                          Pricing unavailable
                        </span>
                      ) : (
                        <span className="text-[14px] text-gray-400">—</span>
                      )}
                    </div>
                    <p className="text-[12px] text-gray-500 mt-2">{tier.description}</p>
                  </div>
                  <div className="flex-1 space-y-2.5 mb-8">
                    {tier.features.map((f, j) => (
                      <div key={j} className="flex items-start gap-2 text-[12px] text-gray-600">
                        <CheckCircle size={14} className="text-[#F26522] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => openCheckout(tier)}
                    disabled={!paddleReady || !!paddleError || pricesLoading}
                    className={`block w-full text-center py-3 rounded-full text-[12px] font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isPopular
                        ? "bg-[#F26522] text-white hover:bg-[#e05a1a] border border-transparent"
                        : "bg-white text-gray-900 border border-gray-300 hover:border-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {!clerkLoaded ? (
                      <Loader2 size={14} className="animate-spin mx-auto" />
                    ) : isSignedIn ? (
                      paddleReady ? "Subscribe" : "Loading…"
                    ) : (
                      "Start free"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-8">
          All paid plans are <strong className="text-gray-600">flat-rate</strong> — no per-seat
          math. Prices shown in your local currency and include applicable tax.
        </p>
      </section>

      {/* CTA */}
      <section className="pb-16 sm:pb-20 lg:pb-28 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="doppel-outer group">
            <div className="doppel-inner p-10 sm:p-14 lg:p-20 text-center relative overflow-hidden">
              <div className="relative z-10">
                <div className="eyebrow inline-flex items-center gap-2 mb-5">
                  <ArrowRight size={12} /> Start today
                </div>
                <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.12] tracking-[-0.02em] mb-3">
                  Ready to save hours every week?
                </h2>
                <p className="text-gray-500 mb-8 text-[14px]">
                  Join SDRs who cut their note-taking time by 80%.
                </p>
                <a
                  href="/sign-up"
                  className="group inline-flex items-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white text-[13px] rounded-full pl-5 pr-2 py-2 transition-colors duration-300"
                >
                  <span className="flex flex-col overflow-hidden h-[20px]">
                    <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">
                      Start free
                    </span>
                    <span className="leading-[20px]">Start free</span>
                  </span>
                  <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
                    <ArrowRight size={14} className="text-[#F26522]" />
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
