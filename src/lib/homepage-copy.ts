/**
 * Centralized homepage copy (FRONTPAGE-PITCH-PLAN §6: fix hardcoded copy drift).
 *
 * Single source of truth for hero + problem + proof strings. Pricing numbers
 * here are pinned against src/lib/plans.ts by src/test/homepage-copy.test.ts —
 * a plan change that isn't mirrored here fails the test instead of silently
 * lying on the marketing page.
 */

export interface HeroVariant {
  key: "A" | "B" | "C";
  label: string;
  h1: string;
}

export const HERO_VARIANTS: HeroVariant[] = [
  {
    key: "A",
    label: "incumbent",
    h1: "Know the second a rival enters your deal.",
  },
  {
    key: "B",
    label: "explicit What (default)",
    h1: "AI notetaker for sales calls that flags virtual competitors.",
  },
  {
    key: "C",
    label: "direct",
    h1: "Stop writing notes. Never miss a rival mention again.",
  },
];

export interface ProblemBullet {
  title: string;
  desc: string;
}

export const HOMEPAGE_COPY = {
  eyebrow: "Gauge — AI sales-call notetaker",
  /** Rendered H1: variant B (explicit What-line). A + C kept in HERO_VARIANTS for A/B. */
  heroH1: "AI notetaker for sales calls that flags virtual competitors.",
  heroH1Variant: "B" as const,
  /**
   * Virtual-competitor framing: Gauge is the always-on rival radar sitting
   * inside every call — it hears the rival, proves it with the exact quote,
   * and pings Slack before the deal drifts.
   */
  heroH1Highlight: "virtual competitors",
  // Payer-voiced — management buyer, not rep
  heroSub:
    "Meet your virtual competitor radar: see every sales call your team makes — what customers said, which rivals came up, and what happens next. Your reps just talk. Gauge handles the notes, flags the risks in Slack, and shows you where to coach.",
  heroManagerBullets: [
    "Know what's really happening in every deal — short summaries with owners and dates.",
    "Never get blindsided by a rival — your virtual competitor flag lands in Slack with the exact quote, speaker, and call.",
    "Coach with evidence — talk time, mood, missed steps per rep.",
  ],
  betaLine: "Currently in private beta",
  ctas: {
    primary: "Start free",
    secondary: "Watch demo (0:25)",
    secondaryHref: "#demo",
    tertiary: "See pricing →",
    tertiaryHref: "/pricing",
  },
  proof: {
    betaTeams: "12 beta teams",
    calls: "500+ calls",
    quote: "Gauge caught a Gong mention I missed in a 40-minute discovery call.",
    attribution: "Alex R., SDR, beta tester",
  },
  problem: {
    eyebrow: "The problem",
    title: "The call ends. The details leak out.",
    bullets: [
      {
        title: "You miss the one line that matters",
        desc: "A rival gets named 30 minutes into discovery and nobody writes it down. One beta tester missed a Gong mention buried in a 40-minute call.",
      },
      {
        title: "Notes eat ~5 hours a week",
        desc: "Rewriting every call into summaries, owners, and dates steals selling time — usually on Friday afternoon.",
      },
      {
        title: "Follow-ups slip",
        desc: "The procurement one-pager and the Q3 review invite go out late, or never. Deals stall while memory fades.",
      },
    ] as ProblemBullet[],
  },
  pricing: {
    /** Must equal PLANS.free.minuteLimit (300). */
    freeMinutes: 300,
    /** Must equal PLANS.pro.minuteLimit (1200). */
    proMinutes: 1200,
    /** Must equal PLANS.pro.priceLabel ("$9"). */
    proPriceLabel: "$9",
    /** Flat-rate framing; Pro caps at 5 seats per plans.ts teamMemberLimit. */
    proPriceFlat: "$9/mo flat",
  },
} as const;
