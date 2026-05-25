
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/get-user';

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserByClerkId(clerkUserId);

    const calls = await prisma.call.findMany({
      where: user.teamId
        ? {
            OR: [
              { userId: user.id },
              { teamId: user.teamId, sharedWithTeam: true },
            ],
          }
        : { userId: user.id },
      include: {
        actionItems: true,
        decisions: true,
        nextSteps: true,
        assignee: { select: { name: true } },
        user: { select: { name: true } },
      } as any,
      orderBy: { createdAt: 'desc' }
    });

    const normalized = (calls as any[]).map(c => ({
      id: c.id,
      userId: c.userId,
      filename: c.filename,
      transcript: c.transcript,
      language: c.language,
      summary: c.summary,
      healthScore: c.healthScore,
      sentiment: c.sentiment,
      createdAt: c.createdAt,
      sharedWithTeam: (c as any).sharedWithTeam,
      ownerName: (c as any).user?.name || null,
      assigneeName: (c as any).assignee?.name || null,
      actionItems: (c.actionItems as any[]).map((a: any) => ({ task: a.task, owner: a.owner, due: a.due })),
      keyDecisions: (c.decisions as any[]).map((d: any) => d.content),
      nextSteps: (c.nextSteps as any[]).map((n: any) => ({ step: n.step, date: n.date })),
    }));

    return NextResponse.json(normalized);
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
