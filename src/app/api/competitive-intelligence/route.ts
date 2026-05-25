import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const competitor = url.searchParams.get('competitor');
    const days = parseInt(url.searchParams.get('days') || '30');
    const teamId = url.searchParams.get('teamId');

    const since = new Date();
    since.setDate(since.getDate() - days);

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (teamId && user.teamId !== teamId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const where: any = {
      createdAt: { gte: since },
      call: {
        userId: user.id,
      },
    };

    if (teamId) where.call.teamId = teamId;
    if (competitor) where.competitor = { contains: competitor, mode: 'insensitive' };

    const mentions = await prisma.competitorMention.findMany({
      where,
      include: {
        call: {
          select: { id: true, filename: true, createdAt: true, userId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const aggregation = await prisma.competitorMention.groupBy({
      by: ['competitor'],
      where: {
        createdAt: { gte: since },
        call: { userId: user.id },
      },
      _count: { competitor: true },
      orderBy: { _count: { competitor: 'desc' } },
    });

    const total = mentions.length;
    const uniqueCompetitors = aggregation.length;
    const trend = aggregation.map((a) => ({
      competitor: a.competitor,
      count: a._count.competitor,
    }));

    return NextResponse.json({
      mentions,
      trend,
      summary: { total, uniqueCompetitors, days },
    });
  } catch (error: any) {
    console.error('Competitive intelligence error:', error?.message);
    return NextResponse.json({ error: 'Failed to fetch competitive intelligence' }, { status: 500 });
  }
}
