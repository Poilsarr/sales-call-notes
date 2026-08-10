import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { cookies } from "next/headers";

import { getSecret } from "@/lib/secrets";
import { getUserByClerkId } from "@/lib/get-user";
import { requireRole } from "@/lib/rbac";
import {
  getDevSandboxCredentials,
  isDevSandboxEnabled,
} from "@/lib/integrations/dev-sandbox";

const TEAMS_SCOPES = [
  "offline_access",
  "User.Read",
  "Calendars.ReadWrite",
  "OnlineMeetings.ReadWrite",
];

function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

async function setOAuthCookie(nonce: string) {
  const cookieStore = await cookies();
  cookieStore.set("oauth_teams", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });
}

function getMicrosoftTenant() {
  return getSecret("MICROSOFT_TENANT_ID") || getSecret("TEAMS_TENANT_ID") || "common";
}

function getAppUrl() {
  const url = getSecret("NEXT_PUBLIC_APP_URL");
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL must be set for OAuth redirects");
  return url.replace(/\/$/, "");
}

function getTeamsRedirectUri() {
  const override = getSecret("TEAMS_REDIRECT_URI");
  if (override) return override;
  return `${getAppUrl()}/api/integrations/teams/callback`;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(userId);
    if (user.teamId) {
      const { allowed } = await requireRole(userId, user.teamId, "ADMIN");
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const sandbox = getDevSandboxCredentials("teams");
    const clientId = sandbox?.clientId || getSecret("TEAMS_CLIENT_ID") || getSecret("MICROSOFT_CLIENT_ID");

    if (!clientId) {
      return NextResponse.json({ error: "Not configured" }, { status: 400 });
    }

    const nonce = generateNonce();
    await setOAuthCookie(nonce);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: getTeamsRedirectUri(),
      response_type: "code",
      scope: TEAMS_SCOPES.join(" "),
      state: `teams:${nonce}`,
    });

    const authUrl = `https://login.microsoftonline.com/${getMicrosoftTenant()}/oauth2/v2.0/authorize?${params.toString()}`;
    return NextResponse.redirect(authUrl);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start Teams OAuth" },
      { status: 500 },
    );
  }
}
