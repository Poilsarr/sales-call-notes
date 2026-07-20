"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { CheckCircle, Loader2, ArrowRight, Zap, Plus, Minus } from "lucide-react";
import type { Tier } from "@/lib/pricing-tiers";

type BillingCycle = "monthly" | "annual";

const COMPARISON = [
  ["Free tier minutes", "300/mo", "300/mo", "800/mo"],
  ["Pro price", "$9/mo or $7.50/mo annual", "$8.33/mo annual", "$10/mo annual"],
  ["Business price", "$29/mo or $24/mo annual", "$19.99/mo", "$19/mo"],
  ["AI credits system", "No credits", "Limits on free", "Yes (20-50 pool)"],
  ["Local AI processing", "Yes", "No", "No"],
  ["Speaker diarization", "Yes", "Yes", "Yes"],
  ["CRM sync", "HubSpot, Salesforce", "Enterprise only", "HubSpot, Salesforce"],
  ["Microsoft Teams", "Yes", "Yes", "Yes"],
  ["SSO / SAML", "Enterprise", "Enterprise", "Enterprise"],
  ["API access", "Business+", "Enterprise", "Business+"],
];

const FAQ = [
  {
    q: "Do I need a credit card to start?",
    a: "No. The Free tier is genuinely free forever — 300 transcription minutes per month, no card required. We only ask for payment details when you upgrade to Pro.",
  },
  {
    q: "What counts as a 'transcription minute'?",
    a: "One minute of uploaded or recorded audio. Re-uploading the same file doesn't double-charge. Speaker labels and action-item extraction are free and don't count against the minute pool.",
  },
  {
    q: "What happens if I exceed my plan's minutes?",
    a: "We never silently auto-charge you. You'll get a banner at 80% usage and an email at 100%. Uploads pause until you upgrade or your monthly cycle resets. No surprise overage fees.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes, in either direction. Upgrade takes effect immediately and we prorate. Downgrade takes effect at the end of your current billing cycle.",
  },
  {
    q: "Is my call audio used to train AI models?",
    a: "No. Your audio, transcripts, and summaries are never used to train third-party models. We use hosted inference (Groq + OpenAI) with zero-retention data policies. See our security page for the full data-handling doc.",
  },
  {
    q: "Do you offer a discount for annual billing?",
    a: "Yes — Pro is $7.50/mo billed annually (vs $9/mo monthly) and Business is $24/mo annually (vs $29/mo monthly). That's a 17% discount on both paid tiers.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-5 text-left gap-4"
      >
        <span className="text-[14px] font-medium text-gray-900">{q}</span>
        <span className="shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
          {open ? <Minus size={12} /> : <Plus size={12} />}
        </span>
      </button>
      {open && (
        <p className="pb-5 text-[13px] text-gray-600 leading-relaxed max-w-3xl">{a}</p>
      )}
    </div>
  );
}

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
  tiers,
}: {
  initialCountry: string | null;
  tiers: Tier[];
}) {
  const { user, isSignedIn, isLoaded: clerkLoaded } = useUser();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [paddleReady, setPaddleReady] = useState(false);
  const [paddleError, setPaddleError] = useState(false);

  // Map tier name -> formatted total string from Paddle PricePreview.
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [pricesLoading, setPricesLoading] = useState(true);

  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_KEY;
  if (!clientToken) {
    throw new Error(
      "NEXT_PUBLIC_PADDLE_CLIENT_KEY is not set. Refusing to start Paddle checkout."
    );
  }
  // Derive the environment from the public client token prefix — `test_`
  // means sandbox, `live_` means production. This is client-safe (the token
  // is already exposed to the browser) and avoids depending on the
  // server-only PADDLE_ENV var, which is undefined in the browser bundle.
  const environment: "sandbox" | "production" = clientToken.startsWith("live_")
    ? "production"
    : "sandbox";

  const priceIdForCycle = useCallback(
    (tier: Tier) =>
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

    const items = tiers.map((tier) => ({
      priceId: priceIdForCycle(tier),
      quantity: 1,
    }));
    // Map each requested priceId back to its tier name (robust against
    // Paddle returning lineItems in a different order).
    const priceIdToTier: Record<string, string> = {};
    tiers.forEach((tier) => {
      priceIdToTier[priceIdForCycle(tier)] = tier.name;
    });

    paddle
      .PricePreview({
        items,
        // Only pass a country if the server actually detected one.
        ...(initialCountry ? { address: { countryCode: initialCountry } } : {}),
      })
      .then((res) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        res.data.details.lineItems.forEach((lineItem) => {
          const tierName = priceIdToTier[lineItem.price.id];
          if (tierName) {
            map[tierName] = lineItem.formattedTotals.total;
          }
        });
        setPrices(map);
        setPricesLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Paddle PricePreview failed:", err);
        setPaddleError(true);
        setPricesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [paddle, paddleReady, cycle, initialCountry, priceIdForCycle]);

  const openCheckout = useCallback(
    (tier: Tier) => {
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

        <div className="max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((tier) => {
            const isPopular = tier.name === "Pro";
            const isPaddle = tier.ctaKind === "checkout";
            const price = prices[tier.name];
            const showPrice = isPaddle && !!price && !pricesLoading && !paddleError;
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
                      {isPaddle && pricesLoading ? (
                        <Loader2 size={18} className="animate-spin text-gray-400" />
                      ) : showPrice ? (
                        <>
                          <span className="text-[clamp(1.5rem,3vw,2.5rem)] font-semibold tracking-tight">
                            {price}
                          </span>
                          <span className="text-[12px] text-gray-400">{periodLabel}</span>
                        </>
                      ) : paddleError && isPaddle ? (
                        <span className="text-[14px] text-gray-400">
                          Pricing unavailable
                        </span>
                      ) : isPaddle ? (
                        <span className="text-[14px] text-gray-400">—</span>
                      ) : (
                        <span className="text-[14px] text-gray-400">
                          {tier.name === "Free" ? "Free forever" : "Custom"}
                        </span>
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
                  {tier.ctaKind === "signup" ? (
                    <a
                      href={isSignedIn ? "/app" : "/sign-up"}
                      className="block w-full text-center py-3 rounded-full text-[12px] font-semibold transition-all duration-300 bg-white text-gray-900 border border-gray-300 hover:border-gray-900 hover:bg-gray-50"
                    >
                      {tier.cta}
                    </a>
                  ) : tier.ctaKind === "contact" ? (
                    <a
                      href="mailto:sales@usegauge.com?subject=Enterprise%20Plan%20Inquiry"
                      className="block w-full text-center py-3 rounded-full text-[12px] font-semibold transition-all duration-300 bg-white text-gray-900 border border-gray-300 hover:border-gray-900 hover:bg-gray-50"
                    >
                      {tier.cta}
                    </a>
                  ) : (
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
                        paddleReady ? tier.cta : "Loading…"
                      ) : (
                        "Start free"
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-8">
          All paid plans are <strong className="text-gray-600">flat-rate</strong> — no per-seat
          math. Prices shown in your local currency and include applicable tax.
        </p>
        {paddleError && (
          <p className="text-center text-[12px] text-red-500 mt-3">
            Live prices are temporarily unavailable. Please refresh or try again shortly.
          </p>
        )}
      </section>

      {/* Comparison Table */}
      <section className="pb-12 sm:pb-16 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="doppel-outer">
            <div className="doppel-inner p-6 sm:p-8">
              <h3 className="text-[15px] font-semibold tracking-tight mb-6 text-center">
                Compare to competitors
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 pr-4 text-gray-500 font-medium">Feature</th>
                      <th className="text-center py-3 px-4 text-white font-semibold bg-[#F26522]/[0.06] rounded-t-lg">
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Gauge</span>
                          <span className="w-1 h-1 rounded-full bg-[#F26522]" />
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 text-gray-500 font-medium">Otter.ai</th>
                      <th className="text-center py-3 px-4 text-gray-500 font-medium">
                        Fireflies.ai
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0">
                        <td className="py-3 pr-4 text-gray-600">{row[0]}</td>
                        <td className="text-center py-3 px-4 bg-[#F26522]/[0.04] text-gray-900">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-[#F26522] shrink-0" />
                            <span className="font-medium">{row[1]}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4 text-gray-500">{row[2]}</td>
                        <td className="text-center py-3 px-4 text-gray-500">{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10.5px] text-gray-400 mt-4 text-center max-w-2xl mx-auto">
                Competitor data from public pricing pages as of 2026-06-22. Spotted a mistake?{" "}
                <a
                  href="mailto:hello@usegauge.com"
                  className="underline underline-offset-2 hover:text-gray-600"
                >
                  Tell us
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="pb-16 sm:pb-20 lg:pb-28 px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="eyebrow inline-flex items-center gap-2 mb-4">
              <Zap size={12} /> Frequently asked
            </div>
            <h2 className="text-[clamp(1.5rem,4vw,2.5rem)] font-medium leading-[1.1] tracking-[-0.02em]">
              Pricing questions, answered
            </h2>
          </div>
          <div>
            {FAQ.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
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
    </main>
  );
}
