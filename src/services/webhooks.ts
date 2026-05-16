import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface WebhookPayload {
  event: "call.created" | "call.analyzed" | "call.deleted";
  callId: string;
  userId: string;
  data: Record<string, any>;
}

export class WebhookService {
  async trigger(payload: WebhookPayload): Promise<void> {
    const integrations = await prisma.integration.findMany({
      where: { provider: "webhook", enabled: true },
    });

    const results = await Promise.allSettled(
      integrations.map(async (integration) => {
        const config = typeof integration.config === "string"
          ? JSON.parse(integration.config)
          : integration.config;
        const url = config?.url;
        if (!url) return;

        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    await prisma.integration.create({
      data: {
        teamId: teamId || "",
        provider: "webhook",
        config: JSON.stringify({ url }),
        enabled: true,
      },
    });
  }
}
