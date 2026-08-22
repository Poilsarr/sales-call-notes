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
    const notificationId: string | undefined =
      (event as any).eventId || (event as any).notificationId || (event as any).id || undefined;

    // H3: true idempotency — Paddle retries on non-2xx, so dedup by event id
    if (notificationId) {
      try {
        await prisma.paddleEvent.create({ data: { id: notificationId, type: eventType } });
      } catch (e: any) {
        if (e?.code === "P2002") {
          return NextResponse.json({ received: true, deduped: true, reason: "event_id" });
        }
        throw e;
      }
    }

    switch (eventType) {
      case "subscription.created":
      case "subscription.updated":
      case "subscription.activated": {
        const customerId: string = data.customerId;
        const subscriptionId: string = data.id;
        const status: string = data.status;
        const itemPriceIds: string[] = (data.items || [])
          .map((i: any) => i?.price?.id)
          .filter(Boolean);
        const customData: { clerkUserId?: string; userId?: string } = data.customData || {};

        let plan: string = "FREE";
        const { PLANS } = await import("@/lib/plans");
        for (const [tier, config] of Object.entries(PLANS)) {
          const monthlyId: string | undefined = config.paddlePriceId;
          const annualId: string | undefined = config.paddlePriceIdAnnual;
          if (
            (monthlyId !== undefined && itemPriceIds.includes(monthlyId)) ||
            (annualId !== undefined && itemPriceIds.includes(annualId))
          ) {
            plan = tier.toUpperCase();
            break;
          }
        }

        const dbStatus = status === "active" || status === "trialing" ? "active" : status;

        // H1: dedup by (subscriptionId, status) still useful as second guard
        const existing = await prisma.user.findFirst({
          where: { paddleSubscriptionId: subscriptionId },
          select: { subscriptionStatus: true },
        });
        if (existing && existing.subscriptionStatus === dbStatus) {
          return NextResponse.json({ received: true, deduped: true });
        }

        // ponytail: first checkout creates a new Paddle customer, so the user
        // row doesn't have paddleCustomerId yet. Fall back to customData
        // (clerkUserId / userId) sent from checkout, and persist the Paddle
        // customer ID for future webhooks.
        const whereClause: any[] = [{ paddleCustomerId: customerId }];
        if (customData.clerkUserId) {
          whereClause.push({ clerkId: customData.clerkUserId });
        }
        if (customData.userId) {
          whereClause.push({ id: customData.userId });
        }

        const targetUser = await prisma.user.findFirst({
          where: { OR: whereClause },
          select: { id: true, clerkId: true },
        });

        if (!targetUser) {
          // H1: Paddle retries on 404 for 3 days → spam. Dead-letter with 200 instead.
          console.error(
            "[PADDLE_WEBHOOK] Could not find user — dead-lettering, Paddle will not retry. " +
            `customerId=${customerId} subscriptionId=${subscriptionId} ` +
            `customData=${JSON.stringify(customData)} eventType=${eventType}`
          );
          await prisma.auditLog
            .create({
              data: {
                action: "PADDLE_WEBHOOK_ORPHAN",
                entityId: subscriptionId,
                metadata: { customerId, subscriptionId, customData, eventType, notificationId },
              },
            })
            .catch(() => {});
          return NextResponse.json({ received: true, orphan: true }, { status: 200 });
        }

        // H2: FREE fallback must NOT corrupt active users — keep prior plan
        if (plan === "FREE" && status === "active") {
          console.error(
            "[PADDLE_WEBHOOK] Active subscription with unmapped price IDs — NOT downgrading to FREE. " +
            `customerId=${customerId} subscriptionId=${subscriptionId} priceIds=${JSON.stringify(itemPriceIds)}`
          );
          const keep = await prisma.user.findUnique({ where: { id: targetUser.id }, select: { plan: true } });
          const keepPlan = keep?.plan ?? "FREE";
          await prisma.user.update({
            where: { id: targetUser.id },
            data: {
              paddleCustomerId: customerId,
              paddleSubscriptionId: subscriptionId,
              subscriptionStatus: dbStatus,
              subscriptionPlan: "UNKNOWN",
              plan: keepPlan,
              credits: keepPlan !== "FREE" ? 999 : 5,
            },
          });
          await logAuditAction("SYSTEM", "PADDLE_WEBHOOK_UNMAPPED", targetUser.id, "User", {
            eventType,
            subscriptionId,
            customerId,
            itemPriceIds,
            keptPlan: keepPlan,
          });
          break;
        }

        await prisma.user.update({
          where: { id: targetUser.id },
          data: {
            paddleCustomerId: customerId,
            paddleSubscriptionId: subscriptionId,
            subscriptionStatus: dbStatus,
            subscriptionPlan: plan,
            plan: dbStatus === "active" ? plan : "FREE",
            credits: dbStatus === "active" ? 999 : 5,
          },
        });

        await logAuditAction("SYSTEM", "PADDLE_WEBHOOK_SYNC", targetUser.id, "User", {
          eventType,
          subscriptionId,
          plan,
          status: dbStatus,
          customerId,
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
    // H1: Paddle retries on 500 → spam. Acknowledge with 200 and alert via logs/Sentry.
    try {
      const { captureApiError } = await import("@/lib/sentry");
      captureApiError("/api/paddle/webhook", error, { method: "POST" });
    } catch {}
    return NextResponse.json({ received: true, error: "logged" }, { status: 200 });
  }
}
