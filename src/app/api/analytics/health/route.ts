import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import type { JsonValue } from "@prisma/client/runtime/library";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { aggregateTrends } from "@/services/ai/trends";

function safeJson<T>(v: JsonValue | null): T | undefined {
  if (!v) return undefined;
  if (typeof v === "string") try { return JSON.parse(v) as T; } catch { return undefined; }
  return v as unknown as T;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

const HealthSchema = z.object({
  range: z.coerce.number().int().min(1).max(365).default(90),
});

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = await rateLimit({ key: `health:${userId}`, limit: 20, windowSec: 60 });
    if (!rl.success) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

    const url = new URL(req.url);
    const parsed = HealthSchema.safeParse({
      range: url.searchParams.get("range") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid params", issues: parsed.error.issues }, { status: 400 });
    }

    const { range } = parsed.data;
    const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000);

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let teamId: string | null = null;
    let teamName: string | null = null;
    if (user.teamId) {
      teamId = user.teamId;
      const team = await prisma.team.findUnique({
        where: { id: user.teamId },
        select: { id: true, name: true },
      });
      teamName = team?.name ?? null;
    }

    const raw = await prisma.callInsight.findMany({
      where: {
        call: teamId
          ? { teamId, sharedWithTeam: true, createdAt: { gte: since } }
          : { userId: user.id, createdAt: { gte: since } },
      },
      orderBy: { createdAt: "asc" },
    });

    const insights = raw.map((i) => ({
      createdAt: i.createdAt,
      sentimentScore: i.sentimentScore,
      objections: safeJson<Array<{ type: string }>>(i.objections),
      closeProbability: i.closeProbability,
    }));

    const summary = aggregateTrends(insights, "week");
    const weekCount = summary.buckets.length;
    const callsPerWeek = weekCount > 0 ? round(summary.totalCalls / weekCount) : 0;

    return NextResponse.json({
      scope: teamId ? "team" : "personal",
      team: teamId ? { id: teamId, name: teamName } : null,
      avgScore: summary.overallAvgSentiment,
      callsPerWeek,
      totalCalls: summary.totalCalls,
      topObjections: summary.topObjections,
      buckets: summary.buckets,
    });
  } catch (error) {
    console.error("Health analytics error:", error);
    return NextResponse.json({ error: "Health analytics failed" }, { status: 500 });
  }
}
