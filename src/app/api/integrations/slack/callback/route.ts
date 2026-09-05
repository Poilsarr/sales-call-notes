import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { requireRole } from "@/lib/rbac";
import { getSecret } from "@/lib/secrets";
import { getAppUrl } from "@/lib/app-url";
import {
  getDevSandboxCredentials,
  isDevSandboxEnabled,
} from "@/lib/integrations/dev-sandbox";
import { logAuditAction } from "@/lib/audit-logger";
import { encryptConfig } from "@/lib/integrations/config-crypto";

function getSlackRedirectUri(reqOrigin?: string | null) {
  const override = getSecret("SLACK_REDIRECT_URI");
  if (override) return override;
  return `${getAppUrl(reqOrigin)}/api/integrations/slack/callback`;
}

async function exchangeCode(code: string, reqOrigin?: string | null) {
  const sandbox = getDevSandboxCredentials("slack");
  const clientId = sandbox?.clientId || getSecret("SLACK_CLIENT_ID");
  const clientSecret = sandbox?.clientSecret || getSecret("SLACK_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Missing Slack OAuth credentials");
  }

  if (sandbox) {
    return {
      accessToken: "dev-slack-bot-token",
      teamId: "T00000",
      teamName: "Dev Team",
      botUserId: "U00000",
      authedUserId: "U00000",
      scope: "chat:write,chat:write.public,users:read,commands,im:write",
    };
  }

  const res = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: getSlackRedirectUri(reqOrigin),
    }),
  });

  const data = await res.json();

  if (!data.ok) {
    throw new Error(data.error || "Slack OAuth exchange failed");
  }

  return {
    accessToken: data.access_token as string,
    teamId: data.team?.id as string,
    teamName: data.team?.name as string,
    botUserId: data.bot_user_id as string,
    authedUserId: data.authed_user?.id as string,
    scope: data.scope as string,
  };
}

export async function GET(req: NextRequest) {
  try {
    const appUrl = getAppUrl(req.nextUrl.origin);
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", appUrl));
    }

    const error = req.nextUrl.searchParams.get("error");
    if (error) {
      return NextResponse.redirect(new URL("/integrations?error=slack_access_denied", appUrl));
    }

    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(new URL("/integrations?error=missing_params", appUrl));
    }

    const [stateProvider, nonce] = state.split(":");
    if (stateProvider !== "slack") {
      return NextResponse.redirect(new URL("/integrations?error=invalid_state", appUrl));
    }

    const cookieStore = await cookies();
    const stored = cookieStore.get("oauth_slack");
    if (!stored || stored.value !== nonce) {
      return NextResponse.redirect(new URL("/integrations?error=invalid_nonce", appUrl));
    }
    cookieStore.delete("oauth_slack");

    const user = await getUserByClerkId(userId);

    // Only admins may write workspace OAuth credentials (see google/callback
    // for the same reasoning). Users without a team create their own below.
    if (user.teamId) {
      const { allowed } = await requireRole(userId, user.teamId, "ADMIN");
      if (!allowed) {
        return NextResponse.redirect(new URL("/integrations?error=forbidden", appUrl));
      }
    }

    const config = await exchangeCode(code, req.nextUrl.origin);

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

    const teamId = user.teamId || (await prisma.user.findUnique({ where: { id: user.id } }))?.teamId;
    if (!teamId) {
      return NextResponse.redirect(new URL("/integrations?error=no_team", appUrl));
    }

    const existing = await prisma.integration.findFirst({
      where: { teamId, provider: "slack" },
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
          provider: "slack",
          config: encryptConfig(JSON.stringify(config)),
          enabled: true,
          syncedAt: new Date(),
        },
      });
    }

    await logAuditAction(user.id, "CONNECT_SLACK", teamId, "Integration", {
      slackTeamId: config.teamId,
    });

    return NextResponse.redirect(new URL("/integrations?slack=connected", appUrl));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return NextResponse.redirect(new URL(`/integrations?error=slack_${message}`, getAppUrl()));
  }
}
