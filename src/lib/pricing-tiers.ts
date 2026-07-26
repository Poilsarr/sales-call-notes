import type { FeatureId } from "@/lib/plans";

export interface Tier {
  name: "Free" | "Pro" | "Business" | "Enterprise";
  description: string;
  features: string[];
  /**
   * Paddle price IDs for the monthly/yearly prices. Empty for Free and
   * Enterprise (not Paddle-powered). Filled by the server from env.
   */
  priceId: { month: string; year: string };
  cta: string;
  /** Where the CTA links / what it does. */
  ctaKind: "signup" | "checkout" | "contact";
}

/**
 * Editable pricing tier definitions. Names/descriptions/features live here.
 * The actual Paddle price IDs are NOT read from env in this module — env vars
 * are server-only and would be undefined in the browser bundle. Instead the
 * server component (pricing/page.tsx) reads the real price IDs and injects
 * them via props. Prices shown to users come from Paddle's PricePreview —
 * never hard-coded or re-formatted on the frontend.
 */
export const TIER_DEFINITIONS: Omit<Tier, "priceId">[] = [
  {
    name: "Free",
    description: "Perfect for solo SDRs getting started.",
    features: [
      "300 transcription minutes/mo",
      "AI summaries & action items",
      "Speaker identification",
      "Basic search & history",
      "JSON export",
      "Community support",
    ],
    cta: "Start free",
    ctaKind: "signup",
  },
  {
    name: "Pro",
    description: "For serious SDRs who need CRM sync. $9/mo flat for the whole 5-seat workspace.",
    features: [
      "1,200 transcription minutes/mo",
      "Unlimited AI summaries",
      "CRM export (HubSpot, Salesforce)",
      "Advanced analytics dashboard",
      "Priority support",
      "90-minute call limit",
      "90-day audio storage & replay",
      "Team workspace (up to 5)",
    ],
    cta: "Subscribe",
    ctaKind: "checkout",
  },
  {
    name: "Business",
    description: "For sales teams scaling up. Flat-rate — no per-seat math.",
    features: [
      "6,000 transcription minutes/mo",
      "Microsoft Teams integration",
      "Custom AI workflows",
      "Team analytics & coaching",
      "Unlimited file imports",
      "4-hour call limit",
      "Unlimited team members",
      "Admin controls & usage logs",
      "API access",
    ],
    cta: "Subscribe",
    ctaKind: "checkout",
  },
  {
    name: "Enterprise",
    description: "For organizations with advanced needs.",
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
    ctaKind: "contact",
  },
];

/** Build the full tiers with real Paddle price IDs injected from the server. */
export function buildTiers(priceIds: {
  proMonth: string;
  proYear: string;
  businessMonth: string;
  businessYear: string;
}): Tier[] {
  return TIER_DEFINITIONS.map((def) => {
    if (def.name === "Pro") {
      return { ...def, priceId: { month: priceIds.proMonth, year: priceIds.proYear } };
    }
    if (def.name === "Business") {
      return {
        ...def,
        priceId: { month: priceIds.businessMonth, year: priceIds.businessYear },
      };
    }
    // Free + Enterprise are not Paddle-powered.
    return { ...def, priceId: { month: "", year: "" } };
  });
}
