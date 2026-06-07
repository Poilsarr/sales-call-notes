import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { getSecret } from "@/lib/secrets";
import {
  getDevSandboxCredentials,
  isDevSandboxEnabled,
  type SandboxProvider,
} from "@/lib/integrations/dev-sandbox";
import { checkRateLimit } from "@/lib/rate-limit";

type SupportedProvider = "hubspot" | "salesforce" | "teams";

type IntegrationStatus = {
  connected: boolean;
  enabled: boolean;
  syncedAt: string | null;
  configured: boolean;
};

const SUPPORTED_PROVIDERS: SupportedProvider[] = ["hubspot", "salesforce", "teams"];

function isProviderConfigured(provider: SupportedProvider): boolean {
  if (isDevSandboxEnabled()) {
    return true;
  }
  if (provider === "hubspot") {
    return Boolean(getSecret("HUBSPOT_CLIENT_ID") && getSecret("HUBSPOT_CLIENT_SECRET"));
  }
  if (provider === "salesforce") {
    return Boolean(getSecret("SALESFORCE_CLIENT_ID") && getSecret("SALESFORCE_CLIENT_SECRET"));
  }
  return Boolean(
    (getSecret("TEAMS_CLIENT_ID") || getSecret("MICROSOFT_CLIENT_ID")) &&
    (getSecret("TEAMS_CLIENT_SECRET") || getSecret("MICROSOFT_CLIENT_SECRET")),
  );
}

const HUBSPOT_SCOPES = [
  "crm.objects.contacts.read",
  "crm.objects.contacts.write",
  "crm.objects.deals.read",
  "crm.objects.deals.write",
  "crm.objects.notes.write",
];

const SALESFORCE_SCOPES = ["api", "refresh_token", "offline_access"];

const TEAMS_SCOPES = [
  "offline_access",
  "User.Read",
  "Calendars.ReadWrite",
  "OnlineMeetings.ReadWrite",
];

function isSupportedProvider(value: string | null): value is SupportedProvider {
  return value === "hubspot" || value === "salesforce" || value === "teams";
}

function getAppUrl() {
  const url = getSecret("NEXT_PUBLIC_APP_URL");
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL must be set for OAuth redirects");
  return url.replace(/\/$/, "");
}

function getRedirectUri() {
  return `${getAppUrl()}/integrations`;
}

function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

function setOAuthCookie(provider: string, nonce: string) {
  const cookieStore = cookies();
  cookieStore.set(`oauth_${provider}`, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });
}

function validateOAuthCookie(provider: string, nonce: string): boolean {
  try {
    const cookieStore = cookies();
    const stored = cookieStore.get(`oauth_${provider}`);
    if (!stored || stored.value !== nonce) return false;
    cookieStore.delete(`oauth_${provider}`);
    return true;
  } catch {
    return false;
  }
}

function getSalesforceAuthBase() {
  return (getSecret("SALESFORCE_AUTH_URL") || "https://login.salesforce.com").replace(/\/$/, "");
}

function getMicrosoftTenant() {
  return getSecret("MICROSOFT_TENANT_ID") || getSecret("TEAMS_TENANT_ID") || "common";
}

async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  return getUserByClerkId(userId);
}

async function ensureTeamId(user: { id: string; email: string; name: string | null; teamId: string | null }) {
  if (user.teamId) {
    return user.teamId;
  }

  const team = await prisma.team.create({
    data: {
      name: `${user.name ?? user.email}'s Team`,
      slug: `team-${user.id}`,
      ownerId: user.id,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      teamId: team.id,
      teamRole: "ADMIN",
    },
  });

  return team.id;
}

function serializeStatuses(
  records: Array<{ provider: string; enabled: boolean; syncedAt: Date | null; config: string | null }>,
): Record<SupportedProvider, IntegrationStatus> {
  return SUPPORTED_PROVIDERS.reduce(
    (acc, provider) => {
      const record = records.find((item) => item.provider === provider);
      let hasAccessToken = false;

      if (record?.config) {
        try {
          const parsed = JSON.parse(record.config) as { accessToken?: string };
          hasAccessToken = Boolean(parsed.accessToken);
        } catch {
          hasAccessToken = false;
        }
      }

      acc[provider] = {
        connected: Boolean(record?.enabled && hasAccessToken),
        enabled: Boolean(record?.enabled),
        syncedAt: record?.syncedAt?.toISOString() ?? null,
        configured: isProviderConfigured(provider),
      };
      return acc;
    },
    {} as Record<SupportedProvider, IntegrationStatus>,
  );
}

