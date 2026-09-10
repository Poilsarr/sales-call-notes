export type SandboxProvider = "hubspot" | "salesforce" | "teams" | "slack" | "google_calendar";

import { getSecret } from "@/lib/secrets";

export type SandboxCredentials = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: readonly string[];
  notesUrl: string;
};

const SANDBOX_VALUES: Record<SandboxProvider, SandboxCredentials> = {
  hubspot: {
    clientId: "dev-hubspot-client-id",
    clientSecret: "dev-hubspot-client-secret",
    redirectUri: "http://localhost:3000/integrations",
    scope: [
      "crm.objects.contacts.read",
      "crm.objects.contacts.write",
      "crm.objects.deals.read",
      "crm.objects.deals.write",
    ],
    notesUrl: "https://developers.hubspot.com/",
  },
  salesforce: {
    clientId: "dev-salesforce-client-id",
    clientSecret: "dev-salesforce-client-secret",
    redirectUri: "http://localhost:3000/integrations",
    scope: ["api", "refresh_token", "offline_access"],
    notesUrl: "https://developer.salesforce.com/",
  },
  teams: {
    clientId: "dev-teams-client-id",
    clientSecret: "dev-teams-client-secret",
    redirectUri: "http://localhost:3000/integrations",
    scope: [
      "offline_access",
      "User.Read",
      "Calendars.ReadWrite",
      "OnlineMeetings.ReadWrite",
    ],
    notesUrl: "https://portal.azure.com/",
  },
  slack: {
    clientId: "dev-slack-client-id",
    clientSecret: "dev-slack-client-secret",
    redirectUri: "http://localhost:3000/api/integrations/slack/callback",
    scope: [
      "chat:write",
      "chat:write.public",
      "users:read",
      "commands",
      "im:write",
    ],
    notesUrl: "https://api.slack.com/apps",
  },
  google_calendar: {
    clientId: "dev-google-client-id",
    clientSecret: "dev-google-client-secret",
    redirectUri: "http://localhost:3000/api/integrations/google/callback",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    notesUrl: "https://console.cloud.google.com/",
  },
};

let warned = false;

export function isDevSandboxEnabled(): boolean {
  // Demo mode for screenshots / investor previews: set DEMO_INTEGRATIONS=true
  // in Vercel to make HubSpot/Salesforce/Teams/Slack appear as "Live" and
  // allow one-click Connect with fake tokens (no real OAuth). Remove the env
  // var to restore honest "Not configured" badges in production.
  if (process.env.DEMO_INTEGRATIONS === "true") return true;
  // Local development only. Vercel sets VERCEL=1 in every deployed
  // environment (including preview/development builds), so requiring
  // NODE_ENV=development AND VERCEL !== "1" guarantees the fake
  // credentials never leak into a deployed build.
  return process.env.NODE_ENV === "development" && process.env.VERCEL !== "1";
}

export function getDevSandboxCredentials(
  provider: SandboxProvider,
): SandboxCredentials | null {
  if (!isDevSandboxEnabled()) {
    return null;
  }
  // Demo mode should NOT hijack Google Calendar when real credentials are
  // present — keep the real OAuth flow for the one CRM that is already
  // working (project 347876872408). Demo only fakes the other 4.
  if (process.env.DEMO_INTEGRATIONS === "true" && provider === "google_calendar") {
    const hasRealGoogle = Boolean(getSecret("GOOGLE_CLIENT_ID") && getSecret("GOOGLE_CLIENT_SECRET"));
    if (hasRealGoogle) return null;
  }
  if (!warned) {
    warned = true;
    console.warn(
      "[dev-sandbox] Using fake OAuth credentials (demo/local). " +
        "Real HUBSPOT/SALESFORCE/TEAMS env vars are ignored. " +
        "See docs/INTEGRATIONS.md for production setup.",
    );
  }
  return SANDBOX_VALUES[provider];
}

export function getDevSandboxProviders(): readonly SandboxProvider[] {
  return Object.keys(SANDBOX_VALUES) as SandboxProvider[];
}
