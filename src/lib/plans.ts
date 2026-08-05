export type PlanTier = "free" | "pro" | "business" | "enterprise";

/**
 * Reads a Paddle price ID from env. We must NOT throw at module load time —
 * Next.js evaluates route modules during `next build` ("Collecting page data"),
 * so a throw here would crash the build in environments where Paddle env vars
 * aren't present (e.g. CI). Instead we return a placeholder and warn. A runtime
 * check via `assertPriceIdsConfigured()` guards actual checkout/webhook use.
 */
function requirePriceId(envKey: string, placeholder: string): string {
  const value = process.env[envKey];
  if (value && value.trim().length > 0) return value.trim();
  console.warn(
    `[plans.ts] ${envKey} not set — using placeholder "${placeholder}". ` +
    `Checkout/webhooks will not work until a real Paddle price ID is configured.`
  );
  return placeholder;
}

const PADDLE_PRICE_ENV_KEYS = [
  "PADDLE_PRO_PRICE_ID",
  "PADDLE_PRO_PRICE_ID_ANNUAL",
  "PADDLE_BUSINESS_PRICE_ID",
  "PADDLE_BUSINESS_PRICE_ID_ANNUAL",
] as const;

/** Throws a clean error if any Paddle price ID is missing. Call at request time. */
export function assertPriceIdsConfigured(): void {
  const missing = PADDLE_PRICE_ENV_KEYS.filter(
    (k) => !process.env[k] || process.env[k]!.trim().length === 0
  );
  if (missing.length > 0) {
    throw new Error(
      `[plans.ts] Missing required Paddle env vars: ${missing.join(", ")}. ` +
      `Configure them in Vercel or Paddle checkout/webhooks will fail.`
    );
  }
}

export type FeatureId =
  | "upload_audio"
  | "browser_recording"
  | "live_transcription"
  | "ai_summary"
  | "action_items"
  | "speaker_diarization"
  | "crm_sync"
  | "crm_sync_hubspot"
  | "crm_sync_salesforce"
  | "crm_sync_teams"
  | "slack_integration"
  | "ai_chat"
  | "analytics_dashboard"
  | "analytics_deep"
  | "competitive_intelligence"
  | "competitive_alerts"
  | "team_workspace"
  | "team_members_5"
  | "team_members_unlimited"
  | "api_access"
  | "webhooks"
  | "sso_saml"
  | "hipaa_compliance"
  | "custom_ai_training"
  | "priority_support"
  | "dedicated_manager"
  | "video_recording"
  | "multi_language"
  | "unlimited_uploads"
  | "unlimited_minutes"
  | "zapier"
  | "export_json"
  | "export_csv"
  | "byok";

