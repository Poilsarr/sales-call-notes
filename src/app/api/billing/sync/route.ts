import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { getSecret } from "@/lib/secrets";
import { logAuditAction } from "@/lib/audit-logger";
import { PLANS } from "@/lib/plans";

function getPaddleEnvironment(): "production" | "sandbox" {
  return process.env.PADDLE_ENV === "production" ? "production" : "sandbox";
}

function mapPriceIdsToPlan(priceIds: string[]): string | null {
  for (const [tier, config] of Object.entries(PLANS)) {
    const ids = [config.paddlePriceId, config.paddlePriceIdAnnual].filter(Boolean) as string[];
    if (ids.some((id) => priceIds.includes(id))) {
      return tier.toUpperCase();
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If we don't know the Paddle customer ID yet, we can't sync.
    if (!user.paddleCustomerId) {
      return NextResponse.json(
        { error: "No Paddle customer linked yet. Complete a checkout first." },
        { status: 400 }
      );
    }

    const apiKey = getSecret("PADDLE_API_KEY");
    if (!apiKey) {
      return NextResponse.json({ error: "Paddle API key not configured" }, { status: 503 });
    }

    const baseUrl =
      getPaddleEnvironment() === "production"
        ? "https://api.paddle.com"
        : "https://sandbox-api.paddle.com";

    const listRes = await fetch(
      `${baseUrl}/subscriptions?customer_id=${encodeURIComponent(user.paddleCustomerId)}&per_page=10`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!listRes.ok) {
      const body = await listRes.json().catch(() => ({}));
      console.error("[BILLING_SYNC] Paddle list failed:", body);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions from Paddle" },
        { status: 502 }
      );
    }

    const listData = (await listRes.json()) as {
      data?: Array<{
        id: string;
        status: string;
        items: Array<{ price?: { id?: string } }>;
      }>;
    };

    const subscriptions = listData.data || [];

    // Prefer the first active subscription; fall back to trialing.
    const activeSub =
      subscriptions.find((s) => s.status === "active") ||
      subscriptions.find((s) => s.status === "trialing");

    if (!activeSub) {
      // No active subscription found. If user currently has a paid plan, mark them free.
      if (user.plan !== "FREE") {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: "FREE",
            subscriptionStatus: "canceled",
            credits: 5,
          },
        });
        await logAuditAction(user.id, "BILLING_SYNC_NO_ACTIVE", user.id, "User", {
          paddleCustomerId: user.paddleCustomerId,
        });
      }
      return NextResponse.json({
        success: true,
        synced: false,
        message: "No active Paddle subscription found. Plan set to Free.",
      });
    }

    const priceIds = activeSub.items
      .map((i) => i?.price?.id)
      .filter(Boolean) as string[];

    const plan = mapPriceIdsToPlan(priceIds);
    if (!plan) {
      return NextResponse.json(
        {
          error: "Active subscription uses an unmapped price ID",
          priceIds,
        },
        { status: 400 }
      );
    }

    const dbStatus = activeSub.status === "trialing" ? "active" : activeSub.status;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        paddleSubscriptionId: activeSub.id,
        subscriptionStatus: dbStatus,
        subscriptionPlan: plan,
        plan: dbStatus === "active" || dbStatus === "trialing" ? plan : "FREE",
        credits: dbStatus === "active" || dbStatus === "trialing" ? 999 : 5,
      },
    });

    await logAuditAction(user.id, "BILLING_SYNC", user.id, "User", {
      subscriptionId: activeSub.id,
      plan,
      status: dbStatus,
      priceIds,
    });

    return NextResponse.json({
      success: true,
      synced: true,
      plan: plan.toLowerCase(),
      subscriptionId: activeSub.id,
    });
  } catch (error) {
    console.error("[BILLING_SYNC] Error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
