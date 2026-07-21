"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { CheckCircle, Loader2, ArrowRight, Zap, Plus, Minus, ShieldCheck, RotateCcw, CreditCard, Clock, TrendingUp } from "lucide-react";
import type { Tier } from "@/lib/pricing-tiers";
// NOTE: @paddle/paddle-js is imported dynamically inside openCheckout() so the
// heavy SDK is NOT in the initial /pricing bundle (Lighthouse byte-weight budget).

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
    a: "Yes — Pro is $7.50/mo equivalent (billed annually as a single charge) and Business is $24/mo equivalent (billed annually). That's a 17% discount on both paid tiers.",
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
  const [checkingOut, setCheckingOut] = useState(false);
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

  // Fetch localized prices whenever cycle (or country) changes. We call our
  // server route (which hits Paddle's REST pricing-preview) because the
  // @paddle/paddle-js SDK does not ship a working PricePreview() at runtime.
  useEffect(() => {
    let cancelled = false;
    setPricesLoading(true);

    const items = tiers
      .filter((t) => t.ctaKind === "checkout")
      .map((tier) => ({ priceId: priceIdForCycle(tier), quantity: 1 }));

    fetch("/api/pricing-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, country: initialCountry }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.prices) {
          // Map each priceId -> tier name, then build the display map.
          const priceToTier: Record<string, string> = {};
          tiers.forEach((tier) => {
            if (tier.ctaKind === "checkout") {
              priceToTier[priceIdForCycle(tier)] = tier.name;
            }
          });
          const map: Record<string, string> = {};
          for (const [priceId, total] of Object.entries(data.prices)) {
            const tierName = priceToTier[priceId];
            if (tierName) map[tierName] = total as string;
          }
          setPrices(map);
        } else {
          setPaddleError(true);
        }
        setPricesLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Price preview fetch failed:", err);
        setPaddleError(true);
        setPricesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cycle, initialCountry, tiers, priceIdForCycle]);

  const openCheckout = useCallback(
    async (tier: Tier) => {
      if (checkingOut) return;
      if (!isSignedIn) {
        window.location.href = `/sign-up?redirect=/pricing`;
        return;
      }
      setCheckingOut(true);
      try {
        // Lazy-load the Paddle SDK only when the user starts checkout. This
        // keeps the heavy SDK out of the initial /pricing bundle (Lighthouse
        // byte-weight budget) — prices come from our own server route.
        const { initializePaddle } = await import("@paddle/paddle-js");
        const paddle = await initializePaddle({
          environment,
          token: clientToken,
          ...(user?.primaryEmailAddress?.emailAddress
            ? { pwCustomer: { email: user.primaryEmailAddress.emailAddress } }
            : {}),
        });
        if (!paddle) throw new Error("Paddle failed to initialize");
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
      } catch (err) {
        console.error("Paddle checkout failed:", err);
        setPaddleError(true);
      } finally {
        setCheckingOut(false);
      }
    },
    [checkingOut, isSignedIn, user, environment, clientToken, priceIdForCycle]
  );

  return (
    <main className="flex-1 bg-white text-gray-900">
      {/* Hero — two-column layout matching the home page. Left: copy + billing
          toggle. Right: a product preview card showing what Pro actually buys
          you, so visitors don't have to scroll to picture the value. */}
      <section className="relative pt-32 pb-12 sm:pt-36 sm:pb-16 lg:pt-44 lg:pb-20 px-5 sm:px-8 lg:px-12 bg-[#EFEFEF] overflow-hidden">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-end">
            {/* LEFT: eyebrow + headline + sub + toggle */}
            <div className="text-center lg:text-left">
              <div className="eyebrow inline-flex items-center gap-2 mb-5 sm:mb-6">
                <CheckCircle size={12} /> Simple, transparent pricing
              </div>
              <h1 className="text-[clamp(2rem,5vw,4.5rem)] font-medium leading-[1.08] tracking-[-0.03em] mb-4">
                Free for SDRs.
                <br />
                <span className="text-gray-400">Scale when you need to.</span>
              </h1>
              <p className="text-gray-500 max-w-xl lg:mx-0 mx-auto text-[14px] mb-8">
                No hidden fees. No AI credit traps. Prices shown in your local currency. Start
                free, upgrade only when your team grows.
              </p>

              <div className="flex justify-center lg:justify-start">
                <BillingToggle cycle={cycle} onChange={setCycle} />
              </div>
            </div>

            {/* RIGHT: Pro plan preview card — mirrors the home page's "Live
                summary" pattern. Visitors land on /pricing wanting to know
                "is Pro worth it?"; this card answers with a compact snapshot
                of what Pro actually includes, anchored on the $9 price. */}
            <div className="relative">
              <div className="doppel-outer">
                <div className="doppel-inner p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-[#F26522] animate-pulse" />
                    <span className="text-[10px] font-mono tracking-wider text-gray-400 font-medium uppercase">
                      Pro · $9/mo
                    </span>
                    <span className="ml-auto text-[9px] font-mono text-gray-300">
                      5 seats included
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle size={14} className="text-[#F26522] shrink-0 mt-0.5" />
                      <p className="text-[12.5px] text-gray-700 leading-snug">
                        <strong>1,200</strong> transcription minutes / mo — about 20 calls
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle size={14} className="text-[#F26522] shrink-0 mt-0.5" />
                      <p className="text-[12.5px] text-gray-700 leading-snug">
                        <strong>HubSpot + Salesforce</strong> sync, one click
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle size={14} className="text-[#F26522] shrink-0 mt-0.5" />
                      <p className="text-[12.5px] text-gray-700 leading-snug">
                        <strong>Competitive-intel</strong> alerts when a rival name hits a call
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle size={14} className="text-[#F26522] shrink-0 mt-0.5" />
                      <p className="text-[12.5px] text-gray-700 leading-snug">
                        <strong>90-min</strong> call limit · live transcription · priority support
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Cancel anytime
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F26522]" />
                      17% off annual
                    </span>
                    <span className="hidden sm:flex items-center gap-1.5">
                      Local currency
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-28 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto mb-8 flex flex-col items-center gap-3 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F26522]/10 text-[#F26522] text-[11px] font-semibold">
            <CheckCircle size={11} /> Flat-rate pricing
          </span>
          <p className="text-[15px] text-gray-700 max-w-2xl">
            Fireflies is <strong className="text-gray-900">$10/rep/mo</strong> for a 5-rep team — that&apos;s{" "}
            <strong className="text-gray-900">$50/mo</strong>. Gauge Pro is{" "}
            <strong className="text-[#F26522]">$9/mo flat for 5 seats</strong>. Same team, ~82% less.
          </p>
          <p className="text-[12px] text-gray-500 max-w-xl">
            No per-seat math at any tier. Pro caps at 5 seats so the price stays a price. Business is flat for unlimited seats.
          </p>
        </div>

        <div className="max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((tier) => {
            const isPopular = tier.name === "Pro";
            const isPaddle = tier.ctaKind === "checkout";
            const price = prices[tier.name];
            const showPrice = isPaddle && !!price && !pricesLoading && !paddleError;
            // Paddle's pricing-preview returns `formatted_totals.total` which is
            // the total amount the customer is charged at signup: for an annual
            // sub priced at $7.50/mo that's the full $90.00, not the $7.50
            // monthly equivalent. Suffixing that number with "/month" reads as
            // a 12x overcharge illusion. Match Linear / Stripe: annual = the
            // total, no "/month" suffix.
            const periodLabel = cycle === "annual" ? "billed annually" : "/month";
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
                      disabled={checkingOut || !!paddleError || pricesLoading}
                      className={`block w-full text-center py-3 rounded-full text-[12px] font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isPopular
                          ? "bg-[#F26522] text-white hover:bg-[#e05a1a] border border-transparent"
                          : "bg-white text-gray-900 border border-gray-300 hover:border-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      {!clerkLoaded ? (
                        <Loader2 size={14} className="animate-spin mx-auto" />
                      ) : paddleError && isPaddle ? (
                        "Unavailable"
                      ) : isSignedIn ? (
                        checkingOut ? "Loading…" : tier.cta
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

        <p className="text-center text-[11px] text-gray-400 mt-8 max-w-2xl mx-auto">
          Pro is flat for up to 5 seats. Business is flat for unlimited seats. Prices shown in your
          local currency and include applicable tax.
        </p>
        {paddleError && (
          <p className="text-center text-[12px] text-red-500 mt-3">
            Live prices are temporarily unavailable. Please refresh or try again shortly.
          </p>
        )}
      </section>

      {/* Trust badges — reduce friction at the point of purchase decision */}
      <section className="pb-12 sm:pb-16 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: CreditCard,
                title: "No credit card for Free",
                body: "Start with 300 minutes/mo instantly. Pay only when you upgrade.",
              },
              {
                icon: RotateCcw,
                title: "Cancel anytime",
                body: "No annual lock-ins. Downgrade or cancel from your billing page.",
              },
              {
                icon: ShieldCheck,
                title: "14-day money-back guarantee",
                body: "Not happy with Pro or Business? Full refund, no questions asked.",
              },
            ].map((badge) => (
              <div
                key={badge.title}
                className="doppel-outer flex flex-col items-center text-center"
              >
                <div className="doppel-inner p-6 w-full h-full">
                  <div className="w-10 h-10 rounded-full bg-[#F26522]/10 flex items-center justify-center mx-auto mb-3">
                    <badge.icon size={20} className="text-[#F26522]" />
                  </div>
                  <h4 className="text-[13px] font-semibold text-gray-900 mb-1">
                    {badge.title}
                  </h4>
                  <p className="text-[12px] text-gray-500 leading-relaxed">{badge.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
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
                      <th className="text-center py-3 px-4 text-white font-semibold bg-[#F26522]/[0.12] border-x-2 border-[#F26522]/30 rounded-t-lg">
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
                        <td className="text-center py-3 px-4 bg-[#F26522]/[0.07] border-x-2 border-[#F26522]/20 text-gray-900">
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
                  <TrendingUp size={12} /> Why teams upgrade
                </div>
                <h2 className="text-[clamp(1.5rem,4vw,2.5rem)] font-medium leading-[1.12] tracking-[-0.02em] mb-10">
                  One tool that pays for itself
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-4xl mx-auto mb-12">
                  {[
                    {
                      icon: Clock,
                      title: "Reclaim 5+ hours/week",
                      body: "Stop re-listening to calls and writing notes. Get instant transcripts, summaries, and action items.",
                    },
                    {
                      icon: TrendingUp,
                      title: "Close more deals",
                      body: "CRM sync pushes follow-ups straight to HubSpot or Salesforce so nothing falls through the cracks.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Predictable pricing",
                      body: "Flat-rate plans. Add your whole team without multiplying the cost like per-seat tools do.",
                    },
                  ].map((v) => (
                    <div key={v.title} className="flex flex-col items-start">
                      <div className="w-9 h-9 rounded-full bg-[#F26522]/10 flex items-center justify-center mb-3">
                        <v.icon size={18} className="text-[#F26522]" />
                      </div>
                      <h3 className="text-[14px] font-semibold text-gray-900 mb-1">{v.title}</h3>
                      <p className="text-[12px] text-gray-500 leading-relaxed">{v.body}</p>
                    </div>
                  ))}
                </div>
              </div>

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
