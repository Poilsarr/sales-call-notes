import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AnalyticsService } from '@/services/ai/analytics';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/get-user';

function safeJsonParse<T>(value: unknown): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value as T;
}

function asArray(value: unknown): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  const parsed = safeJsonParse<any[]>(value);
  return Array.isArray(parsed) ? parsed : [];
}

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await getUserByClerkId(clerkUserId);

    const { searchParams } = new URL(req.url);
    const daysRaw = searchParams.get('days') || '30';
    const days = Number.isFinite(Number(daysRaw)) ? Math.max(1, Number(daysRaw)) : 30;
    const scope = searchParams.get('scope') || 'personal';

    const since = new Date();
    since.setDate(since.getDate() - days);

    const calls = await prisma.call.findMany({
      where:
        scope === 'team' && user.teamId
          ? { teamId: user.teamId, sharedWithTeam: true, createdAt: { gte: since } }
          : { userId: user.id, createdAt: { gte: since } },
      select: {
        id: true,
        filename: true,
        createdAt: true,
        healthScore: true,
        sentiment: true,
        actionItems: true,
        analytics: true,
        insight: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCalls = calls.length;
    const totalActionItems = calls.reduce((sum, c) => sum + c.actionItems.length, 0);
    const completedItems = calls.reduce(
      (sum, c) => sum + c.actionItems.filter((a) => a.status === 'COMPLETED').length,
      0,
    );
    const avgHealthScore =
      calls.length > 0 ? calls.reduce((sum, c) => sum + (c.healthScore || 0), 0) / calls.length : 0;

    const avgCloseProbability =
      calls.length > 0
        ? calls.reduce((sum, c) => sum + (typeof c.insight?.closeProbability === 'number' ? c.insight?.closeProbability : 0), 0) /
          calls.length
        : 0;

    const callsByDay: Record<string, number> = {};
    const scoresByDay: Record<string, number> = {};
    calls.forEach((c) => {
      const day = c.createdAt.toISOString().split('T')[0];
      callsByDay[day] = (callsByDay[day] || 0) + 1;
      scoresByDay[day] = c.healthScore || 0;
    });

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    calls.forEach((c) => {
      if (c.sentiment === 'positive') sentimentCounts.positive++;
      else if (c.sentiment === 'negative') sentimentCounts.negative++;
      else sentimentCounts.neutral++;
    });

    const analyticsRows = calls.map((c) => c.analytics).filter(Boolean);

    const budgetSignals = analyticsRows.filter((a: any) => Boolean(a?.budgetMentioned)).length;
    const timelineSignals = analyticsRows.filter((a: any) => Boolean(a?.timelineMentioned)).length;
    const dmSignals = analyticsRows.filter((a: any) => Boolean(a?.decisionMakerPresent)).length;

    const totalInterruptions = analyticsRows.reduce(
      (sum: number, a: any) => sum + (typeof a?.interruptions === 'number' ? a.interruptions : 0),
      0,
    );
    const totalQuestionsAsked = analyticsRows.reduce(
      (sum: number, a: any) => sum + (typeof a?.questionsAsked === 'number' ? a.questionsAsked : 0),
      0,
    );

    const speakerLeaderboard = calls
      .flatMap((c) => asArray((c as any).analytics?.speakerMetrics))
      .reduce<
        Record<string, { speaker: string; calls: number; questionsAsked: number; interruptions: number }>
      >((acc, metric) => {
        if (!metric || typeof metric !== 'object') return acc;
        const speaker = (metric as any).speaker;
        if (!speaker) return acc;

        const existing = acc[speaker] || {
          speaker,
          calls: 0,
          questionsAsked: 0,
          interruptions: 0,
        };

        existing.calls += 1;
        existing.questionsAsked += typeof (metric as any).questionsAsked === 'number' ? (metric as any).questionsAsked : 0;
        existing.interruptions += typeof (metric as any).interruptions === 'number' ? (metric as any).interruptions : 0;
        acc[speaker] = existing;

        return acc;
      }, {});

    const recentCalls = calls.slice(0, 5).map((c) => {
      const insight: any = c.insight || null;

      const closeProbability =
        typeof insight?.closeProbability === 'number' ? insight.closeProbability : null;

      // insight.objections is Json? in schema; stored shape may be:
      // - array of { type, ... }
      // - array of strings
      // - stringified JSON
      const objectionsArr = asArray(insight?.objections);
      const topObjection =
        objectionsArr.length > 0
          ? typeof objectionsArr[0] === 'string'
            ? objectionsArr[0]
            : objectionsArr[0]?.type || null
          : null;

      return {
        id: c.id,
        filename: c.filename,
        date: c.createdAt,
        healthScore: c.healthScore,
        sentiment: c.sentiment,
        actionItemCount: c.actionItems.length,
        closeProbability,
        topObjection,
        ownerName: (c as any).user?.name || null,
        assigneeName: null,
      };
    });

    return NextResponse.json({
      scope,
      totalCalls,
      totalActionItems,
      completionRate: totalActionItems > 0 ? completedItems / totalActionItems : 0,
      avgHealthScore: Math.round(avgHealthScore * 100),
      avgCloseProbability: Math.round(avgCloseProbability),
      callsByDay,
      scoresByDay,
      sentimentCounts,
      signals: { budgetSignals, timelineSignals, dmSignals },
      conversationSignals: {
        totalInterruptions,
        totalQuestionsAsked,
      },
      speakerLeaderboard: Object.values(speakerLeaderboard)
        .sort((a, b) => (b.questionsAsked || 0) - (a.questionsAsked || 0))
        .slice(0, 5),
      recentCalls,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    // Intentionally avoid leaking internals to client.
    return NextResponse.json({ error: 'Analytics failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { transcript, speakers, callId } = await req.json();
    if (!transcript) {
      return NextResponse.json({ error: 'transcript required' }, { status: 400 });
    }

    const analyticsService = new AnalyticsService();
    const analytics = await analyticsService.analyzeCall(transcript, speakers || []);

    if (callId) {
      await prisma.analytics.upsert({
        where: { callId },
        update: {
          talkRatio: JSON.stringify(analytics.talkRatio),
          interruptions: analytics.interruptions,
          questionsAsked: analytics.questionsAsked,
          objections: JSON.stringify(analytics.objections),
          budgetMentioned: analytics.budgetMentioned,
          timelineMentioned: analytics.timelineMentioned,
          decisionMakerPresent: analytics.decisionMakerPresent,
          competitorMentioned: analytics.competitorMentioned,
        },
        create: {
          callId,
          talkRatio: JSON.stringify(analytics.talkRatio),
          interruptions: analytics.interruptions,
          questionsAsked: analytics.questionsAsked,
          objections: JSON.stringify(analytics.objections),
          budgetMentioned: analytics.budgetMentioned,
          timelineMentioned: analytics.timelineMentioned,
          decisionMakerPresent: analytics.decisionMakerPresent,
          competitorMentioned: analytics.competitorMentioned,
        },
      });
    }

    return NextResponse.json(analytics);
  } catch {
    return NextResponse.json({ error: 'Analytics processing failed' }, { status: 500 });
  }
}
