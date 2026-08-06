import type { Metadata } from "next";
import { VsComparisonPage, type ComparisonData } from "@/components/vs-comparison";



const data: ComparisonData = {
  slug: "otter-ai",
  competitorName: "Otter.ai",
  competitorTagline: "The default meeting notetaker",
  competitorFounded: "2016",
  competitorFunding: "$70M+ raised",
  competitorUsers: "10M+ users",
  metaTitle: "Otter.ai Alternative: Gauge — The Honest 2026 Comparison",
  metaDescription:
    "Otter got sued in 2025 for recording meetings without consent. Gauge never auto-joins. Flat $9/mo (not per-seat), 300 free minutes/mo, BANT/MEDDIC extraction built in.",
  heroHeadline: "The Otter.ai alternative for people who don't want a bot in their meeting.",
  heroSubhead:
    "Otter is a great product — 10M+ users, Zoom partnership, 9 years of polish. But in 2025 they were sued for recording meetings without consent. We built Gauge for the people who read that headline and thought: never again.",
  talkingPoints: [
    "Otter got sued in 2025 for recording meetings without consent. We won't. Gauge never auto-joins — you upload the recording, you stay in control.",
    "Otter's free tier gives you 300 minutes a month and 3 lifetime imports — so does ours. The difference: their bot auto-joins your calls, ours never joins.",
    "Otter charges $20/seat/month for Business. We charge $9 flat. 5 reps on Otter Business = $100/mo. 5 reps on us = $9/mo.",
    "Otter's AI summary is generic. Ours extracts BANT, MEDDIC, action items with owners and deadlines — built for sales.",
    "Otter auto-joins your meetings as a bot participant. We don't. You record, you upload, we analyze.",
  ],
  tldr: [
    { label: "Free tier minutes", us: "300/mo", them: "300/mo" },
    { label: "Free tier imports", us: "3 lifetime", them: "3 lifetime" },
    { label: "Pro price", us: "$9/mo flat", them: "$6.67/mo (annual)" },
    { label: "Business price (5 seats)", us: "$29/mo flat", them: "$100/mo ($20/seat × 5)" },
    { label: "Bot joins meetings?", us: "Never", them: "Yes, auto-joins" },
    { label: "Privacy stance", us: "GDPR-first, no auto-join", them: "2025 consent lawsuit" },
    { label: "AI summary type", us: "BANT/MEDDIC sales-trained", them: "Generic" },
    { label: "Languages", us: "30+ via Whisper", them: "English-first" },
  ],
  competitorWins: [
    "10M+ users — network effects, your team probably already has an account",
    "Zoom App Marketplace partnership since 2018 — default app for millions",
    "Mobile app is the best in class — polished over 9 years",
    "OtterPilot live auto-join is genuinely useful for hands-free capture",
    "Education vertical (Otter for Education) is sticky in colleges",
    "Massive training data moat — custom Whisper fine-tune on millions of hours",
  ],
  ourWins: [
    {
      title: "Flat-rate pricing, not per-seat",
      detail: "5 reps on Otter Business = $100/mo. 5 reps on Gauge Business = $29/mo flat. Per-seat pricing is hostile to small teams.",
    },
    {
      title: "Privacy-first by default",
      detail: "We never auto-join meetings. We don't train on your audio. GDPR-ready, no bot in the room. Otter cannot say this — their 2025 lawsuit is the proof.",
    },
    {
      title: "Sales-trained AI extraction",
      detail: "BANT, MEDDIC, SPICED, GPCTBA scorecards out of the box. Action items with owners and deadlines. Otter gives you a generic summary.",
    },
    {
      title: "Same free tier, but your recordings stay private",
      detail: "Both give 300 minutes and 3 lifetime imports. The difference: Otter's bot auto-joins your meetings — and their 2025 lawsuit shows where that leads. We never join; you upload, you stay in control.",
    },
    {
      title: "Vertical specialization",
      detail: "Built for recruiters, consultants, founders, therapists, journalists — not just generic meeting notes. Otter is horizontal.",
    },
  ],
  pricing: [
    { tier: "Free", us: "$0 — 300 min/mo, 3 lifetime imports", them: "$0 — 300 min/mo, 3 lifetime imports" },
    { tier: "Pro", us: "$9/mo flat (or $7.50 annual)", them: "$6.67/mo annual ($13.59 monthly)" },
    { tier: "Business (5 seats)", us: "$29/mo flat", them: "~$100/mo ($20/seat × 5)" },
    { tier: "Enterprise", us: "Custom — SSO, HIPAA, on-prem", them: "Custom — SLA, security review" },
  ],
  whoShouldPickCompetitor: [
    "You already have 50+ people on Otter and switching cost is too high",
    "Your team lives in Zoom and OtterPilot's auto-join is core to your workflow",
    "You need a polished native mobile app today (we're web-first)",
    "You're in education and use Otter for Education integrations",
  ],
  whoShouldPickUs: [
    "You care about privacy — Otter's 2025 lawsuit made you uneasy",
    "You have a small team and per-seat pricing hurts ($100/mo for 5 seats vs $9 flat)",
    "You're in sales and want BANT/MEDDIC extraction, not generic summaries",
    "You're a recruiter, consultant, founder, therapist, or journalist — we built for you",
    "You don't want a bot in your meeting, ever",
    "You need 30+ languages, not just English",
  ],
  faq: [
    {
      q: "Is Gauge really cheaper than Otter?",
      a: "On the Free tier, no — both give 300 min/mo. On Business, yes — dramatically. 5 reps on Otter Business costs ~$100/mo ($20/seat). 5 reps on our Business plan is $29/mo flat. The bigger your team, the bigger the gap.",
    },
    {
      q: "Can I import my Otter history?",
      a: "Yes — export from Otter as audio or text, then upload to Gauge. We accept MP3, WAV, M4A, WebM. If you have a custom migration need, email hello@usegauge.com.",
    },
    {
      q: "Does Gauge auto-join meetings like OtterPilot?",
      a: "No. That's the wedge. OtterPilot auto-joins as a bot participant — which is what triggered their 2025 consent lawsuit. We never auto-join. You record, you upload, we analyze. You stay in control of every recording.",
    },
    {
      q: "Why is your Pro tier $9 flat when Otter's is $6.67?",
      a: "Otter's $6.67 is per-seat, billed annually. Our $9 is flat — covers your whole 5-seat team. On a 5-person team, Otter is $33/mo vs our $9/mo. The flat-rate model is the whole point.",
    },
    {
      q: "Do you have Otter's mobile app?",
      a: "Not yet — we're web-first and mobile-responsive. Otter's native iOS/Android is the best in category and we won't pretend otherwise. If mobile capture is your #1 need, Otter wins today. We're shipping native apps in 2026.",
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
    alternates: { canonical: "https://usegauge.com/vs/otter-ai" },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url: "https://usegauge.com/vs/otter-ai",
    },
  };
}
