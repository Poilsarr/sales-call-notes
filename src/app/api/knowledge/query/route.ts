import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const QuerySchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(["person", "company", "product", "money", "date"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit({ key: `kg:query:${userId}`, limit: 60, windowSec: 60 });
  if (!rl.success) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    type: url.searchParams.get("type") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", issues: parsed.error.issues }, { status: 400 });
  }

  const { q, type, limit } = parsed.data;
  const needle = q.toLowerCase();

  const [entities, relations] = await Promise.all([
    prisma.knowledgeEntity.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
        value: { contains: needle, mode: "insensitive" },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    }),
    prisma.knowledgeRelation.findMany({
      where: {
        userId,
        relation: { contains: needle, mode: "insensitive" },
      },
      take: limit,
    }),
  ]);

  return NextResponse.json({ entities, relations });
}
