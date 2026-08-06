import prisma from "@/lib/prisma";

/**
 * Payload posted to user-registered webhooks (and by extension
 * any Zap that subscribes to call.* events).
 *
 * Zapier users can map these fields directly in their Zaps.
 * Adding a field here is backwards-compatible — existing webhooks
 * will simply ignore fields they don't recognize.
 */
export interface WebhookPayload {
  event: "call.created" | "call.analyzed" | "call.deleted";
  callId: string;
  userId: string;
  teamId?: string | null;
  data: {
    summary?: string | null;
    healthScore?: number | null;
    actionItems?: Array<{ task: string; owner?: string | null; due?: string | null }>;
    competitors?: Array<{ name: string; context?: string | null }>;
    duration?: number | null;
    language?: string | null;
    recordedAt?: string | null;
  };
}

export class WebhookService {
  async trigger(payload: WebhookPayload): Promise<void> {
    // Deliver only to webhooks registered on the CALL's team. Without this
    // filter, a single registered webhook (any team) receives every user's
    // call data — a cross-tenant data leak.
    // Integration.teamId is a required FK, so a teamless call has no
    // webhooks to notify.
    if (!payload.teamId) return;
    const integrations = await prisma.integration.findMany({
      where: {
        provider: "webhook",
        enabled: true,
        teamId: payload.teamId,
      },
    });

    const results = await Promise.allSettled(
      integrations.map(async (integration) => {
        const config = typeof integration.config === "string"
          ? JSON.parse(integration.config)
          : integration.config;
        const url = config?.url;
        if (!url) return;
        if (!url.startsWith("https://")) {
          console.warn(`Blocked SSRF attempt: non-HTTPS webhook URL: ${url.slice(0, 100)}`);
          return;
        }

        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Gauge-Webhook/1.0",
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(5000),
        });
      })
    );

    const failures = results.filter(r => r.status === "rejected");
    if (failures.length > 0) {
      console.warn(`Webhook delivery failures: ${failures.length}/${integrations.length}`);
    }
  }

  async registerWebhook(userId: string, url: string, teamId?: string): Promise<void> {
    if (!url.startsWith("https://")) {
      throw new Error("Only HTTPS webhook URLs are allowed");
    }
    // Integration.teamId is a required FK — registration without a team was
    // silently throwing (permanent 500 on /api/webhooks). Require the caller
    // to belong to a team so the webhook is scoped to it.
    if (!teamId) {
      throw new Error("Webhooks require a team workspace");
    }
    await prisma.integration.create({
      data: {
        provider: "webhook",
        config: JSON.stringify({ url }),
        enabled: true,
        teamId,
      },
    });
  }
}
