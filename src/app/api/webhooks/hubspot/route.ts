import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSecret } from "@/lib/secrets";
import { verifyHubSpotSignature } from "@/lib/webhook-signatures";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/hubspot
 * HubSpot webhook receiver. Verifies v3 HMAC-SHA256 signature.
 * Idempotent: stores eventId in AuditLog.metadata; replays return 200 without re-processing.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("x-hubspot-signature-v3");
  const secret = getSecret("HUBSPOT_CLIENT_SECRET");

  if (!verifyHubSpotSignature(rawBody, sig, secret, "v3")) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Dedupe: store eventId; if seen, return 200 idempotently
  const eventId = String(parsed.eventId ?? parsed.id ?? "");
  if (eventId) {
    const existing = await prisma.auditLog.findFirst({
      where: {
        action: "hubspot_webhook_received",
        entityId: eventId,
      },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ status: "duplicate", eventId }, { status: 200 });
    }
    await prisma.auditLog.create({
      data: {
        // webhooks have no user; FK is nullable via onDelete: SetNull
        userId: null as unknown as string,
        action: "hubspot_webhook_received",
        entityId: eventId,
        entityType: "Webhook",
        metadata: {
          subscriptionType: parsed.subscriptionType,
          portalId: parsed.portalId,
          receivedAt: new Date().toISOString(),
        },
      },
    });
  }

  // TODO: dispatch to CRM-sync worker for actual reconciliation
  return NextResponse.json({ status: "received", eventId }, { status: 200 });
}
