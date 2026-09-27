import prisma from "@/lib/prisma";

/**
 * Part 2B — per-meeting digest event.
 *
 * Emitted when a meeting summary is ready. Executor A dynamic-imports
 * `emitMeetingReady` from `@/lib/meeting-events` — the export name and
 * signature below are the cross-executor contract and must not change.
 */
export const MEETING_READY_EVENT = "meeting.summary_ready";

export interface MeetingReadyPayload {
  teamId: string;
  userId: string;
  callId?: string;
  botSessionId?: string;
  title: string;
  summary?: string | null;
  actionItems?: string[];
  healthScore?: number | null;
}

interface EndpointRow {
  id: string;
  teamId: string;
  events?: string | null;
}

/**
 * Mirrors `endpointMatchesEvent` in src/services/webhooks.ts (duplicated
 * here so this lib stays dependency-free and import-cycle safe):
 * an endpoint's `events` column is a comma-separated allow-list;
 * `"*"` subscribes to every event.
 */
function endpointMatchesEvent(
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

/**
 * Enqueue-only fan-out: writes pending WebhookDelivery rows for the team's
 * enabled WebhookEndpoint rows whose event filter matches
 * `meeting.summary_ready` (or `*`). No fetch here — rows stay pending for
 * the cron dispatcher (`/api/cron/webhook-dispatch`).
 *
 * NOTE on legacy path: WebhookService.trigger's WebhookPayload event union
 * is limited to call.created/call.analyzed/call.deleted, so there is no
 * custom-event trigger for meeting.summary_ready. Single path only: outbox
 * rows, no immediate POST. Callers needing a legacy `call.analyzed` push
 * when callId is present should use WebhookService directly.
 *
 * Defensive: tolerates prisma clients/mocks without the webhook models
 * (returns { enqueued: 0 } instead of throwing).
 */
export async function emitMeetingReady(
  p: MeetingReadyPayload,
): Promise<{ enqueued: number }> {
  if (!p || !p.teamId || !p.userId || !p.title) return { enqueued: 0 };

  const db = prisma as unknown as Record<
    string,
    {
      findMany?: (...args: never[]) => Promise<EndpointRow[]>;
      create?: (...args: never[]) => Promise<unknown>;
    }
  >;

  if (!db.webhookEndpoint?.findMany || !db.webhookDelivery?.create) {
    return { enqueued: 0 };
  }

  let endpoints: EndpointRow[];
  try {
    endpoints = await prisma.webhookEndpoint.findMany({
      where: { teamId: p.teamId, enabled: true },
    });
  } catch {
    return { enqueued: 0 };
  }

  const matched = (endpoints ?? []).filter((e) =>
    endpointMatchesEvent(e.events ?? "call.analyzed", MEETING_READY_EVENT),
  );

  if (matched.length === 0) return { enqueued: 0 };

  const body = JSON.stringify({ event: MEETING_READY_EVENT, ...p });

  let enqueued = 0;
  for (const endpoint of matched) {
    try {
      await prisma.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          teamId: p.teamId,
          event: MEETING_READY_EVENT,
          payload: body,
          status: "pending",
          attempts: 0,
          nextRetryAt: new Date(),
        },
      });
      enqueued++;
    } catch {
      // Skip failed rows — one bad endpoint must not block the rest.
    }
  }

  return { enqueued };
}
