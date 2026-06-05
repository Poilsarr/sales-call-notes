import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AnalyticsService } from '@/services/ai/analytics';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/get-user';

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserByClerkId(clerkUserId);

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    const scope = searchParams.get('scope') || 'personal';

    const since = new Date();
    since.setDate(since.getDate() - days);

    const calls = await prisma.call.findMany({
      where: scope === 'team' && user.teamId
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
        // Assignee depends on the latest DB migration, so keep dashboard resilient before rollout.
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCalls = calls.length;
    const totalActionItems = calls.reduce((sum, c) => sum + c.actionItems.length, 0);
    const completedItems = calls.reduce((sum, c) =>
      sum + c.actionItems.filter(a => a.status === "COMPLETED").length, 0);
    const avgHealthScore = calls.length > 0
      ? calls.reduce((sum, c) => sum + (c.healthScore || 0), 0) / calls.length
      : 0;

    const avgCloseProbability = calls.length > 0
      ? calls.reduce((sum, c) => sum + (c.insight?.closeProbability || 0), 0) / calls.length
      : 0;

    const callsByDay: Record<string, number> = {};
    const scoresByDay: Record<string, number> = {};
    calls.forEach(c => {
      const day = c.createdAt.toISOString().split('T')[0];
      callsByDay[day] = (callsByDay[day] || 0) + 1;
      scoresByDay[day] = c.healthScore || 0;
    });

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    calls.forEach(c => {
      if (c.sentiment === "positive") sentimentCounts.positive++;
      else if (c.sentiment === "negative") sentimentCounts.negative++;
      else sentimentCounts.neutral++;
    });

    const budgetSignals = calls.filter(c => c.analytics?.budgetMentioned).length;
    const timelineSignals = calls.filter(c => c.analytics?.timelineMentioned).length;
    const dmSignals = calls.filter(c => c.analytics?.decisionMakerPresent).length;
    const totalInterruptions = calls.reduce((sum, c) => sum + (c.analytics?.interruptions || 0), 0);
    const totalQuestionsAsked = calls.reduce((sum, c) => sum + (c.analytics?.questionsAsked || 0), 0);
    const speakerLeaderboard = calls
      .flatMap((c) => ((c.analytics?.speakerMetrics as any[]) || []))
      .reduce<Record<string, { speaker: string; calls: number; questionsAsked: number; interruptions: number }>>((acc, metric) => {
        const existing = acc[metric.speaker] || {
          speaker: metric.speaker,
          calls: 0,
          questionsAsked: 0,
          interruptions: 0,
        };
        existing.calls += 1;
        existing.questionsAsked += metric.questionsAsked || 0;
        existing.interruptions += metric.interruptions || 0;
        acc[metric.speaker] = existing;
        return acc;
      }, {});

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
      speakerLeaderboard: Object.values(speakerLeaderboard).sort((a, b) => b.questionsAsked - a.questionsAsked).slice(0, 5),
      recentCalls: calls.slice(0, 5).map(c => ({
        id: c.id,
        filename: c.filename,
        date: c.createdAt,
        healthScore: c.healthScore,
        sentiment: c.sentiment,
        actionItemCount: c.actionItems.length,
        closeProbability: c.insight?.closeProbability || null,
        topObjection: (c.insight?.objections as any[])?.[0]?.type || null,
        ownerName: (c as any).user?.name || null,
        assigneeName: null,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Analytics failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { transcript, speakers, callId } = await req.json();
    if (!transcript) {
      return NextResponse.json({ error: "transcript required" }, { status: 400 });
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
  } catch (error) {
    return NextResponse.json({ error: "Analytics processing failed" }, { status: 500 });
  }
}
