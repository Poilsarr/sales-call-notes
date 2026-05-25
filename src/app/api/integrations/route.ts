import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";

type SupportedProvider = "hubspot" | "salesforce" | "teams";

type IntegrationStatus = {
  connected: boolean;
  enabled: boolean;
  syncedAt: string | null;
};

const SUPPORTED_PROVIDERS: SupportedProvider[] = ["hubspot", "salesforce", "teams"];

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
  "Tasks.ReadWrite",
  "Group.ReadWrite.All",
  "ChannelMessage.Send",
];

function isSupportedProvider(value: string | null): value is SupportedProvider {
  return value === "hubspot" || value === "salesforce" || value === "teams";
}

function getAppUrl(req: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin).replace(/\/$/, "");
}

function getRedirectUri(req: NextRequest) {
  return `${getAppUrl(req)}/integrations`;
}

function getSalesforceAuthBase() {
  return (process.env.SALESFORCE_AUTH_URL || "https://login.salesforce.com").replace(/\/$/, "");
}

function getMicrosoftTenant() {
  return process.env.MICROSOFT_TENANT_ID || process.env.TEAMS_TENANT_ID || "common";
}

async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { clerkId: userId },
  });
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
      };
      return acc;
    },
    {} as Record<SupportedProvider, IntegrationStatus>,
  );
}

function buildHubSpotAuthUrl(req: NextRequest) {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  if (!clientId) {
    throw new Error("Missing HUBSPOT_CLIENT_ID");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(req),
    scope: HUBSPOT_SCOPES.join(" "),
    response_type: "code",
    state: "hubspot",
  });

  return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
}

function buildSalesforceAuthUrl(req: NextRequest) {
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Missing SALESFORCE_CLIENT_ID");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(req),
    response_type: "code",
    scope: SALESFORCE_SCOPES.join(" "),
    state: "salesforce",
  });

  return `${getSalesforceAuthBase()}/services/oauth2/authorize?${params.toString()}`;
}

function buildTeamsAuthUrl(req: NextRequest) {
  const clientId = process.env.TEAMS_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) {
    throw new Error("Missing TEAMS_CLIENT_ID or MICROSOFT_CLIENT_ID");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(req),
    response_type: "code",
    response_mode: "query",
    scope: TEAMS_SCOPES.join(" "),
    state: "teams",
  });

  return `https://login.microsoftonline.com/${getMicrosoftTenant()}/oauth2/v2.0/authorize?${params.toString()}`;
}

async function exchangeHubSpotCode(code: string, req: NextRequest) {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing HubSpot OAuth credentials");
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
      redirect_uri: getRedirectUri(req),
      code,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`HubSpot token exchange failed: ${details}`);
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

async function exchangeSalesforceCode(code: string, req: NextRequest) {
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing Salesforce OAuth credentials");
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
      redirect_uri: getRedirectUri(req),
      code,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Salesforce token exchange failed: ${details}`);
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

async function exchangeTeamsCode(code: string, req: NextRequest) {
  const clientId = process.env.TEAMS_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.TEAMS_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing Microsoft Teams OAuth credentials");
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
        redirect_uri: getRedirectUri(req),
        code,
        grant_type: "authorization_code",
        scope: TEAMS_SCOPES.join(" "),
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Microsoft Teams token exchange failed: ${details}`);
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
        authUrl = buildHubSpotAuthUrl(req);
      } else if (providerParam === "salesforce") {
        authUrl = buildSalesforceAuthUrl(req);
      } else {
        authUrl = buildTeamsAuthUrl(req);
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

    const { provider, code } = (await req.json()) as {
      provider?: string;
      code?: string;
    };

    if (!provider || !code || !isSupportedProvider(provider)) {
      return NextResponse.json({ error: "provider and code are required" }, { status: 400 });
    }

    const teamId = await ensureTeamId(user);

    let config: Record<string, string | null>;
    if (provider === "hubspot") {
      config = await exchangeHubSpotCode(code, req);
    } else if (provider === "salesforce") {
      config = await exchangeSalesforceCode(code, req);
    } else {
      config = await exchangeTeamsCode(code, req);
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
