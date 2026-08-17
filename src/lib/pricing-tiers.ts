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

// ---------------------------------------------------------------------------
// Upgrade prompt helpers (env-free; safe for client bundles).
//
// The in-app upgrade modal (src/components/upgrade-prompt.tsx) is a client
// component, so it must never read PADDLE_* env vars (undefined in the
// browser) or import lib/plans.ts (its requirePriceId() falls back to
// placeholder IDs like `pri_pro_monthly`). Real price IDs are resolved
// server-side and injected as the `priceIds` prop. The static plan metadata
// below mirrors lib/plans.ts's feature maps — keep the two in sync.
// ---------------------------------------------------------------------------

/** Paid tiers the upgrade modal can sell. */
export type UpgradePlanTier = "pro" | "business";

/** Real Paddle price IDs injected by the server (empty = not configured). */
export interface UpgradePriceIds {
  proMonth: string;
  proYear: string;
  businessMonth: string;
  businessYear: string;
}

/** Billing-cycle selector, mirroring pricing-client's priceIdForCycle. */
export type BillingCycle = "monthly" | "annual";

export function priceIdForCycle(
  priceIds: UpgradePriceIds,
  tier: UpgradePlanTier,
  cycle: BillingCycle
): string {
  if (tier === "business") {
    return cycle === "annual" ? priceIds.businessYear : priceIds.businessMonth;
  }
  return cycle === "annual" ? priceIds.proYear : priceIds.proMonth;
}

/** Display metadata for the upgrade modal's paid-tier cards. */
export const UPGRADE_PLAN_META: Record<
  UpgradePlanTier,
  { name: string; priceLabel: string; priceCents: number }
> = {
  pro: { name: "Pro", priceLabel: "$9", priceCents: 900 },
  business: { name: "Business", priceLabel: "$29", priceCents: 2900 },
};

/** Features Pro includes (from lib/plans.ts pro.features === true). */
const PRO_FEATURES: ReadonlySet<FeatureId> = new Set<FeatureId>([
  "upload_audio",
  "ai_summary",
  "action_items",
  "speaker_diarization",
  "export_json",
  "analytics_dashboard",
  "competitive_intelligence",
  "competitive_alerts",
  "browser_recording",
  "live_transcription",
  "crm_sync",
  "crm_sync_hubspot",
  "crm_sync_salesforce",
  "crm_sync_teams",
  "slack_integration",
  "ai_chat",
  "team_workspace",
  "team_members_5",
  "api_access",
  "priority_support",
  "byok",
]);

/** Features only Business includes (from lib/plans.ts business.features). */
const BUSINESS_ONLY_FEATURES: ReadonlySet<FeatureId> = new Set<FeatureId>([
  "analytics_deep",
  "team_members_unlimited",
  "webhooks",
  "zapier",
  "multi_language",
  "unlimited_uploads",
  "unlimited_minutes",
  "video_recording",
]);

/** Features the Free tier includes (from lib/plans.ts free.features). */
const FREE_FEATURES: ReadonlySet<FeatureId> = new Set<FeatureId>([
  "upload_audio",
  "ai_summary",
  "action_items",
  "speaker_diarization",
  "export_json",
  "analytics_dashboard",
]);

/** Minimum paid tier whose feature set includes the feature. */
export function tierForFeature(feature: FeatureId): UpgradePlanTier {
  if (!PRO_FEATURES.has(feature) && BUSINESS_ONLY_FEATURES.has(feature)) {
    return "business";
  }
  return "pro";
}

/** Whether a paid tier's feature set includes the feature. */
export function tierHasFeature(tier: UpgradePlanTier, feature: FeatureId): boolean {
  if (tier === "business") {
    return PRO_FEATURES.has(feature) || BUSINESS_ONLY_FEATURES.has(feature);
  }
  return PRO_FEATURES.has(feature);
}

/** Whether a user's plan (DB string like "FREE"/"PRO"/"business") covers the feature. */
export function planCoversFeature(plan: string, feature: FeatureId): boolean {
  const normalized = plan.toLowerCase();
  if (normalized === "free") return FREE_FEATURES.has(feature);
  if (normalized === "pro") return PRO_FEATURES.has(feature);
  if (normalized === "business") {
    return PRO_FEATURES.has(feature) || BUSINESS_ONLY_FEATURES.has(feature);
  }
  if (normalized === "enterprise") return true;
  return false;
}
