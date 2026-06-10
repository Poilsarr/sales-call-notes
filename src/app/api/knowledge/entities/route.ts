import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const ListSchema = z.object({
  type: z.enum(["person", "company", "product", "money", "date"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit({ key: `kg:entities:${userId}`, limit: 30, windowSec: 60 });
  if (!rl.success) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const url = new URL(req.url);
  const parsed = ListSchema.safeParse({
    type: url.searchParams.get("type") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid params", issues: parsed.error.issues }, { status: 400 });
  }

  const { type, limit, offset } = parsed.data;

  const [entities, total] = await Promise.all([
    prisma.knowledgeEntity.findMany({
      where: { userId, ...(type ? { type } : {}) },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.knowledgeEntity.count({
      where: { userId, ...(type ? { type } : {}) },
    }),
  ]);

  return NextResponse.json({ entities, total, limit, offset });
}
