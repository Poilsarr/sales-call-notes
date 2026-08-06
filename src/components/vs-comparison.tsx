import Link from "next/link";
import Nav from "@/components/nav";
import { CheckCircle, X, ArrowRight, Sparkles, Shield, Zap } from "lucide-react";

export type ComparisonRow = { label: string; us: string; them: string };
export type PricingRow = { tier: string; us: string; them: string };
export type FaqItem = { q: string; a: string };

export type ComparisonData = {
  slug: string;
  competitorName: string;
  competitorTagline: string;
  competitorFounded: string;
  competitorFunding: string;
  competitorUsers: string;
  metaTitle: string;
  metaDescription: string;
  heroHeadline: string;
  heroSubhead: string;
  talkingPoints: string[];
  tldr: ComparisonRow[];
  competitorWins: string[];
  ourWins: { title: string; detail: string }[];
  pricing: PricingRow[];
  /**
   * Overrides the pricing-table footnote. Required when the competitor does
   * not publish pricing (e.g. Gong) — the default says "from their public
   * pricing pages", which would be false.
   */
  pricingFootnote?: string;
  whoShouldPickCompetitor: string[];
  whoShouldPickUs: string[];
  faq: FaqItem[];
};

export function VsComparisonPage({ data }: { data: ComparisonData }) {
  const us = "Gauge";
  const them = data.competitorName;
  const lastUpdated = "July 2026";

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Nav />

      {/* Hero */}
      <section className="pt-36 pb-12 sm:pt-40 sm:pb-16 px-5 sm:px-8 lg:px-12 bg-[#EFEFEF]">
        <div className="max-w-[1100px] mx-auto">
          <div className="eyebrow inline-flex items-center gap-2 mb-6">
            <Sparkles size={12} /> Honest comparison · {lastUpdated}
          </div>
          <h1 className="text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.08] tracking-[-0.03em] mb-4">
            {data.heroHeadline}
          </h1>
          <p className="text-gray-600 max-w-2xl text-[15px] leading-relaxed mb-6">
            {data.heroSubhead}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-2 bg-[#C94F17] hover:bg-[#b04011] text-white text-[13px] rounded-full pl-5 pr-2 py-2 transition-colors duration-300"
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
            <Link
              href="/pricing"
              className="inline-flex items-center bg-white border border-gray-300 hover:border-gray-900 text-gray-900 text-[13px] rounded-full px-5 py-2 transition-colors duration-300"
            >
              See full pricing
            </Link>
          </div>
        </div>
      </section>

      {/* TL;DR table */}
      <section className="pt-12 pb-16 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-[22px] font-semibold tracking-tight mb-6">
            The 60-second comparison
          </h2>
          <div className="doppel-outer">
            <div className="doppel-inner overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Feature</th>
                      <th className="text-center py-3 px-4 text-gray-900 font-semibold bg-[#F26522]/[0.06] rounded-t-lg">
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{us}</span>
                          <span className="w-1 h-1 rounded-full bg-[#F26522]" />
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 text-gray-500 font-medium">{them}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tldr.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0">
                        <td className="py-3 px-4 text-gray-600">{row.label}</td>
                        <td className="text-center py-3 px-4 bg-[#F26522]/[0.04] text-gray-900 font-medium">
                          {row.us}
                        </td>
                        <td className="text-center py-3 px-4 text-gray-500">{row.them}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Talking points */}
      <section className="pb-16 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1100px] mx-auto">
          <div className="doppel-outer">
            <div className="doppel-inner p-8 sm:p-12">
              <div className="eyebrow inline-flex items-center gap-2 mb-5">
                <Zap size={12} /> Why teams switch
              </div>
              <ul className="space-y-4">
                {data.talkingPoints.map((tp, i) => (
                  <li key={i} className="flex items-start gap-3 text-[15px] text-gray-700 leading-relaxed">
                    <CheckCircle size={18} className="text-[#F26522] shrink-0 mt-0.5" />
                    <span>{tp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Where each wins — two columns */}
      <section className="pb-16 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="doppel-outer">
            <div className="doppel-inner p-8">
              <h3 className="text-[16px] font-semibold mb-4">Where {them} wins</h3>
              <ul className="space-y-3">
                {data.competitorWins.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
                    <CheckCircle size={14} className="text-gray-400 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-6 border-t border-gray-100 text-[11px] text-gray-500">
                Founded {data.competitorFounded} · {data.competitorFunding} · {data.competitorUsers}
              </div>
            </div>
          </div>
          <div className="doppel-outer ring-[#F26522]/30 ring-2">
            <div className="doppel-inner p-8 bg-[#F26522]/[0.02]">
              <h3 className="text-[16px] font-semibold mb-4">Where {us} wins</h3>
              <ul className="space-y-4">
                {data.ourWins.map((w, i) => (
                  <li key={i}>
                    <div className="text-[14px] font-medium text-gray-900 mb-0.5">{w.title}</div>
                    <div className="text-[12px] text-gray-500 leading-relaxed">{w.detail}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing comparison */}
      <section className="pb-16 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-[22px] font-semibold tracking-tight mb-6">Pricing, side by side</h2>
          <div className="doppel-outer">
            <div className="doppel-inner overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Tier</th>
                      <th className="text-center py-3 px-4 text-gray-900 font-semibold bg-[#F26522]/[0.06] rounded-t-lg">
                        {us}
                      </th>
                      <th className="text-center py-3 px-4 text-gray-500 font-medium">{them}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pricing.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0">
                        <td className="py-3 px-4 text-gray-600">{row.tier}</td>
                        <td className="text-center py-3 px-4 bg-[#F26522]/[0.04] text-gray-900 font-medium">
                          {row.us}
                        </td>
                        <td className="text-center py-3 px-4 text-gray-500">{row.them}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 text-[11px] text-gray-500 border-t border-gray-100">
                {data.pricingFootnote ??
                  "Competitor pricing from their public pricing pages as of " +
                    lastUpdated +
                    ". Spotted a mistake? "}
                {!data.pricingFootnote && (
                  <>
                    <a href="mailto:hello@usegauge.com" className="underline hover:text-gray-600">
                      Tell us
                    </a>
                    .
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who should pick which */}
      <section className="pb-16 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50">
            <h3 className="text-[15px] font-semibold mb-3">Pick {them} if</h3>
            <ul className="space-y-2.5">
              {data.whoShouldPickCompetitor.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
                  <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0 mt-2" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 rounded-2xl border border-[#F26522]/30 bg-[#F26522]/[0.03]">
            <h3 className="text-[15px] font-semibold mb-3">Pick {us} if</h3>
            <ul className="space-y-2.5">
              {data.whoShouldPickUs.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                  <span className="w-1 h-1 rounded-full bg-[#F26522] shrink-0 mt-2" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Privacy wedge callout */}
      <section className="pb-16 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1100px] mx-auto">
          <div className="doppel-outer">
            <div className="doppel-inner p-8 sm:p-12 flex flex-col sm:flex-row items-start gap-6">
              <Shield size={28} className="text-[#F26522] shrink-0" />
              <div>
                <h3 className="text-[18px] font-semibold mb-2">Privacy-first, by default</h3>
                <p className="text-[14px] text-gray-600 leading-relaxed">
                  {us} never auto-joins your meetings. We don&apos;t train on your audio. Your data
                  is GDPR-ready and yours to delete. {them} requires a bot in the room — we
                  don&apos;t. You upload the recording, you stay in control.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="pb-16 px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[22px] font-semibold tracking-tight mb-8 text-center">
            Frequently asked
          </h2>
          <div className="space-y-0">
            {data.faq.map((item, i) => (
              <div key={i} className="border-b border-gray-200">
                <details className="group py-5">
                  <summary className="flex items-center justify-between cursor-pointer text-left gap-4 list-none">
                    <span className="text-[14px] font-medium text-gray-900">{item.q}</span>
                    <span className="shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-open:rotate-45 transition-transform">
                      <X size={12} className="rotate-45" />
                    </span>
                  </summary>
                  <p className="pt-3 text-[13px] text-gray-600 leading-relaxed">{item.a}</p>
                </details>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-16 sm:pb-20 lg:pb-28 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1100px] mx-auto">
          <div className="doppel-outer group">
            <div className="doppel-inner p-10 sm:p-14 lg:p-20 text-center relative overflow-hidden">
              <div className="relative z-10">
                <div className="eyebrow inline-flex items-center gap-2 mb-5">
                  <Zap size={12} /> Start today
                </div>
                <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.12] tracking-[-0.02em] mb-3">
                  Ready to switch from {them}?
                </h2>
                <p className="text-gray-500 mb-8 text-[14px]">
                  Free tier — 300 minutes a month. No credit card. No bot in your meeting.
                </p>
                <Link
                  href="/sign-up"
                  className="group inline-flex items-center gap-2 bg-[#C94F17] hover:bg-[#b04011] text-white text-[13px] rounded-full pl-5 pr-2 py-2 transition-colors duration-300"
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </main>
  );
}
