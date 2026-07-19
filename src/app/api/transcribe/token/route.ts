import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DeepgramClient } from "@deepgram/sdk";
import { getSecret } from "@/lib/secrets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = getSecret("DEEPGRAM_API_KEY");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Deepgram not configured" },
      { status: 500 },
    );
  }

  try {
    const dg = new DeepgramClient({ apiKey });
    // ponytail: ephemeral JWT, 10min TTL, server mints + client opens WS directly
    const result = await dg.auth.v1.tokens.grant({ ttl_seconds: 600 });

    return NextResponse.json({
      token: result.access_token,
      expiresAt: Date.now() + (result.expires_in ?? 600) * 1000,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to mint Deepgram token" },
      { status: 500 },
    );
  }
}