function buildHubSpotAuthUrl() {
  const sandbox = getDevSandboxCredentials("hubspot");
  const clientId = sandbox?.clientId || getSecret("HUBSPOT_CLIENT_ID");
  if (!clientId) {
    throw new Error("Missing HUBSPOT_CLIENT_ID");
  }

  const nonce = generateNonce();
  setOAuthCookie("hubspot", nonce);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    scope: HUBSPOT_SCOPES.join(" "),
    response_type: "code",
    state: `hubspot:${nonce}`,
  });

  return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
}

function buildSalesforceAuthUrl() {
  const sandbox = getDevSandboxCredentials("salesforce");
  const clientId = sandbox?.clientId || getSecret("SALESFORCE_CLIENT_ID");
  if (!clientId) {
    throw new Error("Missing SALESFORCE_CLIENT_ID");
  }

  const nonce = generateNonce();
  setOAuthCookie("salesforce", nonce);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SALESFORCE_SCOPES.join(" "),
    state: `salesforce:${nonce}`,
  });

  return `${getSalesforceAuthBase()}/services/oauth2/authorize?${params.toString()}`;
}

function buildTeamsAuthUrl() {
  const sandbox = getDevSandboxCredentials("teams");
  const clientId = sandbox?.clientId || (getSecret("TEAMS_CLIENT_ID") || getSecret("MICROSOFT_CLIENT_ID"));
  if (!clientId) {
    throw new Error("Missing TEAMS_CLIENT_ID or MICROSOFT_CLIENT_ID");
  }

  const nonce = generateNonce();
  setOAuthCookie("teams", nonce);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    response_mode: "query",
    scope: TEAMS_SCOPES.join(" "),
    state: `teams:${nonce}`,
  });

  return `https://login.microsoftonline.com/${getMicrosoftTenant()}/oauth2/v2.0/authorize?${params.toString()}`;
}

async function exchangeHubSpotCode(code: string) {
  const sandbox = getDevSandboxCredentials("hubspot");
  const clientId = sandbox?.clientId || getSecret("HUBSPOT_CLIENT_ID");
  const clientSecret = sandbox?.clientSecret || getSecret("HUBSPOT_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("Missing HubSpot OAuth credentials");
  }

  if (sandbox) {
    return buildSandboxTokenResponse("hubspot", code);
  }

  const response = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(),
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`HubSpot token exchange failed`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null,
    scope: data.scope ?? HUBSPOT_SCOPES.join(" "),
    tokenType: data.token_type ?? "Bearer",
  };
}

