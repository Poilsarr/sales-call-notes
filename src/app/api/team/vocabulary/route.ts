import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAuditAction } from "@/lib/audit-logger";
import {
  VOCABULARY_TEAM_LIMIT,
  countTeamVocabulary,
  validateVocabularyEntry,
} from "@/lib/team-vocabulary";

async function resolveTeamId(clerkId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { teamId: true },
  });
  return user?.teamId ?? null;
}

/**
 * GET /api/team/vocabulary
 *   Lists the current team's glossary (any team member). 200 with an
 *   empty array when the user has no team.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const teamId = await resolveTeamId(userId);
    if (!teamId) return NextResponse.json({ entries: [] });

    const { allowed, userRole } = await requireRole(userId, teamId, "MEMBER");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const entries = await prisma.vocabularyEntry.findMany({
      where: { teamId },
      orderBy: { term: "asc" },
      select: { id: true, term: true, definition: true },
    });
    return NextResponse.json({ entries, role: userRole });
  } catch (err) {
    console.error("[GET /api/team/vocabulary]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/team/vocabulary
 *   Body: { term, definition } — ADMIN or OWNER only. Caps the glossary
 *   at VOCABULARY_TEAM_LIMIT entries so a runaway team can't inflate
 *   every analysis prompt.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const teamId = await resolveTeamId(userId);
    if (!teamId) {
      return NextResponse.json(
        { error: "You need to be on a team to manage vocabulary." },
        { status: 400 },
      );
    }

    const { allowed } = await requireRole(userId, teamId, "ADMIN");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const parsed = validateVocabularyEntry(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const count = await countTeamVocabulary(teamId);
    if (count >= VOCABULARY_TEAM_LIMIT) {
      return NextResponse.json(
        { error: `Glossary is capped at ${VOCABULARY_TEAM_LIMIT} terms. Delete one first.` },
        { status: 400 },
      );
    }

    const entry = await prisma.vocabularyEntry.create({
      data: { teamId, ...parsed },
      select: { id: true, term: true, definition: true },
    });
    await logAuditAction(userId, "VOCABULARY_CREATE", entry.id, "VocabularyEntry", {
      teamId,
      term: entry.term,
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/team/vocabulary]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
