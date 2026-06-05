type SlackMessage = {
  summary: string;
  actionItems: Array<{ task: string; owner: string; due: string | null }>;
  keyDecisions: string[];
  filename: string;
  healthScore?: number | null;
};

import { getSecret } from "@/lib/secrets";

export class SlackService {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = getSecret("SLACK_WEBHOOK_URL") || "";
  }

  async sendCallSummary(message: SlackMessage): Promise<boolean> {
    if (!this.webhookUrl) return false;

    const blocks: any[] = [
      {
        type: "header",
        text: { type: "plain_text", text: `📞 ${message.filename}` },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Summary*\n${message.summary}` },
      },
    ];

    if (message.actionItems.length > 0) {
      const items = message.actionItems.map(
        a => `• *${a.task}* — ${a.owner}${a.due ? ` (due: ${a.due})` : ""}`
      ).join("\n");
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: `*Action Items*\n${items}` },
      });
    }

    if (message.keyDecisions.length > 0) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: `*Key Decisions*\n${message.keyDecisions.map(d => `• ${d}`).join("\n")}` },
      });
    }

    if (message.healthScore !== null && message.healthScore !== undefined) {
      const scoreEmoji = message.healthScore >= 0.7 ? "🟢" : message.healthScore >= 0.4 ? "🟡" : "🔴";
      blocks.push({
        type: "context",
        elements: [{ type: "mrkdwn", text: `${scoreEmoji} Health score: ${Math.round(message.healthScore * 100)}%` }],
      });
    }

    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: `Sent by <${getSecret("NEXT_PUBLIC_APP_URL") || "https://callnotepro.com"}|CallNote Pro>` }],
    });

    try {
      const res = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `New call notes: ${message.filename}`, blocks, unfurl_links: false }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async sendCompetitorAlert(competitors: Array<{ name: string; context: string | null; sentiment: string | null }>, filename: string, callUrl: string): Promise<boolean> {
    if (!this.webhookUrl || competitors.length === 0) return false;

    const mentions = competitors.map(c =>
      `• *${c.name}* — ${c.sentiment === 'negative' ? '⚠️ ' : ''}"${c.context || 'mentioned in call'}"`
    ).join("\n");

    const blocks: any[] = [
      {
        type: "header",
        text: { type: "plain_text", text: `🚨 Competitor Alert: ${filename}` },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Competitor${competitors.length > 1 ? 's' : ''} detected in this call:*\n\n${mentions}` },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View Call" },
            url: callUrl,
          },
        ],
      },
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: `Sent by <${getSecret("NEXT_PUBLIC_APP_URL") || "https://callnotepro.com"}|CallNote Pro Intelligence>` }],
      },
    ];

    try {
      const res = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `🚨 Competitor Alert: ${competitors.map(c => c.name).join(", ")}`, blocks, unfurl_links: false }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
