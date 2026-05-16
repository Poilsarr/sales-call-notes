import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PLANS, PlanTier } from "@/lib/plans";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

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
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get billing info" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, plan: targetPlan } = await req.json();
    if (!userId || !targetPlan) {
      return NextResponse.json({ error: "userId and plan required" }, { status: 400 });
    }

    if (!PLANS[targetPlan as PlanTier]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { clerkId: userId } });

    if (targetPlan === "free") {
      if (user) {
        await prisma.user.update({ where: { clerkId: userId }, data: { plan: "FREE" } });
      }
      return NextResponse.json({ success: true, plan: "free" });
    }

    const planConfig = PLANS[targetPlan as PlanTier];

    if (!process.env.STRIPE_SECRET_KEY) {
      if (!user) {
        await prisma.user.create({ data: { clerkId: userId, email: "", plan: targetPlan.toUpperCase() as any, credits: 999 } });
      } else {
        await prisma.user.update({ where: { clerkId: userId }, data: { plan: targetPlan.toUpperCase() as any, credits: 999 } });
      }
      return NextResponse.json({ success: true, plan: targetPlan, mock: true });
    }

    return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });
  } catch (error) {
    return NextResponse.json({ error: "Billing update failed" }, { status: 500 });
  }
}
