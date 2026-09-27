import prisma from "@/lib/prisma";
import { getSecret } from "@/lib/secrets";
import { decryptConfig } from "@/lib/integrations/config-crypto";

export interface MeetingDigestInput {
  teamId: string;
  title: string;
  summary?: string | null;
  actionItems?: string[];
  healthScore?: number | null;
  callId?: string;
}

export interface MeetingDigestResult {
  delivered: boolean;
  channel: string;
}

type SlackConfig = {
  accessToken?: string;
  channel?: string;
};

/** Health emoji — same thresholds as SlackService (>=70 green, >=40 yellow). */
export function meetingHealthEmoji(score: number): string {
  if (score >= 70) return "🟢";
  if (score >= 40) return "🟡";
  return "🔴";
}

function appUrl(): string {
  return getSecret("NEXT_PUBLIC_APP_URL") || "https://usegauge.com";
}

function truncateHeader(text: string): string {
  // Slack header plain_text caps at 150 chars.
  return text.length > 150 ? text.slice(0, 147) + "..." : text;
}

/**
 * Pure Block Kit builder (no I/O — unit-tested directly).
 */
export function buildMeetingDigestBlocks(input: {
  title: string;
  summary?: string | null;
  actionItems?: string[];
  healthScore?: number | null;
}): unknown[] {
  const blocks: unknown[] = [
    {
      type: "header",
      text: { type: "plain_text", text: truncateHeader(`📝 ${input.title}`) },
    },
  ];

  if (input.summary) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Summary*\n${input.summary}` },
    });
  }

  const items = (input.actionItems ?? []).filter(Boolean);
  if (items.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Action Items*\n${items.map((t) => `• ${t}`).join("\n")}`,
      },
    });
  }

  if (input.healthScore !== null && input.healthScore !== undefined) {
    const emoji = meetingHealthEmoji(input.healthScore);
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${emoji} Health score: ${Math.round(input.healthScore)}%`,
        },
      ],
    });
  }

  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: `Sent by <${appUrl()}|Gauge>` }],
  });

  return blocks;
}

/**
 * Post a per-meeting digest to the team's Slack channel.
 *
 * Self-contained token read (copies the SlackService pattern without
 * touching src/services/slack.ts): finds the team's enabled Slack
 * integration, decrypts the stored config, and posts via chat.postMessage.
 * Falls back to SLACK_WEBHOOK_URL like SlackService. Makes no network
 * call when neither is configured.
 */
export async function postMeetingDigest(
  input: MeetingDigestInput,
): Promise<MeetingDigestResult> {
  const blocks = buildMeetingDigestBlocks(input);
  const text = `New meeting digest: ${input.title}`;

  let token: string | null = null;
  let channel = "#general";

  try {
    const integration = await prisma.integration.findFirst({
      where: { teamId: input.teamId, provider: "slack", enabled: true },
    });
    const raw = decryptConfig(integration?.config ?? null);
    if (raw) {
      try {
        const config = JSON.parse(raw) as SlackConfig;
        token = config.accessToken || null;
        if (config.channel) channel = config.channel;
      } catch {
        token = null;
      }
    }
  } catch {
    token = null;
  }

  if (token) {
    try {
      const res = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel,
          text,
          blocks,
          unfurl_links: false,
        }),
      });
      const data = await res.json();
      return { delivered: data.ok === true, channel };
    } catch {
      return { delivered: false, channel };
    }
  }

  const webhookUrl = getSecret("SLACK_WEBHOOK_URL") || "";
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, blocks, unfurl_links: false }),
      });
      return { delivered: res.ok, channel: "webhook" };
    } catch {
      return { delivered: false, channel: "webhook" };
    }
  }

  return { delivered: false, channel: "" };
}
