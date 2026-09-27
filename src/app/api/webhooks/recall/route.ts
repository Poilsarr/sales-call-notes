import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyRecallSignature } from "@/services/recall";

/**
 * POST /api/webhooks/recall — public Recall bot webhook.
 *
 * Auth is verified inside the route via verifyRecallSignature (HMAC-SHA256
 * with RECALL_WEBHOOK_SECRET). The path is also listed in middleware
 * isPublicApi so Clerk middleware never 401s it first.
 *
 * Body shapes tolerated:
 *   { event, botId | recallBotId | bot_id, transcriptUrl | transcript_url, data: {...} }
 *
 * Updates the matching BotSession status (done/failed) and enqueues the
 * meeting.summary_ready outbox event via emitMeetingReady (dynamic import,
 * guarded — never crashes the webhook).
 */

function pickSignature(req: Request): string | null {
  const h = req.headers;
  return (
    h.get("x-recall-signature") ??
    h.get("x-signature") ??
    h.get("recall-signature") ??
    h.get("x-webhook-signature")
  );
}

function pickRecallBotId(body: Record<string, unknown>): string | null {
  const data = (body.data as Record<string, unknown> | undefined) ?? {};
  const candidates = [
    body.recallBotId,
    body.botId,
    body.bot_id,
    data.recallBotId,
    data.botId,
    data.bot_id,
    data.id,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) return c;
  }
  return null;
}

function pickTranscriptUrl(body: Record<string, unknown>): string | null {
  const data = (body.data as Record<string, unknown> | undefined) ?? {};
  const candidates = [body.transcriptUrl, body.transcript_url, data.transcriptUrl, data.transcript_url];
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) return c;
  }
  return null;
}

function mapStatus(event: string, transcriptUrl: string | null): "done" | "failed" {
  const e = event.toLowerCase();
  if (/fail|error/.test(e)) return "failed";
  if (/done|complete|transcript|ready/.test(e)) return "done";
  // Transcript present implies completion even for generic event names.
  if (transcriptUrl) return "done";
  return "done";
}

export async function POST(req: Request) {
  const rawBody = await req.text().catch(() => "");
  const signature = pickSignature(req);

  if (!verifyRecallSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const event =
    typeof body.event === "string"
      ? body.event
      : typeof body.type === "string"
        ? body.type
        : "";
  const recallBotId = pickRecallBotId(body);
  const transcriptUrl = pickTranscriptUrl(body);
  const status = mapStatus(event, transcriptUrl);

  const store = (prisma as unknown as Record<string, unknown>).botSession as
    | {
        findFirst: (args: unknown) => Promise<Record<string, unknown> | null>;
        update: (args: unknown) => Promise<Record<string, unknown>>;
      }
    | undefined;

  let session: Record<string, unknown> | null = null;
  if (store && recallBotId) {
    try {
      const found = await store.findFirst({ where: { recallBotId } });
      if (found) {
        const updated = await store.update({
          where: { id: found.id as string },
          data: {
            status,
            ...(transcriptUrl ? { transcriptUrl } : {}),
            ...(status === "failed" ? { error: event.slice(0, 500) || "recall_failed" } : {}),
          },
        });
        // Merge: the update return may be partial — identity fields come from `found`.
        session = { ...found, ...updated };
      }
    } catch {
      session = null; // never crash the webhook on a store error
    }
  }

  // Emit the outbox event (enqueue-only fan-out). Guarded — never crashes.
  try {
    const { emitMeetingReady } = await import("@/lib/meeting-events");
    const teamId = typeof session?.teamId === "string" ? (session.teamId as string) : null;
    const userId = typeof session?.userId === "string" ? (session.userId as string) : null;
    const title =
      typeof session?.title === "string" && (session.title as string).length > 0
        ? (session.title as string)
        : typeof body.title === "string" && (body.title as string).length > 0
          ? (body.title as string)
          : "Meeting ready";
    if (teamId && userId) {
      await emitMeetingReady({
        teamId,
        userId,
        botSessionId: typeof session?.id === "string" ? (session.id as string) : undefined,
        title,
      }).catch(() => ({ enqueued: 0 }));
    }
  } catch {
    // dynamic import or emit failed — webhook still acks
  }

  return NextResponse.json({ received: true });
}
