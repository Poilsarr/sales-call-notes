import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { cookies } from "next/headers";

import { getSecret } from "@/lib/secrets";
import { getAppUrl } from "@/lib/app-url";
import { getUserByClerkId } from "@/lib/get-user";
import { requireRole } from "@/lib/rbac";
import {
  getDevSandboxCredentials,
  isDevSandboxEnabled,
} from "@/lib/integrations/dev-sandbox";

const SLACK_SCOPES = [
  "chat:write",
  "chat:write.public",
  "users:read",
  "commands",
  "im:write",
];

function getSlackRedirectUri() {
  const override = getSecret("SLACK_REDIRECT_URI");
  if (override) return override;
  return `${getAppUrl()}/api/integrations/slack/callback`;
}

function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

async function setOAuthCookie(nonce: string) {
  const cookieStore = await cookies();
  cookieStore.set("oauth_slack", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });
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

    const sandbox = getDevSandboxCredentials("slack");
    const clientId = sandbox?.clientId || getSecret("SLACK_CLIENT_ID");
    if (!clientId) {
      return NextResponse.json({ error: "Missing SLACK_CLIENT_ID" }, { status: 500 });
    }

    const nonce = generateNonce();
    await setOAuthCookie(nonce);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: getSlackRedirectUri(),
      scope: SLACK_SCOPES.join(","),
      state: `slack:${nonce}`,
    });

    const authUrl = `https://slack.com/oauth/v2/authorize?${params.toString()}`;
    return NextResponse.redirect(authUrl);
  } catch {
    return NextResponse.json({ error: "Failed to start Slack OAuth" }, { status: 500 });
  }
}
