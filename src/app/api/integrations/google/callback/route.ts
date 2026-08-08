import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { getSecret } from "@/lib/secrets";
import {
  getDevSandboxCredentials,
  isDevSandboxEnabled,
} from "@/lib/integrations/dev-sandbox";
import { logAuditAction } from "@/lib/audit-logger";

function getAppUrl() {
  const url = getSecret("NEXT_PUBLIC_APP_URL");
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL must be set");
  return url.replace(/\/$/, "");
}

function getRedirectUri() {
  return getSecret("GOOGLE_REDIRECT_URI") || `${getAppUrl()}/api/integrations/google/callback`;
}

async function exchangeCode(code: string) {
  const sandbox = getDevSandboxCredentials("google_calendar");
  const clientId = sandbox?.clientId || getSecret("GOOGLE_CLIENT_ID");
  const clientSecret = sandbox?.clientSecret || getSecret("GOOGLE_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Missing Google OAuth credentials");
  }

  if (sandbox) {
    const expiresIn = 60 * 60 * 24;
    return {
      accessToken: `dev-google-access-token:${code}`,
      refreshToken: `dev-google-refresh-token`,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!res.ok) {
    throw new Error("Google token exchange failed");
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : null,
    scope: data.scope ?? "https://www.googleapis.com/auth/calendar.events",
    tokenType: data.token_type ?? "Bearer",
  };
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", getAppUrl()));
    }

    const error = req.nextUrl.searchParams.get("error");
    if (error) {
      return NextResponse.redirect(
        new URL("/integrations?error=google_access_denied", getAppUrl()),
      );
    }

    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/integrations?error=missing_params", getAppUrl()),
      );
    }

    const cookieStore = await cookies();
    const stored = cookieStore.get("oauth_google_calendar");
    if (!stored || stored.value !== state) {
      return NextResponse.redirect(
        new URL("/integrations?error=invalid_nonce", getAppUrl()),
      );
    }
    cookieStore.delete("oauth_google_calendar");

    const user = await getUserByClerkId(userId);
    const config = await exchangeCode(code);

    if (!user.teamId) {
      const team = await prisma.team.create({
        data: {
          name: `${user.name ?? user.email}'s Team`,
          slug: `team-${user.id}`,
          ownerId: user.id,
        },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { teamId: team.id, teamRole: "ADMIN" },
      });
    }

    const teamId =
      user.teamId ||
      (await prisma.user.findUnique({ where: { id: user.id } }))?.teamId;
    if (!teamId) {
      return NextResponse.redirect(
        new URL("/integrations?error=no_team", getAppUrl()),
      );
    }

    const existing = await prisma.integration.findFirst({
      where: { teamId, provider: "google_calendar" },
    });

    if (existing) {
      await prisma.integration.update({
        where: { id: existing.id },
        data: {
          config: JSON.stringify(config),
          enabled: true,
          syncedAt: new Date(),
        },
      });
    } else {
      await prisma.integration.create({
        data: {
          teamId,
          provider: "google_calendar",
          config: JSON.stringify(config),
          enabled: true,
          syncedAt: new Date(),
        },
      });
    }

    await logAuditAction(user.id, "CONNECT_GOOGLE_CALENDAR", teamId, "Integration", {});

    return NextResponse.redirect(
      new URL("/integrations?google=connected", getAppUrl()),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.redirect(
      new URL(`/integrations?error=google_${message}`, getAppUrl()),
    );
  }
}
