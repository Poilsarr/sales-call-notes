import type { Metadata } from "next";
import { VsComparisonPage, type ComparisonData } from "@/components/vs-comparison";

export const metadata: Metadata = {
  title: "tl;dv Alternative: Gauge — Global Data + Flat Pricing (2026)",
  description:
    "tl;dv: $20/mo Pro with AI throttled, $60/mo Business for 3 users, EU-only data. Gauge: $9 flat, global US/EU/Asia regions, unlimited AI summaries.",
  alternates: { canonical: "https://usegauge.com/vs/tldv" },
  openGraph: {
    title: "tl;dv Alternative: Gauge — Global Data + Flat Pricing (2026)",
    description: "tl;dv Pro $20/mo, Business $60/3 users, EU-only. Us: $9 flat, global, unlimited AI.",
    url: "https://usegauge.com/vs/tldv",
  },
};

const data: ComparisonData = {
  slug: "tldv",
  competitorName: "tl;dv",
  competitorTagline: "EU-GDPR meeting recorder with AI agents",
  competitorFounded: "2020",
  competitorFunding: "$28M+ raised",
  competitorUsers: "1M+ users",
  metaTitle: "tl;dv Alternative: Gauge — Global Data + Flat Pricing (2026)",
  metaDescription: "tl;dv Pro $20/mo, Business $60/3 users, EU-only. Us: $9 flat, global, unlimited AI.",
  heroHeadline: "The tl;dv alternative with global data residency and flat pricing.",
  heroSubhead:
    "tl;dv is genuinely strong — EU-GDPR wedge, multilingual, AI agents in 2024, $28M in funding. But: Pro is $20/mo with AI throttled, Business is $60/mo for just 3 users, data residency is EU-only, and Reddit is full of 'lost recordings' complaints. We're $9 flat, global regions, and we market 'zero lost meetings' as a feature.",
  talkingPoints: [
    "tl;dv: $20/mo Pro with AI throttled. Ours: $9/mo flat with unlimited AI summaries.",
    "tl;dv Business: $60/mo for 3 users minimum ($20/seat). Ours: $29/mo flat for unlimited users.",
    "tl;dv is EU-only data residency. We're global with US/EU/Asia regions — better for distributed teams.",
    "tl;dv loses recordings — multiple Reddit threads. We market 'zero lost meetings' as a feature.",
    "tl;dv's mobile app is notoriously slow. Ours is web-first and realtime-capable.",
  ],
  tldr: [
    { label: "Free tier", us: "300 min/mo", them: "10 hrs/mo, AI throttled" },
    { label: "Pro price", us: "$9/mo flat", them: "$20/mo (annual $17)" },
    { label: "Business (3 users)", us: "$29/mo flat", them: "$60/mo ($20/seat, 3 user min)" },
    { label: "Data residency", us: "US / EU / Asia", them: "EU-only" },
    { label: "AI summaries", us: "Unlimited at $9", them: "Throttled on free, limited credits" },
    { label: "Languages", us: "30+ via Whisper", them: "30+ (strong multilingual)" },
    { label: "AI agents (chat)", us: "Roadmap — RAG ready", them: "Shipped 2024" },
    { label: "Reliability reputation", us: "Zero lost meetings", them: "Reddit lost-recording threads" },
  ],
  competitorWins: [
    "EU/GDPR positioning is the strongest in category for European buyers",
    "AI Agents feature shipped 2024 — chat with your meetings conversationally",
    "Multilingual support is genuinely best-in-class (30+ languages, deep)",
    "Strong content/SEO engine — ranks for many comparison keywords",
    "Affiliate program is public and generous — drives distribution",
    "Newsletter sponsorships (Lenny's, Marketing Brew) — real brand reach",
  ],
  ourWins: [
    {
      title: "Flat-rate vs per-seat, dramatically cheaper",
      detail: "tl;dv Pro is $20/mo for one user. Our Pro is $9 flat. tl;dv Business is $60/mo for 3 users minimum. Our Business is $29 flat for unlimited users. 10 users on tl;dv = $200/mo. 10 on us = $29.",
    },
    {
      title: "Global data residency, not EU-only",
      detail: "tl;dv is EU-only — great if you're in Germany, painful if you're in SF or Singapore. We're global with US/EU/Asia regions. For distributed teams, we win.",
    },
    {
      title: "Unlimited AI summaries at $9, not throttled",
      detail: "tl;dv's free tier throttles AI (10 hrs/mo with limited credits). Our $9 Pro includes unlimited AI summaries. AI throttling is a feature, not a bug, on tl;dv — it's how they gate the free tier.",
    },
    {
      title: "Reliability story — zero lost meetings",
      detail: "tl;dv has multiple Reddit threads about lost recordings. We market 'zero lost meetings' as a core feature. Reliability is a real wedge when the incumbent has a reputation for data loss.",
    },
    {
      title: "Sales-grade AI extraction",
      detail: "tl;dv's AI is strong on summaries and chat. We add BANT, MEDDIC, SPICED scorecards for sales teams. tl;dv is more horizontal; we go vertical.",
    },
  ],
  pricing: [
    { tier: "Free", us: "$0 — 300 min/mo, unlimited AI", them: "$0 — 10 hrs/mo, AI throttled" },
    { tier: "Pro (1 user)", us: "$9/mo flat", them: "$20/mo (annual $17)" },
    { tier: "Business (3 users)", us: "$29/mo flat", them: "$60/mo ($20/seat × 3, 3 user min)" },
    { tier: "Business (10 users)", us: "$29/mo flat", them: "$200/mo ($20/seat × 10)" },
    { tier: "Enterprise", us: "Custom — SSO, HIPAA, on-prem", them: "Custom — SSO, security" },
  ],
  whoShouldPickCompetitor: [
    "You're in the EU and GDPR data residency is a hard requirement (you need EU-hosted)",
    "You want AI agents (chat with meetings) today, not on a roadmap",
    "You need deep multilingual support and tl;dv's quality is proven for your languages",
    "You want a vendor with strong EU enterprise presence and references",
  ],
  whoShouldPickUs: [
    "You have a distributed team and need US/EU/Asia data regions, not EU-only",
    "You want flat $9/mo, not $20/mo Pro or $60/mo for 3 users",
    "Reliability matters — 'lost recordings' is a deal-breaker for you",
    "You want unlimited AI summaries, not throttled AI credits",
    "You're in sales and want BANT/MEDDIC extraction, not just generic summaries",
    "You're price-sensitive and a small team — per-seat pricing hurts you",
  ],
  faq: [
    {
      q: "Is Gauge cheaper than tl;dv?",
      a: "Yes, at every tier. Solo: $9 flat vs $20. 3 users: $9 flat vs $60 (tl;dv Business 3-user min). 10 users: $29 flat vs $200. The bigger your team, the bigger the gap — tl;dv charges per-seat, we don't.",
    },
    {
      q: "Does Gauge have tl;dv's AI agents?",
      a: "Not yet — tl;dv shipped AI agents in 2024 and it's a real feature. We have the infrastructure (embeddings, vector search) and 'Ask Gauge' is on our roadmap. If conversational AI chat with meetings is a must-have today, tl;dv wins. If $9 flat matters more, we ship it next.",
    },
    {
      q: "What about EU data residency?",
      a: "tl;dv is EU-only — great if you're in Berlin, painful if you're in SF. We're global with US/EU/Asia regions. For EU-only teams, tl;dv's data residency story is stronger. For distributed or US/Asia teams, we win.",
    },
    {
      q: "Does tl;dv really lose recordings?",
      a: "There are multiple Reddit threads from users reporting lost recordings on tl;dv. We don't claim zero data loss is technically possible — we claim we engineer for it (3x webhook retries, 99.9% SLA, audit logs). If reliability is your top criterion, ask tl;dv about their data-loss rate.",
    },
    {
      q: "tl;dv's mobile app vs yours?",
      a: "tl;dv's mobile app is commonly cited as slow on Reddit. We're web-first and mobile-responsive. Neither of us wins native mobile today — Otter does. If mobile capture is your #1 need, this isn't the comparison for you.",
    },
  ],
};

export default function Page() {
  return <VsComparisonPage data={data} />;
}
