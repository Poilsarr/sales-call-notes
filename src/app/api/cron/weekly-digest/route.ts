import { NextRequest, NextResponse } from "next/server";
import { getSecret } from "@/lib/secrets";
import { generateWeeklyDigest } from "@/services/slack-digest";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = getSecret("CRON_SECRET");

  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const delivered = await generateWeeklyDigest();
    return NextResponse.json({ delivered });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Digest generation failed" },
      { status: 500 },
    );
  }
}
