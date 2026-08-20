import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PLANS, PlanTier } from "@/lib/plans";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from '@/lib/get-user';
import { logAuditAction } from "@/lib/audit-logger";
import { captureApiError } from "@/lib/sentry";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserByClerkId(userId);
    const plan: PlanTier = (user?.plan?.toLowerCase() as PlanTier) || "free";

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [usage, minuteAgg] = await Promise.all([
      prisma.call.count({
        where: { userId, createdAt: { gte: startOfMonth } },
      }),
      prisma.call.aggregate({
        where: { userId, createdAt: { gte: startOfMonth } },
        _sum: { duration: true },
      }),
    ]);

    const durationSeconds = minuteAgg._sum.duration || 0;
    const minuteUsage = Math.round(durationSeconds / 60);

    let teamMemberCount = 1;
    if (user?.teamId) {
      teamMemberCount = await prisma.user.count({
        where: { teamId: user.teamId },
      });
    }

    return NextResponse.json({
      plan,
      planName: (PLANS[plan] || PLANS.free).name,
      usage,
      minuteUsage,
      limit: PLANS[plan].uploadLimit,
      minuteLimit: PLANS[plan].minuteLimit,
      teamMemberCount,
      teamMemberLimit: PLANS[plan].teamMemberLimit,
      features: PLANS[plan].features,
      subscriptionStatus: user?.subscriptionStatus || null,
      subscriptionPlan: user?.subscriptionPlan || null,
      paddleSubscriptionId: user?.paddleSubscriptionId || null,
      paddleCustomerId: user?.paddleCustomerId || null,
      trialEndsAt: user?.trialEndsAt?.toISOString() || null,
      cancellationEffectiveDate: user?.cancellationEffectiveDate?.toISOString() || null,
    });
  } catch (error) {
    captureApiError("/api/billing", error, { method: "GET" });
    return NextResponse.json({ error: "Failed to get billing info" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { plan: targetPlan } = await req.json();
    if (!targetPlan) {
      return NextResponse.json({ error: "plan required" }, { status: 400 });
    }

    if (!PLANS[targetPlan as PlanTier]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    let user = await getUserByClerkId(userId);

    if (targetPlan === "free") {
      if (user) {
        await prisma.user.update({
          where: { clerkId: userId },
          data: { plan: "FREE", credits: 5 },
        });
        await logAuditAction(user.id, "CHANGE_PLAN", user.id, "User", { newPlan: "FREE" });
      }
      return NextResponse.json({ success: true, plan: "free" });
    }

    if (!user) {
      // Never auto-create users with paid plans — previously this granted
      // BUSINESS + 999 credits to anyone who called this endpoint.
      return NextResponse.json(
        { error: "No account found. Upgrade through checkout instead." },
        { status: 403 },
      );
    }

    // Paid tiers must be backed by an active Paddle subscription for that
    // plan. Previously any authenticated user could self-grant any paid plan.
    const hasEntitlement =
      user.subscriptionStatus === "active" &&
      user.subscriptionPlan === targetPlan.toUpperCase();

    if (!hasEntitlement) {
      return NextResponse.json(
        { error: "No active subscription for this plan. Upgrade through checkout." },
        { status: 403 },
      );
    }

    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        plan: targetPlan.toUpperCase() as any,
        subscriptionStatus: "active",
        subscriptionPlan: targetPlan.toUpperCase(),
      },
    });
    await logAuditAction(user.id, "CHANGE_PLAN", user.id, "User", { newPlan: targetPlan });

    return NextResponse.json({ success: true, plan: targetPlan });
  } catch (error) {
    captureApiError("/api/billing", error, { method: "POST" });
    return NextResponse.json({ error: "Billing update failed" }, { status: 500 });
  }
}
