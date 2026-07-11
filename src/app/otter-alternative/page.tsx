import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/nav";
import { ArrowRight, CheckCircle, Zap, Shield, Sparkles, X } from "lucide-react";

export const metadata: Metadata = {
  title: "Best Otter.ai Alternative in 2026: 7 Options Compared (With Pricing)",
  description:
    "Looking for an Otter.ai alternative? We compared 7 meeting-notetaker tools on price, privacy, AI quality, and team pricing. Free + paid options — including CallNote Pro, Fathom, Fireflies, tl;dv.",
  alternates: { canonical: "https://callnotepro.com/otter-alternative" },
  openGraph: {
    title: "Best Otter.ai Alternative in 2026: 7 Options Compared (With Pricing)",
    description:
      "7 Otter alternatives compared on price, privacy, AI quality, team pricing. Free + paid.",
    url: "https://callnotepro.com/otter-alternative",
  },
};

const alternatives = [
  {
    name: "CallNote Pro",
    free: "300 min/mo, unlimited imports",
    paid: "$9/mo flat (not per-seat)",
    best: "Privacy-first, flat-rate, sales-trained AI",
    privacy: "Never auto-joins, GDPR-first",
    us: true,
  },
  {
    name: "Fathom",
    free: "Unlimited (public links only)",
    paid: "$15/seat/mo Team",
    best: "Best UI, truly unlimited free",
    privacy: "Bot-free mode added 2024",
    us: false,
  },
  {
    name: "Fireflies.ai",
    free: "800 min storage cap",
    paid: "$10/seat/mo Pro",
    best: "500+ integrations, conversation intel",
    privacy: "Bot auto-joins",
    us: false,
  },
  {
    name: "tl;dv",
    free: "10 hrs/mo, AI throttled",
    paid: "$20/mo Pro",
    best: "EU/GDPR, multilingual",
    privacy: "EU-hosted, AI Agents 2024",
    us: false,
  },
  {
    name: "Avoma",
    free: "Limited free",
    paid: "$19/seat/mo",
    best: "Conversation intelligence at SMB price",
    privacy: "Standard cloud",
    us: false,
  },
  {
    name: "Notta",
    free: "120 min/mo",
    paid: "$13.33/mo annual",
    best: "Multilingual, mobile-first",
    privacy: "Standard cloud",
    us: false,
  },
  {
    name: "Tactiq",
    free: "10 meetings/mo",
    paid: "$12/mo",
    best: "Browser-only, no bot",
    privacy: "No video recording",
    us: false,
  },
];

