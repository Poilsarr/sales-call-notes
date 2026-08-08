import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

import { getSecret } from "@/lib/secrets";

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
    const clientId = getSecret("GOOGLE_CLIENT_ID");
    const redirectUri =
      getSecret("GOOGLE_REDIRECT_URI") || `${getAppUrl()}/api/integrations/google/callback`;

    if (!clientId) {
      return NextResponse.json({ error: "Not configured" }, { status: 400 });
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
