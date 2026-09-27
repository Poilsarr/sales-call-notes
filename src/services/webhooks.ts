import prisma from "@/lib/prisma";
import { sign } from "@/lib/webhook-hmac";

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

export const WEBHOOK_TIMEOUT_MS = 5000;
export const WEBHOOK_USER_AGENT = "Gauge-Webhook/1.0";
export const MAX_BACKOFF_MINUTES = 60;
export const MAX_LAST_ERROR_CHARS = 500;

/** HTTPS-only guard (SSRF mitigation). Rejects http:// and non-URLs. */
export function isHttpsUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  return url.startsWith("https://");
}

/**
 * An endpoint's `events` column is a comma-separated allow-list
 * (default "call.analyzed"). `"*"` subscribes to every event.
 */
export function endpointMatchesEvent(
  events: string | null | undefined,
  event: string,
): boolean {
  if (!events || typeof events !== "string") return false;
  const list = events
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) return false;
  if (list.includes("*")) return true;
  return list.includes(event);
}

/** Exponential backoff in minutes: 2^attempts, capped at 60. */
export function computeBackoffMinutes(attempts: number): number {
  if (!Number.isFinite(attempts) || attempts < 0) return 1;
  return Math.min(Math.pow(2, attempts), MAX_BACKOFF_MINUTES);
}

export function computeNextRetryAt(attempts: number, now: Date = new Date()): Date {
  return new Date(now.getTime() + computeBackoffMinutes(attempts) * 60_000);
}

export function truncateLastError(err: unknown): string {
  const raw =
    err instanceof Error ? err.message : String(err ?? "delivery failed");
  return raw.slice(0, MAX_LAST_ERROR_CHARS);
}

async function postWebhook(
  url: string,
  body: string,
  secret: string,
  event: string,
): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": WEBHOOK_USER_AGENT,
    "X-Gauge-Event": event,
    "X-Gauge-Signature": sign(body, secret),
  };
  const res = await fetch(url, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Webhook delivery failed: ${res.status}`);
  }
}

interface OutboxEndpoint {
  id: string;
  teamId: string;
  url: string;
  secret: string;
}

export class WebhookService {
  async trigger(payload: WebhookPayload): Promise<void> {
    // Deliver only to webhooks registered on the CALL's team. Without this
    // filter, a single registered webhook (any team) receives every user's
    // call data — a cross-tenant data leak.
    // Integration.teamId is a required FK, so a teamless call has no
    // webhooks to notify.
    if (!payload.teamId) return;

    const teamId = payload.teamId;
    const event = payload.event;
    const body = JSON.stringify(payload);

    // (a) New outbox endpoints: enabled + team match, event filter in code
    // (the `events` column is a comma-separated allow-list).
    // Defensive access: older prisma mocks / clients may not have the
    // WebhookEndpoint model yet — fall back to no outbox endpoints.
    const db = prisma as unknown as Record<string, {
      findMany?: (...args: never[]) => Promise<OutboxEndpoint[]>;
      create?: (...args: never[]) => Promise<{ id: string; attempts: number }>;
      update?: (...args: never[]) => Promise<unknown>;
    }>;
    let endpoints: OutboxEndpoint[] = [];
    if (db.webhookEndpoint?.findMany) {
      endpoints = await prisma.webhookEndpoint.findMany({
        where: { teamId, enabled: true },
      });
    }
    const matched = (endpoints ?? []).filter((e) =>
      endpointMatchesEvent(
        (e as { events?: string }).events ?? "call.analyzed",
        event,
      ),
    );

    // (a) Legacy rows kept for backward compat (pre-outbox webhooks stored
    // as Integration provider=webhook with config { url, secret? }).
    const integrations = await prisma.integration.findMany({
      where: {
        provider: "webhook",
        enabled: true,
        teamId,
      },
    });

    const tasks: Array<Promise<unknown>> = [];

    for (const endpoint of matched) {
      if (!isHttpsUrl(endpoint.url)) {
        console.warn(
          `Blocked SSRF attempt: non-HTTPS webhook URL: ${String(endpoint.url).slice(0, 100)}`,
        );
        continue;
      }
      tasks.push(this.deliverWithOutbox(endpoint, body, event));
    }

    for (const integration of integrations ?? []) {
      tasks.push(this.deliverLegacy(integration, body, event));
    }

    const results = await Promise.allSettled(tasks);

    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      console.warn(
        `Webhook delivery failures: ${failures.length}/${tasks.length}`,
      );
    }
  }

  /**
   * Outbox delivery: persist a pending WebhookDelivery row, attempt immediate
   * POST, then mark delivered or schedule a retry with exponential backoff.
   */
  private async deliverWithOutbox(
    endpoint: OutboxEndpoint,
    body: string,
    event: string,
  ): Promise<void> {
    const db = prisma as unknown as Record<string, {
      create?: (args: never) => Promise<{ id: string; attempts: number }>;
      update?: (args: never) => Promise<unknown>;
    }>;
    // Fallback for clients/mocks without the outbox model: direct delivery.
    if (!db.webhookDelivery?.create) {
      await postWebhook(endpoint.url, body, endpoint.secret, event);
      return;
    }
    // (b) Enqueue with status pending.
    const delivery = await prisma.webhookDelivery.create({
      data: {
        endpointId: endpoint.id,
        teamId: endpoint.teamId,
        event,
        payload: body,
        status: "pending",
        attempts: 0,
        nextRetryAt: new Date(),
      },
    });

    try {
      // (c) Immediate attempt: 5s timeout, https-only, signed headers.
      await postWebhook(endpoint.url, body, endpoint.secret, event);
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: { status: "delivered" },
      });
    } catch (err) {
      // (d) Failure: attempts+1, exponential backoff capped at 60 minutes,
      // lastError truncated to 500 chars.
      const attempts = (delivery.attempts ?? 0) + 1;
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "retrying",
          attempts,
          nextRetryAt: computeNextRetryAt(attempts),
          lastError: truncateLastError(err),
        },
      });
    }
  }

  /**
   * Legacy direct delivery for Integration provider=webhook rows.
   * Preserves the original fire-and-forget behavior (no outbox row —
   * WebhookDelivery requires an endpointId FK the legacy row has none of).
   */
  private async deliverLegacy(
    integration: { config?: unknown },
    body: string,
    event: string,
  ): Promise<void> {
    let url: unknown;
    let secret = "";
    try {
      const config =
        typeof integration.config === "string"
          ? JSON.parse(integration.config)
          : integration.config;
      url = (config as { url?: unknown } | null)?.url;
      const maybeSecret = (config as { secret?: unknown } | null)?.secret;
      if (typeof maybeSecret === "string") secret = maybeSecret;
    } catch {
      return;
    }
    if (typeof url !== "string" || !url) return;
    if (!isHttpsUrl(url)) {
      console.warn(
        `Blocked SSRF attempt: non-HTTPS webhook URL: ${url.slice(0, 100)}`,
      );
      return;
    }

    await postWebhook(url, body, secret, event);
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
