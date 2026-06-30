"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, CheckCircle, ArrowRight, Zap, Plus, Minus } from "lucide-react";

type BillingCycle = "monthly" | "annual";

const PLANS = [
  {
    name: "Free",
    monthly: { price: "$0", period: "forever" },
    annual: { price: "$0", period: "forever" },
    desc: "Perfect for solo SDRs getting started.",
    features: [
      "300 transcription minutes/mo",
      "AI summaries & action items",
      "Speaker identification",
      "Basic search & history",
      "JSON export",
      "Community support",
    ],
    cta: "Start free",
    ctaHref: "/sign-up",
    popular: false,
  },
  {
    name: "Pro",
    monthly: { price: "$9", period: "/month per user" },
    annual: { price: "$7.50", period: "/month per user, billed annually" },
    desc: "For serious SDRs who need CRM integration.",
    features: [
      "1,200 transcription minutes/mo",
      "Unlimited AI summaries",
      "CRM export (HubSpot, Salesforce)",
      "Advanced analytics dashboard",
      "Priority support",
      "90-minute call limit",
      "Team workspace (up to 5)",
    ],
    cta: "Start free",
    ctaHref: "/sign-up",
    popular: true,
  },
  {
    name: "Business",
    monthly: { price: "$29", period: "/month per user" },
    annual: { price: "$24", period: "/month per user, billed annually" },
    desc: "For sales teams scaling up.",
    features: [
      "6,000 transcription minutes/mo",
      "Microsoft Teams integration",
      "Custom AI workflows",
      "Team analytics & coaching",
      "Unlimited file imports",
      "4-hour call limit",
      "Admin controls & usage logs",
      "API access",
    ],
    cta: "Contact sales",
    ctaHref: "mailto:sales@callnotepro.com?subject=Business%20Plan%20Inquiry",
    popular: false,
  },
  {
    name: "Enterprise",
    monthly: { price: "Custom", period: "" },
    annual: { price: "Custom", period: "" },
    desc: "For organizations with advanced needs.",
    features: [
      "Unlimited transcription",
      "SSO / SAML 2.0",
      "HIPAA compliance",
      "Custom integrations",
      "Dedicated account manager",
      "On-premise deployment",
      "SLA guarantee",
      "Custom AI model training",
    ],
    cta: "Contact sales",
    ctaHref: "mailto:sales@callnotepro.com?subject=Enterprise%20Plan%20Inquiry",
    popular: false,
  },
];

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

function PlanCard({
  plan,
  cycle,
}: {
  plan: (typeof PLANS)[number];
  cycle: BillingCycle;
}) {
  const tier = cycle === "annual" ? plan.annual : plan.monthly;
  const showStrike = cycle === "annual" && plan.monthly.price !== plan.annual.price;

  return (
    <div
      className={`doppel-outer h-full flex flex-col ${
        plan.popular ? "ring-[#F26522]/30 ring-2" : ""
      }`}
    >
      <div
        className={`doppel-inner p-6 sm:p-8 h-full flex flex-col relative ${
          plan.popular ? "bg-[#F26522]/[0.02]" : ""
        }`}
      >
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#F26522] text-[10px] font-bold uppercase tracking-[0.15em] text-white whitespace-nowrap">
            Most popular
          </div>
        )}
        <div className="mb-6">
          <h3 className="text-[16px] font-semibold tracking-tight mb-1">{plan.name}</h3>
          <div className="flex items-baseline gap-2 flex-wrap">
            {showStrike && (
              <span className="text-[14px] text-gray-400 line-through">
                {plan.monthly.price}
              </span>
            )}
            <span className="text-[clamp(1.5rem,3vw,2.5rem)] font-semibold tracking-tight">
              {tier.price}
            </span>
            <span className="text-[12px] text-gray-400">{tier.period}</span>
          </div>
          <p className="text-[12px] text-gray-500 mt-2">{plan.desc}</p>
        </div>
        <div className="flex-1 space-y-2.5 mb-8">
          {plan.features.map((f, j) => (
            <div key={j} className="flex items-start gap-2 text-[12px] text-gray-600">
              <CheckCircle size={14} className="text-[#F26522] shrink-0 mt-0.5" />
              <span>{f}</span>
            </div>
          ))}
        </div>
        <Link
          href={plan.ctaHref}
          className={`block w-full text-center py-3 rounded-full text-[12px] font-semibold transition-all duration-300 ${
            plan.popular
              ? "bg-[#F26522] text-white hover:bg-[#e05a1a] border border-transparent"
              : "bg-white text-gray-900 border border-gray-300 hover:border-gray-900 hover:bg-gray-50"
          }`}
        >
          {plan.cta}
        </Link>
      </div>
    </div>
  );
}

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

export default function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="pt-36 pb-8 sm:pt-40 sm:pb-12 px-5 sm:px-8 lg:px-12 bg-[#EFEFEF] overflow-hidden">
        <div className="max-w-[1440px] mx-auto text-center">
          <div className="eyebrow inline-flex items-center gap-2 mb-6">
            <Sparkles size={12} /> Simple, transparent pricing
          </div>
          <h1 className="text-[clamp(2rem,5vw,4.5rem)] font-medium leading-[1.08] tracking-[-0.03em] mb-4">
            Free for SDRs.
            <br />
            <span className="text-gray-400">Scale when you need to.</span>
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-[14px]">
            No hidden fees. No AI credit traps. Start free, upgrade only when your team grows.
          </p>

          <BillingToggle cycle={cycle} onChange={setCycle} />
        </div>
      </section>

      {/* Plans */}
      <section className="pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-28 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.name} plan={plan} cycle={cycle} />
          ))}
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-8">
          All paid plans include unlimited team members on Free + Pro. Business and Enterprise
          have user limits — see the <a href="#faq" className="underline hover:text-gray-600">FAQ</a>{" "}
          below.
        </p>
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
                          <span>CallNote Pro</span>
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
                        <td className="text-center py-3 px-4 text-gray-500">
                          {row[2]}
                        </td>
                        <td className="text-center py-3 px-4 text-gray-500">
                          {row[3]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10.5px] text-gray-400 mt-4 text-center max-w-2xl mx-auto">
                Competitor data from public pricing pages as of 2026-06-22. Spotted a mistake?{" "}
                <a
                  href="mailto:hello@callnotepro.com"
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
                  <Zap size={12} /> Start today
                </div>
                <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.12] tracking-[-0.02em] mb-3">
                  Ready to save hours every week?
                </h2>
                <p className="text-gray-500 mb-8 text-[14px]">
                  Join SDRs who cut their note-taking time by 80%.
                </p>
                <Link
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
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}