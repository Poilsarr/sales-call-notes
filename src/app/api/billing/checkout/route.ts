import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/get-user";
import { getPaddleClient } from "@/lib/paddle";
import { PLANS, PlanTier, assertPriceIdsConfigured } from "@/lib/plans";
import { logAuditAction } from "@/lib/audit-logger";
import { captureApiError } from "@/lib/sentry";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { plan, cycle } = await req.json();
    const planConfig = PLANS[plan as PlanTier];
    if (!planConfig?.paddlePriceId) {
      return NextResponse.json({ error: "Invalid plan or free tier" }, { status: 400 });
    }

    try {
      assertPriceIdsConfigured();
    } catch (e: any) {
      console.error(e.message);
      return NextResponse.json(
        { error: "Billing is not configured. Contact support." },
        { status: 503 }
      );
    }

    const normalizedCycle = String(cycle || "").toLowerCase();
    if (normalizedCycle && normalizedCycle !== "monthly" && normalizedCycle !== "annual") {
      return NextResponse.json(
        { error: "Invalid billing cycle. Expected 'monthly' or 'annual'." },
        { status: 400 }
      );
    }
    const isAnnual = normalizedCycle === "annual";

    const priceId =
      isAnnual && planConfig.paddlePriceIdAnnual
        ? planConfig.paddlePriceIdAnnual
        : planConfig.paddlePriceId;

    const user = await getUserByClerkId(clerkId);
    const paddle = getPaddleClient();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://usegauge.vercel.app";

    // ponytail: create draft transaction with hosted checkout.
    // Paddle auto-creates subscription when checkout completes.
    const transaction = await paddle.transactions.create({
      items: [{ priceId, quantity: 1 }],
      ...(user.paddleCustomerId ? { customerId: user.paddleCustomerId } : {}),
      checkout: { url: `${appUrl}/billing` },
      customData: { clerkUserId: clerkId, userId: user.id },
    });

    await logAuditAction(user.id, "CHECKOUT_CREATED", user.id, "User", {
      plan,
      cycle: isAnnual ? "annual" : "monthly",
      priceId,
      transactionId: transaction.id,
    });

    return NextResponse.json({
      transactionId: transaction.id,
      checkoutUrl: transaction.checkout?.url || null,
    });
  } catch (error) {
    captureApiError("/api/billing/checkout", error, { method: "POST" });
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}
