
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/get-user';
import { PLANS, PlanTier } from '@/lib/plans';

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserByClerkId(clerkUserId);

    const url = new URL(req.url);
    const rawQuery = (url.searchParams.get('q') || '').trim().slice(0, 100);
    const query = rawQuery.replace(/[%_\\]/g, ' ');

    const baseWhere = user.teamId
      ? {
          OR: [
            { userId: user.id },
            { teamId: user.teamId, sharedWithTeam: true },
          ],
        }
      : { userId: user.id };

    // ponytail: hide soft-archived calls from the owner's own list.
    // Team-shared calls are never archived (team plan = unlimited).
    const whereBase = user.teamId
      ? baseWhere
      : { ...baseWhere, archived: false };

    const textFilter = query
      ? {
          OR: [
            { filename: { contains: query, mode: 'insensitive' as const } },
            { transcript: { contains: query, mode: 'insensitive' as const } },
            { summary: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const where = textFilter
      ? { AND: [whereBase, textFilter] }
      : whereBase;

    const calls = await prisma.call.findMany({
      where,
      include: {
        actionItems: true,
        decisions: true,
        nextSteps: true,
        assignee: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    const normalized = calls.map(c => ({
      id: c.id,
      userId: c.userId,
      filename: c.filename,
      transcript: c.transcript,
      language: c.language,
      summary: c.summary,
      healthScore: c.healthScore,
      sentiment: c.sentiment,
      createdAt: c.createdAt,
      sharedWithTeam: c.sharedWithTeam,
      ownerName: c.user?.name || null,
      assigneeName: c.assignee?.name || null,
      actionItems: c.actionItems.map(a => ({ task: a.task, owner: a.owner, due: a.due })),
      keyDecisions: c.decisions.map(d => d.content),
      nextSteps: c.nextSteps.map(n => ({ step: n.step, date: n.date })),
    }));

    // ponytail: include plan retention metadata so the calls list can show
    // "X of Y kept" and prompt upgrade when at the free-plan cap.
    const plan = (user.plan?.toLowerCase() as PlanTier) || "free";
    const limit = PLANS[plan]?.uploadLimit ?? 5;
    const visibleCount = await prisma.call.count({
      where: user.teamId ? { userId: user.id } : { userId: user.id, archived: false },
    });

    return NextResponse.json({
      calls: normalized,
      plan,
      callLimit: limit,
      visibleCount,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserByClerkId(clerkUserId);

    const body = await req.json();
    const { filename, transcript, summary, healthScore } = body;

    if (!filename) {
      return NextResponse.json({ error: "filename required" }, { status: 400 });
    }

    const call = await prisma.call.create({
      data: {
        userId: user.id,
        teamId: user.teamId,
        sharedWithTeam: Boolean(user.teamId),
        filename,
        transcript: transcript || "",
        summary: summary || "",
        healthScore: healthScore || null,
      },
    });

    return NextResponse.json(call, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save call" }, { status: 500 });
  }
}
