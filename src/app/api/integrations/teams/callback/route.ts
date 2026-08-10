import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { requireRole } from "@/lib/rbac";
import { getSecret } from "@/lib/secrets";
import {
  getDevSandboxCredentials,
  isDevSandboxEnabled,
} from "@/lib/integrations/dev-sandbox";
import { logAuditAction } from "@/lib/audit-logger";
import { encryptConfig } from "@/lib/integrations/config-crypto";

const TEAMS_SCOPES = [
  "offline_access",
  "User.Read",
  "Calendars.ReadWrite",
  "OnlineMeetings.ReadWrite",
];

function getAppUrl() {
  const url = getSecret("NEXT_PUBLIC_APP_URL");
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL must be set");
  return url.replace(/\/$/, "");
}

function getTeamsRedirectUri() {
  const override = getSecret("TEAMS_REDIRECT_URI");
  if (override) return override;
  return `${getAppUrl()}/api/integrations/teams/callback`;
}

function getMicrosoftTenant() {
  return getSecret("MICROSOFT_TENANT_ID") || getSecret("TEAMS_TENANT_ID") || "common";
}

async function exchangeCode(code: string) {
  const sandbox = getDevSandboxCredentials("teams");
  const clientId = sandbox?.clientId || (getSecret("TEAMS_CLIENT_ID") || getSecret("MICROSOFT_CLIENT_ID"));
  const clientSecret = sandbox?.clientSecret || (getSecret("TEAMS_CLIENT_SECRET") || getSecret("MICROSOFT_CLIENT_SECRET"));

  if (!clientId || !clientSecret) {
    throw new Error("Missing Microsoft Teams OAuth credentials");
  }

  if (sandbox) {
    const expiresIn = 60 * 60 * 24;
    return {
      accessToken: `dev-teams-access-token:${code}`,
      refreshToken: `dev-teams-refresh-token`,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      scope: TEAMS_SCOPES.join(" "),
      tokenType: "Bearer",
    };
  }

  const res = await fetch(
    `https://login.microsoftonline.com/${getMicrosoftTenant()}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: getTeamsRedirectUri(),
        scope: TEAMS_SCOPES.join(" "),
      }),
    },
  );

  if (!res.ok) {
    throw new Error("Microsoft Teams token exchange failed");
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
    scope: data.scope ?? TEAMS_SCOPES.join(" "),
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
        new URL("/integrations?error=teams_access_denied", getAppUrl()),
      );
    }

    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/integrations?error=missing_params", getAppUrl()),
      );
    }

    const [stateProvider, nonce] = state.split(":");
    if (stateProvider !== "teams") {
      return NextResponse.redirect(
        new URL("/integrations?error=invalid_state", getAppUrl()),
      );
    }

    const cookieStore = await cookies();
    const stored = cookieStore.get("oauth_teams");
    if (!stored || stored.value !== nonce) {
      return NextResponse.redirect(
        new URL("/integrations?error=invalid_nonce", getAppUrl()),
      );
    }
    cookieStore.delete("oauth_teams");

    const user = await getUserByClerkId(userId);

    // Only admins may write workspace OAuth credentials (see google/callback
    // for the same reasoning). Users without a team create their own below.
    if (user.teamId) {
      const { allowed } = await requireRole(userId, user.teamId, "ADMIN");
      if (!allowed) {
        return NextResponse.redirect(
          new URL("/integrations?error=forbidden", getAppUrl()),
        );
      }
    }

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
      where: { teamId, provider: "teams" },
    });

    if (existing) {
      await prisma.integration.update({
        where: { id: existing.id },
        data: {
          config: encryptConfig(JSON.stringify(config)),
          enabled: true,
          syncedAt: new Date(),
        },
      });
    } else {
      await prisma.integration.create({
        data: {
          teamId,
          provider: "teams",
          config: encryptConfig(JSON.stringify(config)),
          enabled: true,
          syncedAt: new Date(),
        },
      });
    }

    await logAuditAction(user.id, "CONNECT_TEAMS", teamId, "Integration", {});

    return NextResponse.redirect(
      new URL("/integrations?teams=connected", getAppUrl()),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.redirect(
      new URL(`/integrations?error=teams_${message}`, getAppUrl()),
    );
  }
}
