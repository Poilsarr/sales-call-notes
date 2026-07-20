import type { FeatureId } from "@/lib/plans";

export interface Tier {
  name: "Starter" | "Pro" | "Advanced";
  description: string;
  features: string[];
  /** Paddle price IDs — month is the monthly price, year is the annual price. */
  priceId: { month: string; year: string };
}

/**
 * Editable pricing tiers. Price IDs are read from env (sandbox IDs by
 * default). The Free tier is handled separately and is not Paddle-powered.
 *
 * To add/edit a tier, change the name/description/features/priceId here.
 * Prices shown to users come from Paddle's PricePreview — never hard-coded
 * or re-formatted on the frontend.
 */
export const TIERS: Tier[] = [
  {
    name: "Starter",
    description: "For solo SDRs getting started. One price — bring your whole team.",
    features: [
      "300 transcription minutes/mo",
      "AI summaries & action items",
      "Speaker identification",
      "Basic search & history",
      "JSON export",
      "Community support",
    ],
    priceId: {
      month: process.env.PADDLE_PRO_PRICE_ID || "pri_starter_month",
      year: process.env.PADDLE_PRO_PRICE_ID_ANNUAL || "pri_starter_year",
    },
  },
  {
    name: "Pro",
    description: "For serious SDRs who need CRM integration. Scales with your team.",
    features: [
      "1,200 transcription minutes/mo",
      "Unlimited AI summaries",
      "CRM export (HubSpot, Salesforce)",
      "Advanced analytics dashboard",
      "Priority support",
      "90-minute call limit",
      "Team workspace (up to 5)",
    ],
    priceId: {
      month: process.env.PADDLE_PRO_PRICE_ID || "pri_pro_month",
      year: process.env.PADDLE_PRO_PRICE_ID_ANNUAL || "pri_pro_year",
    },
  },
  {
    name: "Advanced",
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
    priceId: {
      month: process.env.PADDLE_BUSINESS_PRICE_ID || "pri_advanced_month",
      year: process.env.PADDLE_BUSINESS_PRICE_ID_ANNUAL || "pri_advanced_year",
    },
  },
];

/** Feature IDs per tier, for gating checks elsewhere (unused by the loader). */
export const TIER_FEATURES: Record<Tier["name"], FeatureId[]> = {
  Starter: ["ai_summary", "action_items", "speaker_diarization", "export_json"],
  Pro: ["crm_sync", "analytics_dashboard", "team_workspace", "api_access"],
  Advanced: ["crm_sync_teams", "unlimited_minutes", "unlimited_uploads", "sso_saml"],
};
