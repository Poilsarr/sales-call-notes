import type { Metadata } from "next";
import { VsComparisonPage, type ComparisonData } from "@/components/vs-comparison";



const data: ComparisonData = {
  slug: "gong",
  competitorName: "Gong",
  competitorTagline: "Conversation intelligence platform",
  competitorFounded: "2015 (reported)",
  competitorFunding: "Reported $250M+ raised",
  competitorUsers: "6,500+ G2 reviews (4.8/5)",
  metaTitle: "Gong Alternative: Gauge — Flat $9 vs $1,300+/user/yr (2026)",
  metaDescription:
    "Gong's Foundations tier: $1,300–$1,600/user/yr (reported) + platform fees. Gauge: $9 flat for 5 seats. No platform fee, no seat minimums. 300 free min/mo.",
  heroHeadline: "The Gong alternative without the $1,300+/user/yr price tag.",
  heroSubhead:
    "Gong built the category — deep deal intelligence, forecasts, live coaching, and a CRM ecosystem enterprises trust. They also charge reported rates of $1,300–$1,600/user/yr, plus a platform fee, plus add-on modules, with reported 5–8% renewal escalations built into contracts. Gauge is a flat $9/mo for 5 seats, $29/mo flat for unlimited. No platform fee. No seat minimums. No add-on bundles.",
  talkingPoints: [
    "Gong's Foundations tier is reported at $1,300–$1,600/user/yr, plus a platform fee (reported $5,000–$15,000+/yr), plus onboarding (reported $2,000–$10,000+). Gauge is $9/mo flat for 5 seats — no platform fee, no onboarding fee.",
    "Gong's March 2025 restructure unbundled Forecast, Engage, Enable, and Data Cloud into paid add-ons — public cost analyses report effective price increases of 25–56% since 2023. Our price is the price: no add-on bundles, no repricing events.",
    "Gong bills reported 5–8% annual escalations and charges for provisioned (inactive) seats. Gauge is flat — you pay the same for 5 active reps or 5 seats where half the team is on vacation.",
    "Gong is built around live capture through its meeting integrations. Gauge accepts uploads of recordings you already have — MP3, WAV, M4A, WebM — so existing history isn't locked out.",
    "Gong's depth is real — it's the category-defining enterprise platform. We're built for small teams, recruiters, founders, and consultants who need BANT/MEDDIC-grade extraction without enterprise RevOps spend.",
  ],
  tldr: [
    { label: "Free tier", us: "300 min/mo, 3 imports", them: "None (reported)" },
    { label: "Per-user price", us: "$9/mo flat (up to 5 seats)", them: "$1,300–$1,600/user/yr (reported)" },
    { label: "Platform fee", us: "None", them: "$5,000–$15,000+/yr (reported)" },
    { label: "Pricing model", us: "Flat-rate, one price", them: "Per-seat + platform fee + add-ons" },
    { label: "Renewal escalations", us: "None — flat forever", them: "5–8%/yr (reported)" },
    { label: "Add-on modules", us: "Everything in one price", them: "Forecast, Engage, Enable, Data Cloud sold separately" },
    { label: "Capture model", us: "Upload any recording", them: "Live capture via meeting integrations" },
    { label: "Best for", us: "Small teams, indie sellers", them: "Enterprise RevOps teams" },
  ],
  competitorWins: [
    "The category-defining brand — \"Gong\" is the word buyers search for conversation intelligence",
    "Deep deal intelligence: forecasts, deal risk, MEDDIC scoring at enterprise scale (reported)",
    "Live meeting coaching — real-time prompts while reps are on the call (reported)",
    "Org-wide capture through meeting integrations (reportedly including Zoom, Teams, Meet, telephony)",
    "Serious enterprise trust: 6,500+ G2 reviews at 4.8/5, security review (reportedly SOC 2)",
    "Revenue platform: Engage, Enable, and Data Cloud extend well beyond notes",
  ],
  ourWins: [
    {
      title: "Flat $9 vs $1,300+/user/yr",
      detail:
        "Gong Foundations is reported at $1,300–$1,600/user/yr plus a platform fee. A 5-seat deployment lands around $12K+/yr first year (reported ranges). 5 seats on Gauge Business: $29/mo — $348/yr flat, platform fee included. Same conversation intelligence, none of the enterprise tax.",
    },
    {
      title: "No platform fee, no seat minimums, no add-on bundles",
      detail:
        "Gong charges a platform fee (reported $5,000–$15,000+/yr), onboarding (reported $2,000–$10,000+), and sells Forecast/Engage/Enable/Data Cloud as paid add-ons — public cost analyses report 25–56% effective increases since 2023. Gauge is one price. Everything in the plan is in the plan.",
    },
    {
      title: "No renewal escalation, no inactive-seat billing",
      detail:
        "Gong contracts reportedly build in 5–8% annual increases and bill for provisioned seats. Gauge is flat — your rate doesn't climb every renewal, and you never pay for seats that aren't selling.",
    },
    {
      title: "Bring the recordings you already have",
      detail:
        "Gong is built around live capture through its meeting integrations. Gauge accepts uploads — MP3, WAV, M4A, WebM — so the calls you recorded before adopting us aren't locked out of your history.",
    },
    {
      title: "Sales-grade extraction at small-team prices",
      detail:
        "Gong's depth is real, but it's priced for 100-person RevOps orgs. Gauge ships BANT/MEDDIC extraction, a 0–100 call score, action items, and CRM sync (HubSpot, Salesforce) at $29/mo flat — for the founder, the recruiter, the consultant.",
    },
  ],
  pricing: [
    { tier: "Free", us: "$0 — 300 min/mo, 3 lifetime imports", them: "No free tier (reported)" },
    { tier: "Foundations (1 user)", us: "$9/mo flat", them: "$1,300–$1,600/user/yr + platform fee (reported)" },
    { tier: "Foundations (5 users)", us: "$9/mo flat", them: "≈$12K+/yr first year incl. platform fee (reported)" },
    { tier: "Business (unlimited seats)", us: "$29/mo flat", them: "Enterprise contract only (reported)" },
    { tier: "Enterprise", us: "Custom — SSO, HIPAA", them: "Custom + paid add-ons (Forecast, Engage, Enable, Data Cloud)" },
  ],
  pricingFootnote:
    "Gong does not publish pricing. Their figures above are reported ranges from public cost analyses (Revenue.io, TechnologyInSales, July 2026) and G2 reviewer reports; Gauge's figures come from our published plans. Spotted a mistake? Email hello@usegauge.com.",
  whoShouldPickCompetitor: [
    "You run a 50+ person RevOps org that lives on forecasts, deal risk, and MEDDIC scoring (reported)",
    "You need Gong's reported live coaching prompts while reps are on the call",
    "You want org-wide capture across Zoom, Teams, Meet, and telephony (reportedly native)",
    "Your procurement requires a full enterprise security review (SOC 2, reported)",
    "The budget is approved and the platform fee is a rounding error",
  ],
  whoShouldPickUs: [
    "You have a small team and per-seat pricing at $1,300+/user/yr is absurd for your stage",
    "You want price predictability — no platform fee, no add-on bundles, no renewal escalations",
    "You have existing recordings you want analyzed without re-recording through live capture",
    "You want BANT/MEDDIC extraction and a call score without enterprise RevOps spend",
    "You're a founder, recruiter, consultant, or indie seller — not a 100-person sales org",
  ],
  faq: [
    {
      q: "Is Gong really $1,300+/user/yr?",
      a: "Gong doesn't publish pricing, so these are reported ranges from public cost analyses (Revenue.io's \"What does Gong actually cost\" and TechnologyInSales, both 2026). Foundations is reported at $1,300–$1,600/user/yr, plus a platform fee of $5,000–$15,000+/yr, plus onboarding. G2's most common complaint in negative reviews is cost. If you're in an active Gong contract, your actual number is in your order form — the ranges are what reviewers report.",
    },
    {
      q: "Does Gauge have Gong's deal intelligence?",
      a: "No — and we won't pretend otherwise. Gong's forecasts, deal risk, and live coaching are genuinely best-in-class for enterprise RevOps. Gauge ships BANT/MEDDIC extraction, a 0–100 call score, action items, and CRM sync at $29/mo flat. If you need Gong-scale revenue analytics, Gong is the right call. If you need sales-grade extraction for a small team, we win on everything that matters at your stage.",
    },
    {
      q: "Is the 25–56% price-increase claim real?",
      a: "It's reported, not official. Multiple public cost analyses (Revenue.io, 2026) report that Gong's March 2025 restructuring — unbundling Forecast, Engage, Enable, and Data Cloud into paid add-ons — raised effective costs by 25–56% for existing customers since 2023. The G2 review pattern supports it: forced bundling and aggressive add-on pushes are common complaints in negative reviews.",
    },
    {
      q: "Does Gauge need to join my meetings like Gong?",
      a: "No. Gong is built around live capture through its meeting integrations (reported). Gauge is upload-only — you record with whatever you already use, upload the file, and we analyze it. No bot, no consent dialog in front of your prospect, nothing in the room.",
    },
    {
      q: "Can I migrate my Gong history?",
      a: "Yes — export audio from Gong, upload to Gauge. We accept MP3, WAV, M4A, WebM. For bulk migration, email hello@usegauge.com.",
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
    alternates: { canonical: "https://usegauge.com/vs/gong" },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url: "https://usegauge.com/vs/gong",
    },
  };
}
