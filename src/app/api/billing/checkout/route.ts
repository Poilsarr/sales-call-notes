import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/get-user";
import { getPaddleClient } from "@/lib/paddle";
import { PLANS, PlanTier } from "@/lib/plans";
import { logAuditAction } from "@/lib/audit-logger";
import { captureApiError } from "@/lib/sentry";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { plan } = await req.json();
    const planConfig = PLANS[plan as PlanTier];
    if (!planConfig?.paddlePriceId) {
      return NextResponse.json({ error: "Invalid plan or free tier" }, { status: 400 });
    }

    const user = await getUserByClerkId(clerkId);
    const paddle = getPaddleClient();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sales-call-notes.vercel.app";

    // ponytail: create draft transaction with hosted checkout.
    // Paddle auto-creates subscription when checkout completes.
    const transaction = await paddle.transactions.create({
      items: [{ priceId: planConfig.paddlePriceId, quantity: 1 }],
      ...(user.paddleCustomerId ? { customerId: user.paddleCustomerId } : {}),
      checkout: { url: `${appUrl}/billing` },
      customData: { clerkUserId: clerkId, userId: user.id },
    });

    await logAuditAction(user.id, "CHECKOUT_CREATED", user.id, "User", {
      plan,
      priceId: planConfig.paddlePriceId,
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
