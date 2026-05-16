import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
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