export interface PlanConfig {
  tier: PlanTier;
  name: string;
  price: number;
  priceLabel: string;
  period: "month" | "year" | "once";
  paddlePriceId?: string;
  paddlePriceIdAnnual?: string;
  features: Partial<Record<FeatureId, boolean | number>>;
  uploadLimit: number | "unlimited";
  minuteLimit: number | "unlimited";
  callDurationLimit: number; // minutes
  teamMemberLimit: number | "unlimited";
  fileImportLimit: number | "unlimited";
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    tier: "free",
    name: "Free",
    price: 0,
    priceLabel: "Free",
    period: "once",
    uploadLimit: 5,
    minuteLimit: 300,
    callDurationLimit: 30,
    teamMemberLimit: 1,
    fileImportLimit: 3,
    features: {
      upload_audio: true,
      ai_summary: true,
      action_items: true,
      speaker_diarization: true,
      export_json: true,
      analytics_dashboard: true,
      competitive_intelligence: false,
      competitive_alerts: false,
      browser_recording: false,
      live_transcription: false,
      crm_sync: false,
      slack_integration: false,
      ai_chat: false,
      team_workspace: false,
      api_access: false,
      multi_language: false,
      unlimited_uploads: false,
      unlimited_minutes: false,
      priority_support: false,
      byok: false,
    },
  },
  pro: {
    tier: "pro",
    name: "Pro",
    price: 900, // $9 in cents
    priceLabel: "$9",
    period: "month",
    paddlePriceId: requirePriceId("PADDLE_PRO_PRICE_ID", "pri_pro_monthly"),
    paddlePriceIdAnnual: requirePriceId("PADDLE_PRO_PRICE_ID_ANNUAL", "pri_pro_annual"),
    uploadLimit: "unlimited",
    minuteLimit: 1200,
    callDurationLimit: 90,
    teamMemberLimit: 5,
    fileImportLimit: 20,
    features: {
      upload_audio: true,
      ai_summary: true,
      action_items: true,
      speaker_diarization: true,
      export_json: true,
      analytics_dashboard: true,
      competitive_intelligence: true,
      competitive_alerts: true,
      browser_recording: true,
      live_transcription: true,
      crm_sync: true,
      crm_sync_hubspot: true,
      crm_sync_salesforce: true,
      crm_sync_teams: true,
      slack_integration: true,
      ai_chat: true,
      team_workspace: true,
      team_members_5: true,
      api_access: true,
      priority_support: true,
      multi_language: false,
      unlimited_uploads: false,
      unlimited_minutes: false,
      byok: true,
    },
  },
  business: {
    tier: "business",
    name: "Business",
    price: 2900,
    priceLabel: "$29",
    period: "month",
    paddlePriceId: requirePriceId("PADDLE_BUSINESS_PRICE_ID", "pri_business_monthly"),
    paddlePriceIdAnnual: requirePriceId("PADDLE_BUSINESS_PRICE_ID_ANNUAL", "pri_business_annual"),
    uploadLimit: "unlimited",
    minuteLimit: 6000,
    callDurationLimit: 240,
    teamMemberLimit: "unlimited",
    fileImportLimit: "unlimited",
    features: {
      upload_audio: true,
      ai_summary: true,
      action_items: true,
      speaker_diarization: true,
      export_json: true,
      analytics_dashboard: true,
      analytics_deep: true,
      competitive_intelligence: true,
      competitive_alerts: true,
      browser_recording: true,
      live_transcription: true,
      crm_sync: true,
      crm_sync_hubspot: true,
      crm_sync_salesforce: true,
      crm_sync_teams: true,
      slack_integration: true,
      ai_chat: true,
      team_workspace: true,
      team_members_unlimited: true,
      api_access: true,
      webhooks: true,
      zapier: true,
      priority_support: true,
      multi_language: true,
      unlimited_uploads: true,
      unlimited_minutes: true,
      video_recording: true,
      byok: true,
    },
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    price: 0,
    priceLabel: "Custom",
    period: "month",
    uploadLimit: "unlimited",
    minuteLimit: "unlimited",
    callDurationLimit: 480,
    teamMemberLimit: "unlimited",
    fileImportLimit: "unlimited",
    features: {
      upload_audio: true,
      ai_summary: true,
      action_items: true,
      speaker_diarization: true,
      export_json: true,
      analytics_dashboard: true,
      analytics_deep: true,
      competitive_intelligence: true,
      competitive_alerts: true,
      browser_recording: true,
      live_transcription: true,
      crm_sync: true,
      crm_sync_hubspot: true,
      crm_sync_salesforce: true,
      crm_sync_teams: true,
      slack_integration: true,
      ai_chat: true,
      team_workspace: true,
      team_members_unlimited: true,
      api_access: true,
      webhooks: true,
      zapier: true,
      sso_saml: true,
      hipaa_compliance: true,
      custom_ai_training: true,
      dedicated_manager: true,
      priority_support: true,
      multi_language: true,
      unlimited_uploads: true,
      unlimited_minutes: true,
      video_recording: true,
      byok: true,
    },
  },
};

export function getPlan(tier: PlanTier | string): PlanConfig {
  return PLANS[tier as PlanTier] || PLANS.free;
}

export function hasFeature(plan: PlanConfig, feature: FeatureId): boolean {
  const val = plan.features[feature];
  return val === true;
}

export function getFeatureLimit(plan: PlanConfig, feature: FeatureId): number | "unlimited" | false {
  const val = plan.features[feature];
  if (val === true) return "unlimited";
  if (val === false) return false;
  if (typeof val === "number") return val;
  return false;
}
