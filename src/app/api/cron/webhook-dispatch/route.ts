import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { getSecret } from "@/lib/secrets";
import prisma from "@/lib/prisma";

export const maxDuration = 60;

const MAX_ATTEMPTS = 8;
const BATCH_SIZE = 20;
const FETCH_TIMEOUT_MS = 5000;

function inlineSign(secret: string, body: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

async function signPayload(secret: string, body: string): Promise<string> {
  try {
    // webhook-hmac.ts ships in Part 1A as sign(payload, secret); fall back
    // to the inline implementation when it is not present so dispatch
    // never crashes.
    // @ts-ignore - module may not exist until Part 1A lands
    const mod = await import("@/lib/webhook-hmac").catch(() => null);
    const sign = (mod as { sign?: (payload: string, secret: string) => string } | null)?.sign;
    if (typeof sign === "function") return sign(body, secret);
  } catch {
    // ignore and use inline signer below
  }
  return inlineSign(secret, body);
}

function backoffMs(attempts: number): number {
  return Math.min(60 * 60 * 1000, Math.pow(2, attempts) * 60 * 1000);
}

interface DeliveryRow {
  id: string;
  url?: string | null;
  endpointUrl?: string | null;
  payload?: unknown;
  body?: unknown;
  data?: unknown;
  secret?: string | null;
  attempts?: number | null;
  status?: string | null;
  nextRetryAt?: Date | string | null;
  event?: string | null;
  endpoint?: { url?: string | null; secret?: string | null } | null;
}

function resolveTarget(delivery: DeliveryRow): { url: string | null; secret: string; bodyText: string; event: string } {
  const url =
    delivery.url ??
    delivery.endpointUrl ??
    delivery.endpoint?.url ??
    null;
  const secret = delivery.secret ?? delivery.endpoint?.secret ?? "";
  const raw = delivery.payload ?? delivery.body ?? delivery.data ?? {};
  const bodyText = typeof raw === "string" ? raw : JSON.stringify(raw);
  const event =
    delivery.event ??
    (typeof raw === "object" && raw !== null && "event" in raw
      ? String((raw as Record<string, unknown>)["event"])
      : "call.analyzed");
  return { url, secret, bodyText, event };
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = getSecret("CRON_SECRET");

  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = prisma as unknown as Record<string, unknown>;
  const deliveryModel = db["webhookDelivery"] as
    | {
        findMany?: (args: unknown) => Promise<unknown>;
        update?: (args: unknown) => Promise<unknown>;
      }
    | undefined;

  if (!deliveryModel || typeof deliveryModel.findMany !== "function") {
    return NextResponse.json({ processed: 0, delivered: 0, failed: 0 });
  }

  let deliveries: DeliveryRow[] = [];
  try {
    deliveries = (await deliveryModel.findMany({
      where: {
        status: { in: ["pending", "retrying"] },
        nextRetryAt: { lte: new Date() },
      },
      take: BATCH_SIZE,
      orderBy: { nextRetryAt: "asc" },
      include: { endpoint: true },
    })) as unknown as DeliveryRow[];
  } catch {
    // Include may fail when the relation does not exist yet — retry
    // without it so dispatch degrades gracefully.
    try {
      deliveries = (await deliveryModel.findMany({
        where: {
          status: { in: ["pending", "retrying"] },
          nextRetryAt: { lte: new Date() },
        },
        take: BATCH_SIZE,
        orderBy: { nextRetryAt: "asc" },
      })) as unknown as DeliveryRow[];
    } catch {
      return NextResponse.json({ processed: 0, delivered: 0, failed: 0 });
    }
  }

  let delivered = 0;
  let failed = 0;

  for (const delivery of deliveries) {
    const { url, secret: endpointSecret, bodyText, event } = resolveTarget(delivery);
    const attempts = (delivery.attempts ?? 0) + 1;

    if (!url || !url.startsWith("https://")) {
      failed += 1;
      try {
        await deliveryModel.update?.({
          where: { id: delivery.id },
          data: {
            attempts,
            status: attempts >= MAX_ATTEMPTS ? "failed" : "retrying",
            nextRetryAt: new Date(Date.now() + backoffMs(attempts)),
          },
        });
      } catch {
        // Best-effort bookkeeping — a failed update must not abort the batch.
      }
      continue;
    }

    try {
      const signature = endpointSecret ? await signPayload(endpointSecret, bodyText) : "";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Gauge-Webhook/1.0",
          "X-Webhook-Event": event,
          "X-Webhook-Delivery": delivery.id,
          // X-Gauge-Signature is the canonical header per
          // src/lib/webhook-hmac.ts; X-Webhook-Signature is sent as an
          // alias for receivers written against the generic name.
          ...(signature ? { "X-Gauge-Signature": signature, "X-Webhook-Signature": signature } : {}),
        },
        body: bodyText,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (res.ok) {
        delivered += 1;
        try {
          await deliveryModel.update?.({
            where: { id: delivery.id },
            data: { status: "delivered", attempts },
          });
        } catch {
          // Best-effort.
        }
      } else {
        failed += 1;
        try {
          await deliveryModel.update?.({
            where: { id: delivery.id },
            data: {
              attempts,
              status: attempts >= MAX_ATTEMPTS ? "failed" : "retrying",
              nextRetryAt: new Date(Date.now() + backoffMs(attempts)),
            },
          });
        } catch {
          // Best-effort.
        }
      }
    } catch {
      failed += 1;
      try {
        await deliveryModel.update?.({
          where: { id: delivery.id },
          data: {
            attempts,
            status: attempts >= MAX_ATTEMPTS ? "failed" : "retrying",
            nextRetryAt: new Date(Date.now() + backoffMs(attempts)),
          },
        });
      } catch {
        // Best-effort.
      }
    }
  }

  return NextResponse.json({ processed: deliveries.length, delivered, failed });
}