export default function Page() {
  const lastUpdated = "July 2026";

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the best free Otter.ai alternative in 2026?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Fathom offers the most generous free tier (unlimited transcription, but public-link only). CallNote Pro gives 300 min/mo with private storage. Fireflies gives 800 min storage cap. For a private, sustainable free tier, CallNote Pro wins.",
        },
      },
      {
        "@type": "Question",
        name: "What is the cheapest Otter.ai alternative for teams?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "CallNote Pro is $9/mo flat — bring your whole team, no per-seat math. 5 users on Otter Business is $100/mo; 5 users on Fireflies Pro is $50/mo; 5 users on CallNote Pro is $9/mo total.",
        },
      },
      {
        "@type": "Question",
        name: "Which Otter alternative doesn't auto-join meetings?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "CallNote Pro never auto-joins. Fathom added a bot-free mode in 2024. Tactiq is browser-only. Otter, Fireflies, and most others auto-join as bot participants — which is what triggered Otter's 2025 consent lawsuit.",
        },
      },
      {
        "@type": "Question",
        name: "Why was Otter.ai sued in 2025?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Otter faced a 2025 class-action lawsuit in California for recording meetings without consent. The case highlighted concerns about bots joining meetings uninvited. If privacy matters to your team, this is a reason to look at alternatives.",
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Nav />

      {/* Hero */}
      <section className="pt-36 pb-12 sm:pt-40 sm:pb-16 px-5 sm:px-8 lg:px-12 bg-[#EFEFEF]">
        <div className="max-w-[1100px] mx-auto">
          <div className="eyebrow inline-flex items-center gap-2 mb-6">
            <Sparkles size={12} /> Honest ranking · {lastUpdated}
          </div>
          <h1 className="text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.08] tracking-[-0.03em] mb-4">
            The 7 best Otter.ai alternatives in 2026
          </h1>
          <p className="text-gray-500 max-w-2xl text-[15px] leading-relaxed mb-6">
            Otter is the default — 10M+ users, Zoom partnership, 9 years of polish. But in 2025 they
            were sued for recording meetings without consent, their free tier caps you at 300
            minutes and 3 lifetime imports, and Business is $20/seat. Here are 7 alternatives,
            compared honestly — including ours.
          </p>
          <div className="flex flex-wrap gap-3">
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
            <Link
              href="/vs/otter-ai"
              className="inline-flex items-center bg-white border border-gray-300 hover:border-gray-900 text-gray-900 text-[13px] rounded-full px-5 py-2 transition-colors duration-300"
            >
              See head-to-head: CallNote Pro vs Otter
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="pt-12 pb-16 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-[22px] font-semibold tracking-tight mb-6">All 7 alternatives compared</h2>
          <div className="doppel-outer">
            <div className="doppel-inner overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Tool</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Free tier</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Paid price</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Best for</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Privacy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alternatives.map((a, i) => (
                      <tr
                        key={a.name}
                        className={`border-b border-gray-100 last:border-0 ${
                          a.us ? "bg-[#F26522]/[0.04]" : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {a.us && <span className="w-1 h-1 rounded-full bg-[#F26522]" />}
                            <span className={a.us ? "font-semibold text-gray-900" : "text-gray-700"}>
                              {a.name}
                            </span>
                            {a.us && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-[#F26522]">
                                us
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{a.free}</td>
                        <td className="py-3 px-4 text-gray-600">{a.paid}</td>
                        <td className="py-3 px-4 text-gray-600">{a.best}</td>
                        <td className="py-3 px-4 text-gray-600">{a.privacy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why pick us — the 4-point case */}
      <section className="pb-16 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-[22px] font-semibold tracking-tight mb-8 text-center">
            Why teams pick CallNote Pro over Otter
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="doppel-outer">
              <div className="doppel-inner p-8">
                <Shield size={24} className="text-[#F26522] mb-4" />
                <h3 className="text-[16px] font-semibold mb-2">Privacy-first, by default</h3>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  Otter got sued in 2025 for recording without consent. We never auto-join. You
                  record, you upload, we analyze. GDPR-first, no bot in the room.
                </p>
              </div>
            </div>
            <div className="doppel-outer">
              <div className="doppel-inner p-8">
                <Zap size={24} className="text-[#F26522] mb-4" />
                <h3 className="text-[16px] font-semibold mb-2">Flat $9, not $20/seat</h3>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  5 reps on Otter Business = $100/mo. 5 reps on us = $9/mo flat. Per-seat pricing is
                  hostile to small teams. Flat-rate is the whole point.
                </p>
              </div>
            </div>
            <div className="doppel-outer">
              <div className="doppel-inner p-8">
                <CheckCircle size={24} className="text-[#F26522] mb-4" />
                <h3 className="text-[16px] font-semibold mb-2">Sales-trained AI</h3>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  BANT, MEDDIC, SPICED, GPCTBA scorecards out of the box. Action items with owners
                  and deadlines. Otter gives you a generic summary. We give you sales-grade
                  extraction.
                </p>
              </div>
            </div>
            <div className="doppel-outer">
              <div className="doppel-inner p-8">
                <Sparkles size={24} className="text-[#F26522] mb-4" />
                <h3 className="text-[16px] font-semibold mb-2">Built for verticals, not horizontal</h3>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  Recruiters, consultants, founders, therapists, journalists. Otter is a generic
                  meeting notetaker. We have prompt templates for your industry.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* When to pick each — honest */}
      <section className="pb-16 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-[22px] font-semibold tracking-tight mb-6">
            When to pick which (honestly)
          </h2>
          <div className="space-y-3">
            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50">
              <strong className="text-[14px]">Pick Fathom if:</strong>
              <span className="text-[13px] text-gray-600 ml-2">
                you want truly unlimited free and don&apos;t mind public share links.
              </span>
            </div>
            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50">
              <strong className="text-[14px]">Pick Fireflies if:</strong>
              <span className="text-[13px] text-gray-600 ml-2">
                you need 500+ integrations and deep conversation intelligence for a 50+ person
                RevOps team.
              </span>
            </div>
            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50">
              <strong className="text-[14px]">Pick tl;dv if:</strong>
              <span className="text-[13px] text-gray-600 ml-2">
                you need EU data residency and AI agents (chat with meetings) today.
              </span>
            </div>
            <div className="p-5 rounded-xl border border-[#F26522]/30 bg-[#F26522]/[0.03]">
              <strong className="text-[14px] text-[#F26522]">Pick CallNote Pro if:</strong>
              <span className="text-[13px] text-gray-700 ml-2">
                you want privacy (no auto-join), flat $9 (not per-seat), sales AI (BANT/MEDDIC),
                and a vendor that&apos;s a sustainable indie business — not VC-funded free.
              </span>
            </div>
            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50">
              <strong className="text-[14px]">Stay on Otter if:</strong>
              <span className="text-[13px] text-gray-600 ml-2">
                you have 50+ people already on it, you live in Zoom, and OtterPilot&apos;s auto-join
                is core to your workflow. The switching cost isn&apos;t worth it.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-16 px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[22px] font-semibold tracking-tight mb-8 text-center">
            Frequently asked
          </h2>
          <div className="space-y-0">
            {[
              {
                q: "What is the best free Otter.ai alternative in 2026?",
                a: "Fathom offers the most generous free tier (unlimited transcription, but public-link only). CallNote Pro gives 300 min/mo with private storage. Fireflies gives 800 min storage cap. For a private, sustainable free tier, CallNote Pro wins.",
              },
              {
                q: "What is the cheapest Otter.ai alternative for teams?",
                a: "CallNote Pro is $9/mo flat — bring your whole team, no per-seat math. 5 users on Otter Business is $100/mo; 5 users on Fireflies Pro is $50/mo; 5 users on CallNote Pro is $9/mo total.",
              },
              {
                q: "Which Otter alternative doesn't auto-join meetings?",
                a: "CallNote Pro never auto-joins. Fathom added a bot-free mode in 2024. Tactiq is browser-only. Otter, Fireflies, and most others auto-join as bot participants — which is what triggered Otter's 2025 consent lawsuit.",
              },
              {
                q: "Why was Otter.ai sued in 2025?",
                a: "Otter faced a 2025 class-action lawsuit in California for recording meetings without consent. The case highlighted concerns about bots joining meetings uninvited. If privacy matters to your team, this is a reason to look at alternatives.",
              },
              {
                q: "Can I migrate my Otter history to another tool?",
                a: "Yes — most alternatives (including us) accept MP3, WAV, M4A, WebM uploads. Export from Otter, upload to the new tool. For bulk migration, email the vendor — most indie vendors will help.",
              },
            ].map((item, i) => (
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
      <section className="pb-20 px-5 sm:px-8 lg:px-12">
        <div className="max-w-[1100px] mx-auto">
          <div className="doppel-outer group">
            <div className="doppel-inner p-10 sm:p-14 lg:p-20 text-center relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-medium leading-[1.12] tracking-[-0.02em] mb-3">
                  Switch from Otter today
                </h2>
                <p className="text-gray-500 mb-8 text-[14px]">
                  Free tier — 300 minutes a month, no credit card, no bot in your meeting.
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </main>
  );
}
