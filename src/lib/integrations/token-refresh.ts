import prisma from "@/lib/prisma";
import { getSecret } from "@/lib/secrets";

type IntegrationConfig = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  instanceUrl?: string;
  scope?: string;
  tokenType?: string;
};

export async function refreshIntegrationToken(
  teamId: string,
  provider: string
): Promise<string | null> {
  const integration = await prisma.integration.findFirst({
    where: { teamId, provider, enabled: true },
  });

  if (!integration?.config) return null;

  let config: IntegrationConfig;
  try {
    config = JSON.parse(integration.config);
  } catch {
    return null;
  }

  if (config.expiresAt) {
    const expiresAt = new Date(config.expiresAt).getTime();
    if (expiresAt > Date.now()) {
      return config.accessToken || null;
    }
  } else {
    return config.accessToken || null;
  }

  if (!config.refreshToken) return null;

  let updated: Record<string, string | null> | null = null;

  if (provider === "hubspot") {
    updated = await refreshHubSpotToken(config.refreshToken);
  } else if (provider === "salesforce") {
    updated = await refreshSalesforceToken(config.refreshToken, config.instanceUrl);
  } else if (provider === "google_calendar") {
    updated = await refreshGoogleToken(config.refreshToken);
  }

  if (!updated) return null;

  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      config: JSON.stringify({ ...config, ...updated }),
      syncedAt: new Date(),
    },
  });

  return updated.accessToken || null;
}

async function refreshHubSpotToken(refreshToken: string) {
  const clientId = getSecret("HUBSPOT_CLIENT_ID");
  const clientSecret = getSecret("HUBSPOT_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) return null;

  const data = await res.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : null,
  };
}

async function refreshSalesforceToken(refreshToken: string, instanceUrl?: string) {
  const clientId = getSecret("SALESFORCE_CLIENT_ID");
  const clientSecret = getSecret("SALESFORCE_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;

  const authUrl = getSecret("SALESFORCE_AUTH_URL") || "https://login.salesforce.com";

  const res = await fetch(`${authUrl}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) return null;

  const data = await res.json() as {
    access_token: string;
    instance_url?: string;
  };

  return {
    accessToken: data.access_token,
    instanceUrl: data.instance_url ?? instanceUrl ?? null,
    expiresAt: null,
  };
}

async function refreshGoogleToken(refreshToken: string) {
  const clientId = getSecret("GOOGLE_CLIENT_ID");
  const clientSecret = getSecret("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : null,
  };
}
