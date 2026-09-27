/**
 * Recall meeting-bot dispatch + webhook verification (Part 2A bot intake).
 *
 * Manual mode: when RECALL_API_KEY is unset, no network call is made and the
 * caller stores the session as pending_manual for later dispatch.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export type RecallPlatform = "zoom" | "google-meet" | "microsoft-teams" | "unknown";

export type CreateBotInput = {
  meetingUrl: string;
  title?: string;
};

export type CreateBotResult =
  | { mode: "manual"; status: "pending_manual"; recallBotId: null }
  | { mode: "recall"; status: string; recallBotId: string | null };

const RECALL_BOT_ENDPOINT = "https://api.recall.ai/api/v1/bot";
const RECALL_TIMEOUT_MS = 15_000;

/**
 * Accepts joinable meeting URLs for Zoom, Google Meet, and Microsoft Teams.
 * Mirrors the regex spirit of getMeetingPlatform in src/services/meeting-bot.ts.
 */
export function isJoinableMeetingUrl(url: string): boolean {
  if (typeof url !== "string" || url.length === 0 || url.length > 2048) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  const href = url.toLowerCase();
  return (
    /zoom\.us/i.test(href) || /meet\.google\.com/i.test(href) || /teams\.microsoft\.com/i.test(href)
  );
}

/** Platform label for a meeting URL (same regexes as meeting-bot.ts). */
export function getRecallPlatform(link: string): RecallPlatform {
  if (/zoom\.us/i.test(link)) return "zoom";
  if (/meet\.google\.com/i.test(link)) return "google-meet";
  if (/teams\.microsoft\.com/i.test(link)) return "microsoft-teams";
  return "unknown";
}

export async function createBot({ meetingUrl, title }: CreateBotInput): Promise<CreateBotResult> {
  const apiKey = process.env.RECALL_API_KEY;
  if (!apiKey) {
    return { mode: "manual", status: "pending_manual", recallBotId: null };
  }

  const res = await fetch(RECALL_BOT_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      meeting_url: meetingUrl,
      bot_name: "Gauge Notetaker",
      ...(title ? { metadata: { title } } : {}),
    }),
    signal: AbortSignal.timeout(RECALL_TIMEOUT_MS),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Recall createBot failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = (await res.json().catch(() => ({}))) as { id?: string; status?: string };
  return {
    mode: "recall",
    status: typeof data.status === "string" && data.status.length > 0 ? data.status : "joining",
    recallBotId: typeof data.id === "string" ? data.id : null,
  };
}

/**
 * Verify the HMAC-SHA256 webhook signature from Recall.
 * Tolerant-false when RECALL_WEBHOOK_SECRET is unconfigured or inputs are missing.
 */
export function verifyRecallSignature(
  rawBody: string | Buffer,
  signature: string | null | undefined,
): boolean {
  const secret = process.env.RECALL_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  try {
    const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    const expectedHex = createHmac("sha256", secret).update(body, "utf8").digest("hex");
    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expectedHex, "utf8");
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}
