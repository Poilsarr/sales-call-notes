import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAuditAction } from "@/lib/audit-logger";
import { validateVocabularyEntry } from "@/lib/team-vocabulary";

async function getOwnedEntry(clerkId: string, entryId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { teamId: true },
  });
  if (!user?.teamId) return { teamId: null, entry: null };

  const { allowed } = await requireRole(clerkId, user.teamId, "ADMIN");
  if (!allowed) return { teamId: user.teamId, entry: null };

  const entry = await prisma.vocabularyEntry.findFirst({
    where: { id: entryId, teamId: user.teamId },
    select: { id: true, teamId: true, term: true, definition: true },
  });
  return { teamId: user.teamId, entry };
}

/**
 * PATCH /api/team/vocabulary/[id]
 *   Body: { term?, definition? } — ADMIN or OWNER only, team-scoped.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { teamId, entry } = await getOwnedEntry(userId, params.id);
    if (!teamId) {
      return NextResponse.json(
        { error: "You need to be on a team to manage vocabulary." },
        { status: 400 },
      );
    }
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const parsed = validateVocabularyEntry({
      term: body.term ?? entry.term,
      definition: body.definition ?? entry.definition,
    });
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const updated = await prisma.vocabularyEntry.update({
      where: { id: entry.id },
      data: parsed,
      select: { id: true, term: true, definition: true },
    });
    await logAuditAction(userId, "VOCABULARY_UPDATE", updated.id, "VocabularyEntry", {
      teamId,
      term: updated.term,
    });
    return NextResponse.json({ entry: updated });
  } catch (err) {
    console.error("[PATCH /api/team/vocabulary/[id]]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * DELETE /api/team/vocabulary/[id] — ADMIN or OWNER only, team-scoped.
 */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { teamId, entry } = await getOwnedEntry(userId, params.id);
    if (!teamId) {
      return NextResponse.json(
        { error: "You need to be on a team to manage vocabulary." },
        { status: 400 },
      );
    }
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.vocabularyEntry.delete({ where: { id: entry.id } });
    await logAuditAction(userId, "VOCABULARY_DELETE", entry.id, "VocabularyEntry", {
      teamId,
      term: entry.term,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/team/vocabulary/[id]]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
