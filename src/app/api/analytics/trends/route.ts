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

const TrendSchema = z.object({
  range: z.coerce.number().int().min(1).max(365).default(90),
  groupBy: z.enum(["week", "month"]).default("week"),
});

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit({ key: `trends:${userId}`, limit: 20, windowSec: 60 });
  if (!rl.success) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const url = new URL(req.url);
  const parsed = TrendSchema.safeParse({
    range: url.searchParams.get("range") ?? undefined,
    groupBy: url.searchParams.get("groupBy") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid params", issues: parsed.error.issues }, { status: 400 });
  }

  const { range, groupBy } = parsed.data;
  const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000);

  const raw = await prisma.callInsight.findMany({
    where: {
      call: { userId },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "asc" },
  });

  const insights = raw.map((i) => ({
    createdAt: i.createdAt,
    sentimentScore: i.sentimentScore,
    objections: safeJson<Array<{ type: string }>>(i.objections),
    closeProbability: i.closeProbability,
  }));

  const trends = aggregateTrends(insights, groupBy);
  return NextResponse.json(trends);
}