async function exchangeSalesforceCode(code: string) {
  const sandbox = getDevSandboxCredentials("salesforce");
  const clientId = sandbox?.clientId || getSecret("SALESFORCE_CLIENT_ID");
  const clientSecret = sandbox?.clientSecret || getSecret("SALESFORCE_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("Missing Salesforce OAuth credentials");
  }

  if (sandbox) {
    return buildSandboxTokenResponse("salesforce", code);
  }

  const response = await fetch(`${getSalesforceAuthBase()}/services/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(),
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`Salesforce token exchange failed`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    instance_url?: string;
    scope?: string;
    token_type?: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    instanceUrl: data.instance_url ?? null,
    scope: data.scope ?? SALESFORCE_SCOPES.join(" "),
    tokenType: data.token_type ?? "Bearer",
  };
}

async function exchangeTeamsCode(code: string) {
  const sandbox = getDevSandboxCredentials("teams");
  const clientId = sandbox?.clientId || (getSecret("TEAMS_CLIENT_ID") || getSecret("MICROSOFT_CLIENT_ID"));
  const clientSecret = sandbox?.clientSecret || (getSecret("TEAMS_CLIENT_SECRET") || getSecret("MICROSOFT_CLIENT_SECRET"));
  if (!clientId || !clientSecret) {
    throw new Error("Missing Microsoft Teams OAuth credentials");
  }

  if (sandbox) {
    return buildSandboxTokenResponse("teams", code);
  }

  const response = await fetch(
    `https://login.microsoftonline.com/${getMicrosoftTenant()}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getRedirectUri(),
        code,
        grant_type: "authorization_code",
        scope: TEAMS_SCOPES.join(" "),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Microsoft Teams token exchange failed`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null,
    scope: data.scope ?? TEAMS_SCOPES.join(" "),
    tokenType: data.token_type ?? "Bearer",
  };
}

function buildSandboxTokenResponse(
  provider: SandboxProvider,
  code: string,
): Record<string, string | null> {
  const expiresIn = 60 * 60 * 24;
  return {
    accessToken: `dev-${provider}-access-token:${code}`,
    refreshToken: `dev-${provider}-refresh-token`,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    scope: getDevSandboxCredentials(provider)?.scope.join(" ") ?? null,
    tokenType: "Bearer",
    instanceUrl: provider === "salesforce" ? "https://example.my.salesforce.com" : null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const action = req.nextUrl.searchParams.get("action");
    const providerParam = req.nextUrl.searchParams.get("provider");

    if (action === "auth-url") {
      if (!isSupportedProvider(providerParam)) {
        return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
      }

      let authUrl: string;
      if (providerParam === "hubspot") {
        authUrl = buildHubSpotAuthUrl();
      } else if (providerParam === "salesforce") {
        authUrl = buildSalesforceAuthUrl();
      } else {
        authUrl = buildTeamsAuthUrl();
      }

      return NextResponse.json({ authUrl });
    }

    const records = user.teamId
      ? await prisma.integration.findMany({
          where: {
            teamId: user.teamId,
            provider: { in: SUPPORTED_PROVIDERS },
          },
        })
      : [];

    return NextResponse.json({ integrations: serializeStatuses(records) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load integrations" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(`oauth:${user.id}`, "oauth");
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { provider, code, state: rawState } = (await req.json()) as {
      provider?: string;
      code?: string;
      state?: string;
    };

    if (!provider || !code || !isSupportedProvider(provider)) {
      return NextResponse.json({ error: "provider and code are required" }, { status: 400 });
    }

    const [stateProvider, nonce] = (rawState ?? "").split(":");
    if (stateProvider !== provider || !validateOAuthCookie(provider, nonce)) {
      return NextResponse.json({ error: "Invalid OAuth state" }, { status: 403 });
    }

    const teamId = await ensureTeamId(user);

    let config: Record<string, string | null>;
    if (provider === "hubspot") {
      config = await exchangeHubSpotCode(code);
    } else if (provider === "salesforce") {
      config = await exchangeSalesforceCode(code);
    } else {
      config = await exchangeTeamsCode(code);
    }

    const existing = await prisma.integration.findFirst({
      where: {
        teamId,
        provider,
      },
    });

    const saved = existing
      ? await prisma.integration.update({
          where: { id: existing.id },
          data: {
            config: JSON.stringify(config),
            enabled: true,
            syncedAt: new Date(),
          },
        })
      : await prisma.integration.create({
          data: {
            teamId,
            provider,
            config: JSON.stringify(config),
            enabled: true,
            syncedAt: new Date(),
          },
        });

    return NextResponse.json({
      success: true,
      integration: {
        provider,
        connected: true,
        syncedAt: saved.syncedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save integration" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider } = (await req.json()) as { provider?: string };
    if (!provider || !isSupportedProvider(provider)) {
      return NextResponse.json({ error: "provider is required" }, { status: 400 });
    }

    if (!user.teamId) {
      return NextResponse.json({ success: true });
    }

    await prisma.integration.updateMany({
      where: {
        teamId: user.teamId,
        provider,
      },
      data: {
        enabled: false,
        config: null,
        syncedAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to disconnect integration" },
      { status: 500 },
    );
  }
}
