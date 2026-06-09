import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSecret } from "@/lib/secrets";
import { verifySalesforceSignature } from "@/lib/webhook-signatures";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/salesforce
 * Salesforce outbound notification receiver.
 * Signature: sha256(clientSecret + rawBody) in `X-SF-Signature`.
 * Idempotent on eventId.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("x-sf-signature");
  const secret = getSecret("SALESFORCE_CLIENT_SECRET");

  if (!verifySalesforceSignature(rawBody, sig, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventId = String(parsed.event?.id ?? parsed.id ?? "");
  if (eventId) {
    const existing = await prisma.auditLog.findFirst({
      where: {
        action: "salesforce_webhook_received",
        entityId: eventId,
      },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ status: "duplicate", eventId }, { status: 200 });
    }
    await prisma.auditLog.create({
      data: {
        // webhooks have no user; schema userId is non-nullable but
        // FK is onDelete: SetNull. Cast satisfies the typed client.
        userId: null as unknown as string,
        action: "salesforce_webhook_received",
        entityId: eventId,
        entityType: "Webhook",
        metadata: {
          type: parsed.event?.type,
          orgId: parsed.orgId,
          receivedAt: new Date().toISOString(),
        },
      },
    });
  }

  return NextResponse.json({ status: "received", eventId }, { status: 200 });
}
