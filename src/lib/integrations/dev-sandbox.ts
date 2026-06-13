export type SandboxProvider = "hubspot" | "salesforce" | "teams" | "slack";

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
};

let warned = false;

export function isDevSandboxEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

export function getDevSandboxCredentials(
  provider: SandboxProvider,
): SandboxCredentials | null {
  if (!isDevSandboxEnabled()) {
    return null;
  }
  if (!warned) {
    warned = true;
    console.warn(
      "[dev-sandbox] Using fake OAuth credentials. NODE_ENV=development. " +
        "Real HUBSPOT/SALESFORCE/TEAMS env vars are ignored. " +
        "See docs/INTEGRATIONS.md for production setup.",
    );
  }
  return SANDBOX_VALUES[provider];
}

export function getDevSandboxProviders(): readonly SandboxProvider[] {
  return Object.keys(SANDBOX_VALUES) as SandboxProvider[];
}
