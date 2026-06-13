import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/get-user";
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

    const effectiveDate = new Date();
    effectiveDate.setDate(effectiveDate.getDate() + 30);

    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        plan: "FREE",
        subscriptionStatus: "cancelled",
        cancellationEffectiveDate: effectiveDate,
        credits: 5,
      },
    });

    await logAuditAction(
      user.id,
      "CANCEL_SUBSCRIPTION",
      user.id,
      "User",
      { effectiveDate: effectiveDate.toISOString() },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    captureApiError("/api/billing/cancel", error);
    return NextResponse.json(
      { error: "Cancellation failed" },
      { status: 500 },
    );
  }
}
