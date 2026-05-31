import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPaddleClient } from "@/lib/paddle";
import { getSecret } from "@/lib/secrets";
import { logAuditAction } from "@/lib/audit-logger";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("paddle-signature") || "";
    const secret = getSecret("PADDLE_WEBHOOK_SECRET") || "";

    const paddle = getPaddleClient();
    let event: any;

    try {
      event = await paddle.webhooks.unmarshal(rawBody, secret, signature);
    } catch (e) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const eventType: string = event.eventType;
    const data: any = event.data;

    switch (eventType) {
      case "subscription.created":
      case "subscription.updated":
      case "subscription.activated": {
        const customerId: string = data.customerId;
        const subscriptionId: string = data.id;
        const status: string = data.status;
        const priceId: string = data.items?.[0]?.price?.id || "";

        let plan: string = "FREE";
        const { PLANS } = await import("@/lib/plans");
        for (const [tier, config] of Object.entries(PLANS)) {
          if (config.paddlePriceId === priceId) {
            plan = tier.toUpperCase();
            break;
          }
        }

        const dbStatus = status === "active" || status === "trialing" ? "active" : status;

        const existing = await prisma.user.findFirst({
          where: { paddleSubscriptionId: subscriptionId },
          select: { subscriptionStatus: true },
        });
        if (existing && existing.subscriptionStatus === dbStatus) {
          return NextResponse.json({ received: true, deduped: true });
        }

        await prisma.user.updateMany({
          where: { paddleCustomerId: customerId },
          data: {
            paddleSubscriptionId: subscriptionId,
            subscriptionStatus: dbStatus,
            subscriptionPlan: plan,
            plan: dbStatus === "active" ? plan : "FREE",
            credits: dbStatus === "active" ? 999 : 5,
          },
        });

        await logAuditAction("SYSTEM", "PADDLE_WEBHOOK_SYNC", customerId, "User", {
          eventType,
          subscriptionId,
          plan,
          status: dbStatus
        });

        break;
      }

      case "subscription.canceled": {
        const subscriptionId: string = data.id;
        await prisma.user.updateMany({
          where: { paddleSubscriptionId: subscriptionId },
          data: {
            subscriptionStatus: "canceled",
            plan: "FREE",
            credits: 5,
          },
        });
        await logAuditAction("SYSTEM", "PADDLE_WEBHOOK_CANCEL", subscriptionId, "User", { eventType });
        break;
      }

      case "transaction.completed": {
        const customerId: string | null = data.customerId;
        const subscriptionId: string | null = data.subscriptionId;

        if (customerId && !subscriptionId) {
          await prisma.user.updateMany({
            where: { paddleCustomerId: customerId },
            data: { credits: 999 },
          });
          await logAuditAction("SYSTEM", "PADDLE_TRANSACTION_CREDITS", customerId, "User", { eventType });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paddle webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
