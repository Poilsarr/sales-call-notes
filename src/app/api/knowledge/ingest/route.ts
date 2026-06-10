import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { buildGraphFromText } from "@/services/ai/knowledge-extract";
import { rateLimit } from "@/lib/rate-limit";

const IngestSchema = z.object({
  callId: z.string().min(1),
  text: z.string().min(1).max(200_000),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit({ key: `kg:ingest:${userId}`, limit: 20, windowSec: 60 });
  if (!rl.success) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = IngestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const { callId, text } = parsed.data;
  const graph = buildGraphFromText({ text, callId, userId });

  let entitiesUpserted = 0;
  for (const e of graph.entities) {
    const key = { userId_type_value: { userId, type: e.type, value: e.value } };
    await prisma.knowledgeEntity.upsert({
      where: key,
      update: { calls: { push: callId } },
      create: { userId, type: e.type, value: e.value, calls: [callId] },
    });
    entitiesUpserted++;
  }

  let relationsCreated = 0;
  for (const r of graph.relations) {
    const [from, to] = await Promise.all([
      prisma.knowledgeEntity.findUnique({ where: { userId_type_value: { userId, type: r.fromType, value: r.from } } }),
      prisma.knowledgeEntity.findUnique({ where: { userId_type_value: { userId, type: r.toType, value: r.to } } }),
    ]);
    if (!from || !to) continue;
    await prisma.knowledgeRelation.create({
      data: {
        userId,
        fromEntityId: from.id,
        toEntityId: to.id,
        relation: r.relation,
        calls: [callId],
      },
    });
    relationsCreated++;
  }

  return NextResponse.json({ ok: true, entitiesUpserted, relationsCreated });
}
