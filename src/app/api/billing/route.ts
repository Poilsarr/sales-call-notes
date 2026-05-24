import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PLANS, PlanTier } from "@/lib/plans";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    const plan: PlanTier = (user?.plan as PlanTier) || "free";

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const usage = await prisma.call.count({
      where: { userId, createdAt: { gte: startOfMonth } },
    });

    return NextResponse.json({
      plan,
      usage,
      limit: PLANS[plan].uploadLimit,
      minuteLimit: PLANS[plan].minuteLimit,
      features: PLANS[plan].features,
      subscriptionStatus: user?.subscriptionStatus || null,
      subscriptionPlan: user?.subscriptionPlan || null,
    });
  } catch (error) {
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

    let user = await prisma.user.findUnique({ where: { clerkId: userId } });

    if (targetPlan === "free") {
      if (user) {
        await prisma.user.update({
          where: { clerkId: userId },
          data: { plan: "FREE", credits: 5 },
        });
      }
      return NextResponse.json({ success: true, plan: "free" });
    }

    const planConfig = PLANS[targetPlan as PlanTier];

    if (!user) {
      await prisma.user.create({
        data: {
          clerkId: userId,
          email: "",
          plan: targetPlan.toUpperCase() as any,
          credits: 999,
        },
      });
    } else {
      await prisma.user.update({
        where: { clerkId: userId },
        data: { plan: targetPlan.toUpperCase() as any, credits: 999 },
      });
    }

    return NextResponse.json({ success: true, plan: targetPlan });
  } catch (error) {
    return NextResponse.json({ error: "Billing update failed" }, { status: 500 });
  }
}
