import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { refreshIntegrationToken } from "@/lib/integrations/token-refresh";

type HealthStatus = "healthy" | "needs_reconnect" | "error" | "not_supported";

async function checkHubSpot(accessToken: string): Promise<{ status: HealthStatus; error?: string }> {
  const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.ok) return { status: "healthy" };
  if (res.status === 401) return { status: "needs_reconnect" };

  const body = await res.json().catch(() => ({}));
  return { status: "error", error: body.message || `HTTP ${res.status}` };
}

async function checkSalesforce(accessToken: string, instanceUrl: string): Promise<{ status: HealthStatus; error?: string }> {
  const baseUrl = instanceUrl.replace(/\/$/, "");
  const res = await fetch(`${baseUrl}/services/data/v59.0/sobjects/Contact/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.ok) return { status: "healthy" };
  if (res.status === 401) return { status: "needs_reconnect" };

  const body = await res.json().catch(() => ({}));
  return { status: "error", error: body[0]?.message || body.message || `HTTP ${res.status}` };
}

async function checkSlack(accessToken: string): Promise<{ status: HealthStatus; error?: string }> {
  const res = await fetch("https://slack.com/api/auth.test", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return { status: "error", error: `HTTP ${res.status}` };

  const body = await res.json();
  if (body.ok) return { status: "healthy" };
  if (body.error === "token_expired" || body.error === "invalid_auth") return { status: "needs_reconnect" };
  return { status: "error", error: body.error || "Slack API error" };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(userId);
    if (!user.teamId) {
      return NextResponse.json({ error: "No team found" }, { status: 404 });
    }

    const integration = await prisma.integration.findUnique({
      where: { id: params.id },
    });

    if (!integration || integration.teamId !== user.teamId) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    if (!integration.enabled || !integration.config) {
      return NextResponse.json({
        id: integration.id,
        provider: integration.provider,
        status: "needs_reconnect",
        checkedAt: new Date().toISOString(),
        error: "Integration is not enabled or missing configuration",
      });
    }

    let config: Record<string, any>;
    try {
      config = JSON.parse(integration.config);
    } catch {
      return NextResponse.json({
        id: integration.id,
        provider: integration.provider,
        status: "error",
        checkedAt: new Date().toISOString(),
        error: "Invalid integration configuration",
      });
    }

    if (integration.provider === "teams") {
      return NextResponse.json({
        id: integration.id,
        provider: integration.provider,
        status: "not_supported",
        checkedAt: new Date().toISOString(),
      });
    }

    const accessToken = config.accessToken;
    if (!accessToken) {
      return NextResponse.json({
        id: integration.id,
        provider: integration.provider,
        status: "needs_reconnect",
        checkedAt: new Date().toISOString(),
        error: "No access token found",
      });
    }

    let result: { status: HealthStatus; error?: string };

    if (integration.provider === "hubspot") {
      result = await checkHubSpot(accessToken);
    } else if (integration.provider === "salesforce") {
      result = await checkSalesforce(accessToken, config.instanceUrl || "");
    } else {
      result = await checkSlack(accessToken);
    }

    if (result.status === "needs_reconnect") {
      const refreshedToken = await refreshIntegrationToken(user.teamId, integration.provider);
      if (!refreshedToken) {
        return NextResponse.json({
          id: integration.id,
          provider: integration.provider,
          status: "needs_reconnect",
          checkedAt: new Date().toISOString(),
          error: "Token expired, re-authentication required",
        });
      }

      if (integration.provider === "hubspot") {
        result = await checkHubSpot(refreshedToken);
      } else if (integration.provider === "salesforce") {
        result = await checkSalesforce(refreshedToken, config.instanceUrl || "");
      } else {
        result = await checkSlack(refreshedToken);
      }
    }

    if (result.status === "healthy") {
      await prisma.integration.update({
        where: { id: integration.id },
        data: { syncedAt: new Date() },
      });
    }

    return NextResponse.json({
      id: integration.id,
      provider: integration.provider,
      status: result.status,
      checkedAt: new Date().toISOString(),
      ...(result.error ? { error: result.error } : {}),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check integration health" },
      { status: 500 },
    );
  }
}
