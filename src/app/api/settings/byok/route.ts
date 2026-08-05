import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { encryptSecret, isPlausibleKey } from "@/lib/byok";
import { checkFeatureAccess } from "@/lib/entitlements";
import { captureApiError } from "@/lib/sentry";

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const gate = await checkFeatureAccess(clerkUserId, "byok");
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { byokOpenaiKey: true, byokGroqKey: true },
    });

    return NextResponse.json({
      allowed: gate.allowed,
      plan: gate.plan,
      upgradeUrl: gate.upgradeUrl ?? null,
      openaiConfigured: Boolean(user?.byokOpenaiKey),
      groqConfigured: Boolean(user?.byokGroqKey),
    });
  } catch (error: any) {
    captureApiError("/api/settings/byok", error, { method: "GET" });
    return NextResponse.json({ error: "Failed to load BYOK status" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const gate = await checkFeatureAccess(clerkUserId, "byok");
    if (!gate.allowed) {
      return NextResponse.json(
        { error: `BYOK requires ${gate.reason ?? "a paid plan"}`, upgradeUrl: gate.upgradeUrl },
        { status: 403 },
      );
    }

    const body = (await req.json().catch(() => null)) as
      | { openaiKey?: string; groqKey?: string }
      | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const hasOpenai = typeof body.openaiKey === "string";
    const hasGroq = typeof body.groqKey === "string";
    if (!hasOpenai && !hasGroq) {
      return NextResponse.json({ error: "Provide openaiKey and/or groqKey" }, { status: 400 });
    }

    const updates: { byokOpenaiKey?: string | null; byokGroqKey?: string | null } = {};
    if (hasOpenai) {
      const key = body.openaiKey!.trim();
      if (key && !isPlausibleKey("openai", key)) {
        return NextResponse.json(
          { error: "That doesn't look like an OpenAI key (expects sk-…)." },
          { status: 400 },
        );
      }
      updates.byokOpenaiKey = key ? encryptSecret(key) : null;
    }
    if (hasGroq) {
      const key = body.groqKey!.trim();
      if (key && !isPlausibleKey("groq", key)) {
        return NextResponse.json(
          { error: "That doesn't look like a Groq key (expects gsk_…)." },
          { status: 400 },
        );
      }
      updates.byokGroqKey = key ? encryptSecret(key) : null;
    }

    await prisma.user.update({ where: { clerkId: clerkUserId }, data: updates });

    return NextResponse.json({
      ok: true,
      openaiConfigured: Boolean(updates.byokOpenaiKey),
      groqConfigured: Boolean(updates.byokGroqKey),
    });
  } catch (error: any) {
    const msg = String(error?.message || "");
    if (msg.includes("BYOK_MASTER_KEY")) {
      return NextResponse.json(
        { error: "BYOK_MASTER_KEY is not configured on the server yet. Contact support to enable this feature." },
        { status: 500 },
      );
    }
    captureApiError("/api/settings/byok", error, { method: "PUT" });
    return NextResponse.json({ error: "Failed to save key" }, { status: 500 });
  }
}
