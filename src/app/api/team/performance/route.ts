import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: { clerkId: userId, email: `${userId}@placeholder.dev`, name: '' },
    });

    if (!user.teamId) {
      return NextResponse.json({ calls: [], members: [], hasTeam: false });
    }

    // ponytail: fetch all team calls (not just shared), include owner/assignee/actionItems
    const calls = await prisma.call.findMany({
      where: { teamId: user.teamId },
      include: {
        actionItems: true,
        user: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      } as any,
      orderBy: { createdAt: 'desc' },
    });

    const members = await prisma.user.findMany({
      where: { teamId: user.teamId },
      select: { id: true, name: true, email: true },
    });

    const formatted = calls.map((call) => ({
      id: call.id,
      filename: call.filename,
      title: call.title,
      displayName: call.title || call.filename,
      createdAt: call.createdAt,
      healthScore: call.healthScore,
      sentiment: call.sentiment,
      ownerName: (call as any).user?.name || (call as any).user?.email || 'Unknown',
      assigneeName: (call as any).assignee?.name || (call as any).assignee?.email || null,
      actionItemCount: (call as any).actionItems?.length || 0,
      openActionItems: (call as any).actionItems?.filter((i: any) => i.status !== 'COMPLETED').length || 0,
    }));

    return NextResponse.json({ calls: formatted, members, hasTeam: true });
  } catch (error: any) {
    console.error('Team performance error:', error?.message);
    return NextResponse.json({ error: 'Failed to fetch performance data' }, { status: 500 });
  }
}
