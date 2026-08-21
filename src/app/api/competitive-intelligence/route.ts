import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/get-user';

export const dynamic = 'force-dynamic';

type TrendLegacy = { competitor: string; count: number };
type TrendBucket = { bucket: string; competitor: string; count: number };
type TrendShape = TrendLegacy[] | TrendBucket[];

function isoWeekBucket(d: Date): string {
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function monthBucket(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const rawCompetitor = url.searchParams.get('competitor');
    // Sanitize: strip ILIKE wildcards + control chars (H-01)
    const sanitizedCompetitor = rawCompetitor
      ? rawCompetitor.trim().replace(/[%_\\]/g, " ").replace(/[\r\n]/g, " ").trim().slice(0, 100)
      : "";
    const competitor = sanitizedCompetitor.length > 0 ? sanitizedCompetitor : undefined;
    const modeParam = url.searchParams.get('mode');
    const mode: 'watchlist' | 'all' = modeParam === 'all' ? 'all' : 'watchlist';
    const daysParam = url.searchParams.get('days');
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');
    const limitParam = url.searchParams.get('limit');
    const groupByParam = url.searchParams.get('groupBy') ?? 'week';
    const teamId = url.searchParams.get('teamId');

    let days = 30;
    if (daysParam !== null) {
      const parsed = Number(daysParam);
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1 || parsed > 365) {
        return NextResponse.json(
          { error: 'days must be an integer between 1 and 365' },
          { status: 400 },
        );
      }
      days = parsed;
    }

    const from = parseDate(fromParam);
    if (fromParam && !from) {
      return NextResponse.json({ error: 'from must be a valid ISO date' }, { status: 400 });
    }
    const to = parseDate(toParam);
    if (toParam && !to) {
      return NextResponse.json({ error: 'to must be a valid ISO date' }, { status: 400 });
    }
    if (from && to && to.getTime() < from.getTime()) {
      return NextResponse.json({ error: 'to must be on or after from' }, { status: 400 });
    }

    let limit = 50;
    if (limitParam !== null) {
      const parsed = Number(limitParam);
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1 || parsed > 200) {
        return NextResponse.json(
          { error: 'limit must be an integer between 1 and 200' },
          { status: 400 },
        );
      }
      limit = parsed;
    }

    if (groupByParam !== 'week' && groupByParam !== 'month') {
      return NextResponse.json(
        { error: 'groupBy must be "week" or "month"' },
        { status: 400 },
      );
    }

    const user = await getUserByClerkId(userId);
    const plan = ((user?.plan as string | undefined) ?? 'free').toLowerCase();
    if (plan === 'free') {
      return NextResponse.json(
        { error: 'Upgrade to Pro to access competitive intelligence', code: 'PLAN_REQUIRED' },
        { status: 403 },
      );
    }

    if (teamId && user.teamId !== teamId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const explicitRange = !!(from || to);
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (explicitRange) {
      if (from) dateFilter.gte = from;
      if (to) dateFilter.lte = to;
    } else {
      dateFilter.gte = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }

    const where: any = {
      call: {
        userId: user.id,
      },
    };
    if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;
    if (teamId) where.call.teamId = teamId;
    if (competitor) {
      const norm = competitor.trim().toLowerCase().replace(/\s+/g, " ").trim();
      if (norm.length > 0 && norm.length <= 100 && !/[%_\\]/.test(competitor)) {
        const probe = norm.replace(/\b(inc\.?|llc|ltd|corp\.?|co\.?)\b\.?$/i, "").trim();
        if (probe) {
          where.normalizedCompetitor = probe;
        } else {
          where.competitor = { contains: competitor, mode: 'insensitive' };
        }
      } else {
        where.competitor = { contains: competitor, mode: 'insensitive' };
      }
    }

    // Resolve effective company + watchlist for mode/meta
    let effectiveCompanyName: string | null = null;
    let watchlistSize = 0;
    try {
      if (user.teamId) {
        const team = await prisma.team.findUnique({ where: { id: user.teamId }, select: { companyName: true } });
        if (team?.companyName) effectiveCompanyName = team.companyName;
        watchlistSize = await prisma.trackedCompetitor.count({ where: { teamId: user.teamId } });
      } else {
        if (user.companyName) effectiveCompanyName = user.companyName;
        watchlistSize = await prisma.trackedCompetitor.count({ where: { userId: user.id } });
      }
      // Fallback: if team companyName empty, try user companyName
      if (!effectiveCompanyName && user.companyName) effectiveCompanyName = user.companyName;
    } catch {
      // fallback to defaults (discovery)
    }

    // Mode filter: watchlist only when watchlist non-empty, else discovery (all)
    const effectiveMode = mode === 'watchlist' && watchlistSize > 0 ? 'watchlist' as const : 'all' as const;
    if (effectiveMode === 'watchlist') {
      where.isWatchlistHit = true;
    }

    const mentions = await prisma.competitorMention.findMany({
      where,
      include: {
        call: {
          select: { id: true, filename: true, title: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const totalCount = await prisma.competitorMention.count({ where });
    const total = totalCount;

    let trend: TrendShape;
    let uniqueCompetitors: number;
    let topCompetitor: string | null;

    if (explicitRange) {
      // Fix: bucket the SAME where without pagination limit (previously bucketed only the page)
      const allForTrend = await prisma.competitorMention.findMany({
        where,
        select: { competitor: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });
      const bucketFn = groupByParam === 'month' ? monthBucket : isoWeekBucket;
      const buckets = new Map<string, TrendBucket>();
      for (const m of allForTrend) {
        const bucket = bucketFn(m.createdAt);
        const key = `${bucket}\u0000${m.competitor}`;
        const existing = buckets.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          buckets.set(key, { bucket, competitor: m.competitor, count: 1 });
        }
      }
      const entries = Array.from(buckets.values()).sort((a, b) => {
        if (a.bucket !== b.bucket) return a.bucket.localeCompare(b.bucket);
        return a.competitor.localeCompare(b.competitor);
      });
      trend = entries;

      const competitorCounts = new Map<string, number>();
      for (const m of allForTrend) {
        competitorCounts.set(m.competitor, (competitorCounts.get(m.competitor) ?? 0) + 1);
      }
      uniqueCompetitors = competitorCounts.size;
      const sortedCompetitors = Array.from(competitorCounts.entries()).sort((a, b) => b[1] - a[1]);
      topCompetitor = sortedCompetitors[0]?.[0] ?? null;
    } else {
      const aggregation = await prisma.competitorMention.groupBy({
        by: ['competitor'],
        where,
        _count: { competitor: true },
        orderBy: { _count: { competitor: 'desc' } },
      });
      uniqueCompetitors = aggregation.length;
      topCompetitor = aggregation[0]?.competitor ?? null;
      trend = aggregation.map((a) => ({
        competitor: a.competitor,
        count: a._count.competitor,
      }));
    }

    return NextResponse.json({
      mentions: mentions.map((m) => ({
        ...m,
        call: {
          ...m.call,
          displayName: m.call.title || m.call.filename,
        },
      })),
      trend,
      summary: {
        total,
        uniqueCompetitors,
        days,
        topCompetitor,
        from: from ? from.toISOString() : null,
        to: to ? to.toISOString() : null,
        groupBy: explicitRange ? groupByParam : null,
      },
      meta: {
        companyName: effectiveCompanyName,
        watchlistSize,
        mode: effectiveMode,
      },
    });
  } catch (error: any) {
    console.error('Competitive intelligence error:', error?.message);
    return NextResponse.json({ error: 'Failed to fetch competitive intelligence' }, { status: 500 });
  }
}
