import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const call = await prisma.call.findUnique({
      where: { id: params.id },
      include: {
        insight: true,
        actionItems: true,
        decisions: true,
        nextSteps: true,
        speakers: true,
        analytics: true,
      },
    });

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    return NextResponse.json(call);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch call' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.callInsight.deleteMany({ where: { callId: params.id } });
    await prisma.actionItem.deleteMany({ where: { callId: params.id } });
    await prisma.decision.deleteMany({ where: { callId: params.id } });
    await prisma.nextStep.deleteMany({ where: { callId: params.id } });
    await prisma.speaker.deleteMany({ where: { callId: params.id } });
    await prisma.analytics.deleteMany({ where: { callId: params.id } });
    await prisma.call.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete call" }, { status: 500 });
  }
}
