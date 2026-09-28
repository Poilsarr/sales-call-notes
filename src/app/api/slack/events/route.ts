import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getSecret } from "@/lib/secrets";
import { decryptConfig } from "@/lib/integrations/config-crypto";

/**
 * POST /api/slack/events — Slack Events API receiver (link unfurls).
 *
 * - Verifies the Slack signing secret (same HMAC pattern as
 *   `src/app/api/slack/commands/route.ts`).
 * - Answers `url_verification` challenges with `{ challenge }`.
 * - Handles `link_shared` events: matches the event `team_id` to the stored
 *   Slack integration (workspace→team match, like the commands route),
 *   loads team-scoped `/app/calls/{id}` meetings (title/summary/healthScore
 *   via prisma), and posts a rich unfurl via `chat.unfurl` with the stored
 *   bot token. Non-call links are ignored.
 * - Returns 200 fast: verification first, minimal sync work, every external
 *   call wrapped in try/catch so a Slack retry never sees a 500.
 */

type SlackLink = { url: string; domain: string };

type SlackEventEnvelope = {
  type?: string;
  challenge?: string;
  team_id?: string;
  event?: {
    type?: string;
    channel?: string;
    message_ts?: string;
    links?: SlackLink[];
  };
};

type StoredSlackConfig = { teamId?: string; accessToken?: string };

function verifySlackRequest(rawBody: string, signature: string, timestamp: string): boolean {
  const signingSecret = getSecret("SLACK_SIGNING_SECRET");
  if (!signingSecret) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false;

  const base = `v0:${timestamp}:${rawBody}`;
  const hmac = crypto.createHmac("sha256", signingSecret).update(base).digest("hex");
  const expected = `v0=${hmac}`;

  // Same comparison as the commands route, with a length guard so a
  // malformed/forged signature returns false (401) instead of throwing.
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function extractCallId(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\/app\/calls\/([A-Za-z0-9_-]+)/);
    return match ? match[1] : null;
  } catch {
    const match = url.match(/\/app\/calls\/([A-Za-z0-9_-]+)/);
    return match ? match[1] : null;
  }
}

function healthEmoji(score: number): string {
  // Same thresholds as the slash command (≥70 green, ≥40 yellow).
  if (score >= 70) return "🟢";
  if (score >= 40) return "🟡";
  return "🔴";
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 3) + "..." : text;
}

function appUrl(): string {
  return (getSecret("NEXT_PUBLIC_APP_URL") || "https://usegauge.vercel.app").replace(/\/$/, "");
}

function buildCallUnfurl(call: {
  id: string;
  title: string | null;
  filename: string | null;
  summary: string | null;
  healthScore: number | null;
}): Record<string, unknown> {
  const title = truncate(call.title || call.filename || "Meeting recap", 150);
  const blocks: unknown[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `📞 ${title}` },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Summary*\n${truncate(call.summary || "No summary available", 2000)}`,
      },
    },
  ];

  if (call.healthScore !== null && call.healthScore !== undefined) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${healthEmoji(call.healthScore)} Health score: ${Math.round(call.healthScore)}%`,
        },
      ],
    });
  }

  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: `<${appUrl()}/app/calls/${call.id}|View in Gauge>` }],
  });

  return { text: `${title} — meeting recap`, blocks };
}

export async function POST(req: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return new NextResponse("Invalid request body", { status: 400 });
  }

  const signature = req.headers.get("x-slack-signature") || "";
  const timestamp = req.headers.get("x-slack-request-timestamp") || "";

  if (!verifySlackRequest(rawBody, signature, timestamp)) {
    return new NextResponse("Invalid request signature", { status: 401 });
  }

  let body: SlackEventEnvelope;
  try {
    body = JSON.parse(rawBody) as SlackEventEnvelope;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  // URL verification handshake (Slack app setup).
  if (body.type === "url_verification" && typeof body.challenge === "string") {
    return NextResponse.json({ challenge: body.challenge });
  }

  // Only link_shared events are handled; everything else is acked.
  if (body.type !== "event_callback" || body.event?.type !== "link_shared") {
    return NextResponse.json({ ok: true });
  }

  const teamId = body.team_id || "";
  const channel = body.event.channel || "";
  const ts = body.event.message_ts || "";
  const links = Array.isArray(body.event.links) ? body.event.links : [];

  const callLinks = links.filter(
    (l): l is SlackLink => typeof l?.url === "string" && extractCallId(l.url) !== null,
  );
  if (!teamId || !channel || !ts || callLinks.length === 0) {
    return NextResponse.json({ ok: true });
  }

  try {
    // Workspace→team match (same pattern as the slash commands route):
    // find the stored integration whose config.teamId equals the event team.
    const integrations = await prisma.integration.findMany({
      where: { provider: "slack", enabled: true },
    });
    const integration = integrations.find((i: { config: string | null }) => {
      if (!i.config) return false;
      try {
        const config = JSON.parse(decryptConfig(i.config) ?? "null") as StoredSlackConfig;
        return config.teamId === teamId;
      } catch {
        return false;
      }
    });

    if (!integration) {
      return NextResponse.json({ ok: true });
    }

    let token: string | null = null;
    let integrationTeamId: string | null = null;
    try {
      const config = JSON.parse(decryptConfig(integration.config) ?? "null") as StoredSlackConfig;
      token = config.accessToken || null;
      integrationTeamId = (integration as { teamId?: string }).teamId ?? null;
    } catch {
      token = null;
    }
    if (!token || !integrationTeamId) {
      return NextResponse.json({ ok: true });
    }

    // Dedupe by call id; load each meeting team-scoped.
    const seen = new Set<string>();
    const unfurls: Record<string, unknown> = {};
    for (const link of callLinks) {
      const callId = extractCallId(link.url);
      if (!callId || seen.has(callId)) continue;
      seen.add(callId);
      try {
        const call = await prisma.call.findUnique({
          where: { id: callId },
          select: {
            id: true,
            teamId: true,
            title: true,
            filename: true,
            summary: true,
            healthScore: true,
          },
        });
        if (!call || call.teamId !== integrationTeamId) continue;
        unfurls[link.url] = buildCallUnfurl(call);
      } catch {
        continue;
      }
    }

    if (Object.keys(unfurls).length === 0) {
      return NextResponse.json({ ok: true });
    }

    try {
      await fetch("https://slack.com/api/chat.unfurl", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channel, ts, unfurls }),
      });
    } catch {
      // Unfurl delivery failure must not fail the event ack.
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
