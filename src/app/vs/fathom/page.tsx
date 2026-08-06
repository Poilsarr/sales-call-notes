import type { Metadata } from "next";
import { VsComparisonPage, type ComparisonData } from "@/components/vs-comparison";



const data: ComparisonData = {
  slug: "fathom",
  competitorName: "Fathom",
  competitorTagline: "Free forever meeting notetaker",
  competitorFounded: "2020",
  competitorFunding: "$20M+ raised",
  competitorUsers: "1M+ users",
  metaTitle: "Fathom Alternative: Gauge — Flat-Rate + Private (2026)",
  metaDescription: "Fathom's free tier is unlimited but public-link only. Team tier is $15/seat × 5 = $75/mo. Gauge is $9 flat, private by default, sales-trained AI.",
  heroHeadline: "The Fathom alternative for people who want private links and flat pricing.",
  heroSubhead:
    "Fathom's \"free forever\" pitch is the best in category — unlimited recordings, unlimited transcription, unlimited storage. They fund it with Series A capital and B2B expansion at $15-25/seat. The catch: free is public-link only, and team pricing is per-seat. We're a sustainable indie alternative — flat $9, private by default, sales-trained AI.",
  talkingPoints: [
    "Fathom's free tier: unlimited but public links only. Ours: 300 min/mo with private storage by default.",
    "Fathom team pricing: $15/seat × 5 = $75/mo. Ours: $9 flat for 5 reps. That's 8x cheaper at 5 seats.",
    "Fathom is built for sales. We built it for whoever has meetings: recruiters, founders, consultants, researchers, therapists.",
    "Fathom is English-first. We speak 30+ languages natively via Whisper.",
    "Fathom's free tier is paid for by enterprise contracts. We're a sustainable indie business — no surprise pricing changes.",
  ],
  tldr: [
    { label: "Free tier", us: "300 min/mo, private", them: "Unlimited, public-link only" },
    { label: "Pro price (5 seats)", us: "$9/mo flat", them: "$75/mo ($15/seat × 5)" },
    { label: "Business price (5 seats)", us: "$29/mo flat", them: "$125/mo ($25/seat × 5)" },
    { label: "Pricing model", us: "Flat-rate, public", them: "Per-seat, public" },
    { label: "Bot joins meetings?", us: "Never", them: "Bot-free mode available (2024)" },
    { label: "Languages", us: "30+ via Whisper", them: "English-first" },
    { label: "Sales AI extraction", us: "BANT/MEDDIC built in", them: "Basic summaries" },
    { label: "Compliance", us: "GDPR-first", them: "SOC2 recent, not for regulated" },
  ],
  competitorWins: [
    "Truly unlimited free tier — recordings, transcription, storage all uncapped (a customer-acquisition weapon)",
    "Beautiful UI — premium feel from day 1, the best design in category",
    "Public share links drive SEO + viral acquisition (every meeting is a Google-indexed page)",
    "Bot-free mode available (2024) — caught up to the privacy concern",
    "IndieHackers community presence — founder is vocal, drives trust",
    "Sales positioning as 'Gong for the rest of us' is sharp and effective",
  ],
  ourWins: [
    {
      title: "Flat-rate pricing, not per-seat",
      detail: "5 reps on Fathom Team = $75/mo ($15/seat). 5 reps on Gauge Business = $29/mo flat. At 10 reps the gap widens to $150/mo vs $29/mo.",
    },
    {
      title: "Private by default, not public-link only",
      detail: "Fathom's free tier only lets you share meetings via public links — which is how they fund the free product (SEO + virality). Your meetings become their marketing. We don't do that. Free tier is private.",
    },
    {
      title: "Sales-trained AI out of the box",
      detail: "Fathom gives you smart summaries and action items. We give you BANT, MEDDIC, SPICED scorecards — sales-grade extraction at $9 flat, not $15/seat.",
    },
    {
      title: "30+ languages, not English-first",
      detail: "Fathom is English-focused. We run on Whisper — 30+ languages natively, with multilingual diarization. If your team is global, we win.",
    },
    {
      title: "Sustainable indie pricing, not VC-funded free",
      detail: "Fathom's free is funded by Series A capital and B2B expansion. When funding runs out, pricing changes. We're a sustainable indie business — flat $9, no surprises, no Series B pricing reset.",
    },
  ],
  pricing: [
    { tier: "Free", us: "$0 — 300 min/mo, private", them: "$0 — unlimited, public links" },
    { tier: "Pro (1 user)", us: "$9/mo flat", them: "$15/seat/mo annual ($19 monthly)" },
    { tier: "Team (5 users)", us: "$9/mo flat", them: "$75/mo ($15/seat × 5)" },
    { tier: "Business (5 users)", us: "$29/mo flat", them: "$125/mo ($25/seat × 5)" },
    { tier: "Enterprise", us: "Custom — SSO, HIPAA, on-prem", them: "Custom — security review" },
  ],
  whoShouldPickCompetitor: [
    "You want truly unlimited free transcription and don't mind public share links",
    "You need the best UI in category and are willing to pay per-seat for it",
    "Your team is in sales and you want 'Gong for the rest of us' positioning",
    "You want public share links as a feature (SEO, virality, content marketing)",
    "You're English-only and don't need multilingual depth",
  ],
  whoShouldPickUs: [
    "You want private meetings by default — your calls aren't marketing assets",
    "You have a 5+ person team and per-seat pricing hurts ($75/mo vs $9 flat)",
    "You need 30+ languages, not just English",
    "You want BANT/MEDDIC sales AI at $9 flat, not $15/seat",
    "You want a sustainable indie vendor — not VC-funded free that may repricing",
    "You're a recruiter, consultant, founder, therapist — not just a sales team",
  ],
  faq: [
    {
      q: "Fathom is free forever. Why would I pay you?",
      a: "Two reasons. First, Fathom's free is public-link only — your meetings become Google-indexed pages. If privacy matters, that's a no-go. Second, Fathom Team is $15/seat × 5 = $75/mo. Our Pro is $9 flat. If you have a team and want private + flat-rate, we're cheaper than Fathom's paid tier.",
    },
    {
      q: "Does Gauge have Fathom's UI quality?",
      a: "Fathom's UI is genuinely best-in-class — we won't pretend otherwise. Our UI is clean and fast but not Fathom's polish. If UI is your #1 criterion, Fathom wins. If private + flat-rate + sales AI matter more, we win.",
    },
    {
      q: "What about Fathom's bot-free mode?",
      a: "Fathom added a bot-free mode in 2024 — catching up to the privacy concern Otter triggered. We were bot-free from day 1. We never auto-join, we don't have a 'mode' for it — it's the only mode.",
    },
    {
      q: "Why is Fathom's free unlimited but yours isn't?",
      a: "Fathom's free is funded by $20M+ in Series A capital — it's a customer-acquisition weapon, not a sustainable tier. When the funding runs out, pricing changes. We chose 300 min/mo because it's sustainable at $0.40/user/mo cost. You're not the product.",
    },
    {
      q: "Can I migrate from Fathom?",
      a: "Yes — export from Fathom, upload to Gauge. We accept MP3, WAV, M4A, WebM. For bulk migration email hello@usegauge.com.",
    },
  ],
};

export default function Page() {
  return <VsComparisonPage data={data} />;
}

export function generateMetadata(): Metadata {
  return {
    title: data.metaTitle,
    description: data.metaDescription,
    alternates: { canonical: "https://usegauge.com/vs/fathom" },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url: "https://usegauge.com/vs/fathom",
    },
  };
}
