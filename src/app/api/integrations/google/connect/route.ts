import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@clerk/nextjs/server";

import { getSecret } from "@/lib/secrets";
import { getUserByClerkId } from "@/lib/get-user";
import { requireRole } from "@/lib/rbac";

function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

function getAppUrl() {
  const url = getSecret("NEXT_PUBLIC_APP_URL");
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL must be set");
  return url.replace(/\/$/, "");
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

    // The callback exchange (and the hub's isProviderConfigured) requires
    // both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET — starting a flow that
    // can never complete would strand the user mid-OAuth.
    const clientId = getSecret("GOOGLE_CLIENT_ID");
    const clientSecret = getSecret("GOOGLE_CLIENT_SECRET");
    const redirectUri =
      getSecret("GOOGLE_REDIRECT_URI") || `${getAppUrl()}/api/integrations/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Google OAuth is not configured" }, { status: 400 });
    }

    const nonce = generateNonce();

    const cookieStore = await cookies();
    cookieStore.set("oauth_google_calendar", nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 300,
    });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
      access_type: "offline",
      state: nonce,
      prompt: "consent",
    });

    return NextResponse.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to initiate Google OAuth" },
      { status: 500 },
    );
  }
}
