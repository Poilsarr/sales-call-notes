import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit({ key: `kg:rel:${userId}`, limit: 60, windowSec: 60 });
  if (!rl.success) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const { id } = await params;

  const relation = await prisma.knowledgeRelation.findUnique({ where: { id } });
  if (!relation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (relation.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [from, to] = await Promise.all([
    prisma.knowledgeEntity.findUnique({ where: { id: relation.fromEntityId } }),
    prisma.knowledgeEntity.findUnique({ where: { id: relation.toEntityId } }),
  ]);

  return NextResponse.json({ relation, from, to });
}
