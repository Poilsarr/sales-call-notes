import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import type { JsonValue } from "@prisma/client/runtime/library";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { buildPersonalization } from "@/services/ai/personalization";

function safeJson<T>(v: JsonValue | null): T | undefined {
  if (!v) return undefined;
  if (typeof v === "string") try { return JSON.parse(v) as T; } catch { return undefined; }
  return v as unknown as T;
}

const PutSchema = z.object({
  preferredTone: z.enum(["terse", "detailed", "balanced"]).optional(),
  rubricEmphasis: z.array(z.string()).max(10).optional(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit({ key: `personalization:${userId}`, limit: 30, windowSec: 60 });
  if (!rl.success) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const rawInsights = await prisma.callInsight.findMany({
    where: { call: { userId } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const recentInsights = rawInsights.map((i) => ({
    objections: safeJson<Array<{ type: string }>>(i.objections),
    coachingNotes: safeJson<{ improvements?: string[]; tips?: string[] }>(i.coachingNotes),
    salesScorecard: safeJson<{ overallScore?: number }>(i.salesScorecard),
    talkRatio: safeJson<{ rep: number }>(i.talkRatio),
  }));

  const personalization = buildPersonalization(recentInsights);

  const userPref = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferredTone: true, rubricEmphasis: true },
  });

  return NextResponse.json({
    personalization,
    preferredTone: userPref?.preferredTone ?? null,
    rubricEmphasis: userPref?.rubricEmphasis ?? [],
    callCount: recentInsights.length,
  });
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit({ key: `personalization:put:${userId}`, limit: 10, windowSec: 60 });
  if (!rl.success) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = PutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.preferredTone) updateData.preferredTone = parsed.data.preferredTone;
  if (parsed.data.rubricEmphasis) updateData.rubricEmphasis = parsed.data.rubricEmphasis;

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({ where: { id: userId }, data: updateData });
  }

  return NextResponse.json({ ok: true });
}
