import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { WebhookService } from "@/services/webhooks";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/get-user";
import { getPlan, hasFeature } from "@/lib/plans";
import prisma from "@/lib/prisma";

const ALLOWED_WEBHOOK_EVENTS = [
  "call.created",
  "call.analyzed",
  "call.deleted",
] as const;

type WebhookEvent = (typeof ALLOWED_WEBHOOK_EVENTS)[number];

const DEFAULT_EVENTS: WebhookEvent[] = ["call.analyzed"];

function isValidEvents(value: unknown): value is WebhookEvent[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (e): e is WebhookEvent =>
      typeof e === "string" &&
      (ALLOWED_WEBHOOK_EVENTS as readonly string[]).includes(e),
  );
}

export async function POST(req: NextRequest) {
  try {
    let userId: string | null = null;
    try {
      ({ userId } = await auth());
    } catch {
      // auth() throws when middleware did not run for this path; treat as
      // unauthenticated instead of bubbling a 500.
    }
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserByClerkId(userId);
    if (!hasFeature(getPlan(user.plan), "webhooks")) {
      return NextResponse.json({ error: "Webhooks are a Business plan feature" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { url, secret: providedSecret, events: rawEvents } = body as {
      url?: unknown;
      secret?: unknown;
      events?: unknown;
    };

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }

    if (!url.startsWith("https://")) {
      return NextResponse.json({ error: "Webhook URL must start with https://" }, { status: 400 });
    }

    let events: WebhookEvent[] = DEFAULT_EVENTS;
    if (rawEvents !== undefined) {
      if (!isValidEvents(rawEvents)) {
        return NextResponse.json(
          { error: `events must be a subset of [${ALLOWED_WEBHOOK_EVENTS.join(", ")}]` },
          { status: 400 },
        );
      }
      events = rawEvents;
    }

    let secret: string;
    if (providedSecret !== undefined) {
      if (typeof providedSecret !== "string" || providedSecret.length === 0) {
        return NextResponse.json({ error: "secret must be a non-empty string" }, { status: 400 });
      }
      secret = providedSecret;
    } else {
      secret = randomBytes(32).toString("hex");
    }
    const isNewSecretGenerated = providedSecret === undefined;

    const teamId = user.teamId || undefined;
    if (!teamId) {
      return NextResponse.json({ error: "Webhooks require a team workspace" }, { status: 400 });
    }

    const db = prisma as unknown as Record<string, unknown>;
    const endpointModel = db["webhookEndpoint"] as
      | {
          findFirst?: (args: unknown) => Promise<unknown>;
          create?: (args: unknown) => Promise<unknown>;
          update?: (args: unknown) => Promise<unknown>;
          upsert?: (args: unknown) => Promise<unknown>;
        }
      | undefined;

    // Part 1A model may not exist yet — fall back to the legacy
    // Integration-based registration so the route never 500s.
    if (!endpointModel || typeof endpointModel.findFirst !== "function") {
      const webhooks = new WebhookService();
      await webhooks.registerWebhook(userId, url, teamId);
      return NextResponse.json({ success: true, message: "Webhook registered" });
    }

    const runInTransaction = async <T>(fn: (tx: any) => Promise<T>): Promise<T> => {
      const txRunner = (prisma as unknown as { $transaction?: unknown })["$transaction"];
      if (typeof txRunner === "function") {
        return (txRunner as (fn: (tx: any) => Promise<T>) => Promise<T>).call(prisma, fn);
      }
      return fn(prisma);
    };

    interface EndpointRow {
      id: string;
      url: string;
      events: unknown;
    }

    const existing = (await endpointModel.findFirst!({
      where: { teamId, url },
    })) as unknown as EndpointRow | null;

    if (existing) {
      const updated = (await runInTransaction((tx: any) =>
        tx.webhookEndpoint.update({
          where: { id: existing.id },
          data: { events, secret },
        }),
      )) as unknown as EndpointRow;
      return NextResponse.json({
        id: updated.id,
        url: updated.url,
        events: (updated.events as WebhookEvent[]) ?? events,
        hasSecret: true,
      });
    }

    const created = (await runInTransaction((tx: any) =>
      tx.webhookEndpoint.create({
        data: { teamId, url, secret, events, enabled: true },
      }),
    )) as unknown as EndpointRow;

    return NextResponse.json({
      id: created.id,
      url: created.url,
      events: (created.events as WebhookEvent[]) ?? events,
      hasSecret: true,
      // Raw secret is returned exactly once, on create.
      secret: isNewSecretGenerated || providedSecret !== undefined ? secret : undefined,
    });
  } catch (error: any) {
    const message = error?.message || "Webhook registration failed";
    if (message.includes("team")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Webhook registration failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    let userId: string | null = null;
    try {
      ({ userId } = await auth());
    } catch {
      // auth() throws when middleware did not run for this path.
    }
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserByClerkId(userId);
    if (!hasFeature(getPlan(user.plan), "webhooks")) {
      return NextResponse.json({ error: "Webhooks are a Business plan feature" }, { status: 403 });
    }

    const teamId = user.teamId || undefined;
    if (!teamId) {
      return NextResponse.json({ endpoints: [] });
    }

    const db = prisma as unknown as Record<string, unknown>;
    const endpointModel = db["webhookEndpoint"] as
      | { findMany?: (args: unknown) => Promise<unknown> }
      | undefined;

    if (!endpointModel || typeof endpointModel.findMany !== "function") {
      return NextResponse.json({ endpoints: [] });
    }

    const rows = (await endpointModel.findMany({
      where: { teamId },
      select: { id: true, url: true, events: true, enabled: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    })) as unknown as Array<{
      id: string;
      url: string;
      events: WebhookEvent[];
      enabled: boolean;
      createdAt: Date;
    }>;

    // Secrets are never returned from the list endpoint.
    return NextResponse.json({ endpoints: rows });
  } catch {
    return NextResponse.json({ error: "Failed to list webhooks" }, { status: 500 });
  }
}
