
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || '';

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const calls = await prisma.call.findMany({
      where: { userId },
      include: { actionItems: true, decisions: true, nextSteps: true },
      orderBy: { createdAt: 'desc' }
    });

    const normalized = calls.map(c => ({
      id: c.id,
      userId: c.userId,
      filename: c.filename,
      transcript: c.transcript,
      summary: c.summary,
      healthScore: c.healthScore,
      sentiment: c.sentiment,
      createdAt: c.createdAt,
      actionItems: c.actionItems.map(a => ({ task: a.task, owner: a.owner, due: a.due })),
      keyDecisions: c.decisions.map(d => d.content),
      nextSteps: c.nextSteps.map(n => ({ step: n.step, date: n.date })),
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, filename, transcript, summary, healthScore } = body;

    if (!userId || !filename) {
      return NextResponse.json({ error: "userId and filename required" }, { status: 400 });
    }

    const call = await prisma.call.create({
      data: {
        userId,
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
