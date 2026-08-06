import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/get-user";
import { getPaddleClient } from "@/lib/paddle";
import { logAuditAction } from "@/lib/audit-logger";
import { captureApiError } from "@/lib/sentry";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(userId);

    if (!user.paddleSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription" },
        { status: 400 },
      );
    }

    // Cancel the subscription at Paddle (cancel_at_period_end). Previously
    // this route only flipped local state — Paddle kept billing the user
    // while they lost access today.
    const paddle = getPaddleClient();
    try {
      await paddle.subscriptions.cancel(user.paddleSubscriptionId, {
        effectiveFrom: "next_billing_period",
      });
    } catch (err) {
      captureApiError("/api/billing/cancel", err, { phase: "paddle-cancel" });
      return NextResponse.json(
        { error: "Cancellation failed at payment provider. Please retry or contact support." },
        { status: 502 },
      );
    }

    const effectiveDate = new Date();
    effectiveDate.setDate(effectiveDate.getDate() + 30);

    // Keep the plan active until the effective date (cancel_at_period_end
    // semantics); the paddle subscription.canceled webhook flips plan to
    // FREE. Status string matches the webhook's "canceled" spelling — the
    // old "cancelled" never matched, so UI state drifted.
    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        subscriptionStatus: "canceled",
        cancellationEffectiveDate: effectiveDate,
      },
    });

    await logAuditAction(
      user.id,
      "CANCEL_SUBSCRIPTION",
      user.id,
      "User",
      { effectiveDate: effectiveDate.toISOString(), paddleCanceled: true },
    );

    return NextResponse.json({ success: true, effectiveDate: effectiveDate.toISOString() });
  } catch (error) {
    captureApiError("/api/billing/cancel", error);
    return NextResponse.json(
      { error: "Cancellation failed" },
      { status: 500 },
    );
  }
}
