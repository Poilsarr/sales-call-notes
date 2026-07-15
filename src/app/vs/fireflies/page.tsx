import type { Metadata } from "next";
import { VsComparisonPage, type ComparisonData } from "@/components/vs-comparison";

export const metadata: Metadata = {
  title: "Fireflies.ai Alternative: Gauge — Flat-Rate vs Per-Seat (2026)",
  description:
    "Fireflies charges $10/seat/mo — 5 reps = $50/mo. Gauge is $9 flat. 600 free minutes, no bot auto-joining, BANT/MEDDIC sales extraction built in.",
  alternates: { canonical: "https://usegauge.com/vs/fireflies" },
  openGraph: {
    title: "Fireflies.ai Alternative: Gauge — Flat-Rate vs Per-Seat (2026)",
    description: "5 reps on Fireflies Pro = $50/mo. 5 reps on us = $9/mo flat. No bot auto-joining.",
    url: "https://usegauge.com/vs/fireflies",
  },
};

const data: ComparisonData = {
  slug: "fireflies",
  competitorName: "Fireflies.ai",
  competitorTagline: "Conversation intelligence platform",
  competitorFounded: "2016",
  competitorFunding: "$19M+ raised",
  competitorUsers: "3M+ users",
  metaTitle: "Fireflies.ai Alternative: Gauge — Flat-Rate vs Per-Seat (2026)",
  metaDescription: "5 reps on Fireflies Pro = $50/mo. 5 reps on us = $9/mo flat. No bot auto-joining.",
  heroHeadline: "The Fireflies alternative that doesn't charge you per seat.",
  heroSubhead:
    "Fireflies is a serious conversation-intelligence product — 3M+ users, 500+ integrations, deep CRM sync. But their per-seat pricing kills small teams. 5 reps on Fireflies Pro = $50/mo. 5 reps on Gauge = $9/mo flat. Same features, half the bloat.",
  talkingPoints: [
    "Fireflies charges per-seat. We charge flat-rate. 5 users on Fireflies Pro = $50/mo. 5 users on us = $9/mo. Same math at any team size.",
    "Fireflies' free tier loses your meetings after 800 minutes of storage. Ours: keep them, 300 minutes/mo with unlimited imports.",
    "Fireflies sales coaching is $19/seat/mo. We include BANT/MEDDIC extraction in $9 flat.",
    "Fireflies bot joins meetings — same Otter problem. Ours: opt-in only, never auto-joins.",
    "Fireflies is built for enterprise. We're built for indie sellers, recruiters, and small teams who don't want a 5,000-feature platform.",
  ],
  tldr: [
    { label: "Free tier", us: "300 min/mo, unlimited imports", them: "800 min storage cap" },
    { label: "Pro price (5 seats)", us: "$9/mo flat", them: "$50/mo ($10/seat × 5)" },
    { label: "Business price (5 seats)", us: "$29/mo flat", them: "$95/mo ($19/seat × 5)" },
    { label: "Pricing model", us: "Flat-rate", them: "Per-seat" },
    { label: "Bot joins meetings?", us: "Never", them: "Yes, auto-joins" },
    { label: "Integrations", us: "10+ deep", them: "500+ (depth varies)" },
    { label: "Sales AI extraction", us: "BANT/MEDDIC built in", them: "Conversation intel at $19/seat" },
    { label: "Best for", us: "Small teams, indie sellers", them: "Enterprise RevOps teams" },
  ],
  competitorWins: [
    "500+ integrations — by far the deepest ecosystem in category",
    "Conversation intelligence is real — deal tracking, scorecards, coaching at Business tier",
    "Deep CRM sync (HubSpot, Salesforce, Pipedrive) with field mapping",
    "3M+ users — community, templates, knowledge base",
    "Custom branding — share notes as your company",
    "Notion and Slack embeds for viral surface area",
  ],
  ourWins: [
    {
      title: "Flat-rate pricing destroys per-seat math",
      detail: "5 reps on Fireflies Pro = $50/mo. 5 reps on Business = $95/mo. Same 5 reps on Gauge = $9 flat. Same 5 reps on Business = $29 flat. The bigger your team, the bigger our win.",
    },
    {
      title: "No bot in your meeting",
      detail: "Fireflies auto-joins meetings as a bot — the same Otter problem that triggered a 2025 lawsuit. We never auto-join. You upload, we analyze.",
    },
    {
      title: "Free tier that doesn't lose your data",
      detail: "Fireflies caps free storage at 800 minutes — once you hit the cap, old meetings get buried. We give 300 min/mo with unlimited imports and don't penalize you for keeping history.",
    },
    {
      title: "Sales AI at $9, not $19/seat",
      detail: "Fireflies locks BANT/MEDDIC and coaching behind $19/seat Business. We include sales-grade extraction in $9 flat. That's not a feature gap — it's a pricing philosophy.",
    },
    {
      title: "Vertical, not horizontal",
      detail: "Fireflies is built for RevOps teams. We're built for recruiters, consultants, founders, therapists, journalists — the people Fireflies isn't designed for.",
    },
  ],
  pricing: [
    { tier: "Free", us: "$0 — 300 min/mo, unlimited imports", them: "$0 — 800 min storage cap" },
    { tier: "Pro (1 user)", us: "$9/mo flat", them: "$10/seat/mo annual ($18 monthly)" },
    { tier: "Pro (5 users)", us: "$9/mo flat", them: "$50/mo ($10/seat × 5)" },
    { tier: "Business (5 users)", us: "$29/mo flat", them: "$95/mo ($19/seat × 5)" },
    { tier: "Enterprise", us: "Custom — SSO, HIPAA, on-prem", them: "$39/seat/mo — SOC2, custom workflows" },
  ],
  whoShouldPickCompetitor: [
    "You're a 50+ person RevOps team that lives in HubSpot/Salesforce and needs 500+ integrations",
    "You need deep conversation intelligence (deal scoring, win/loss, coaching workflows)",
    "You want custom branding on shared notes (white-label)",
    "Your team is large enough that the per-seat math is budgeted and approved",
  ],
  whoShouldPickUs: [
    "You have a small team (1-10) and per-seat pricing makes the bill unpredictable",
    "You don't want a bot auto-joining meetings — privacy matters to your clients",
    "You want BANT/MEDDIC extraction without paying $19/seat",
    "You're a recruiter, consultant, founder, or indie seller — not enterprise RevOps",
    "You want a free tier that doesn't quietly cap your storage",
  ],
  faq: [
    {
      q: "Is Gauge really cheaper than Fireflies?",
      a: "For solo users, it's close — $9 flat vs $10/seat. For teams, it's not close. 5 reps on Fireflies Pro = $50/mo. 5 reps on us = $9/mo flat. At 10 reps on Fireflies Business, you're paying $190/mo. At 10 reps on us, still $29/mo.",
    },
    {
      q: "Does Gauge have Fireflies' 500 integrations?",
      a: "No. We have 10+ deep integrations (HubSpot, Salesforce, Slack, Teams, Calendar, Chrome, API, webhooks). Fireflies wins on integration count. If you need a specific niche integration, check our /integrations page or email us — we ship integrations in days, not quarters.",
    },
    {
      q: "What about conversation intelligence and deal coaching?",
      a: "Fireflies' conversation intelligence is genuinely better at enterprise scale — deal tracking, scorecards, manager coaching workflows. We have BANT/MEDDIC extraction and a 0-100 call score at $9 flat. If you need Gong-level RevOps tooling, Fireflies Business is the right call. If you need sales AI for a small team, we win.",
    },
    {
      q: "Does Gauge auto-join meetings like Fireflies?",
      a: "No. Both Fireflies and Otter auto-join as bot participants — which is what triggered the 2025 Otter consent lawsuit. We never auto-join. You record, you upload, we analyze. Privacy-first is the whole point.",
    },
    {
      q: "Can I migrate my Fireflies history?",
      a: "Yes — export audio from Fireflies, upload to Gauge. We accept MP3, WAV, M4A, WebM. For bulk migration, email hello@usegauge.com.",
    },
  ],
};

export default function Page() {
  return <VsComparisonPage data={data} />;
}
