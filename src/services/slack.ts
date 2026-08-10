type SlackMessage = {
  summary: string;
  actionItems: Array<{ task: string; owner: string; due: string | null }>;
  keyDecisions: string[];
  filename: string;
  healthScore?: number | null;
};

import { getSecret } from "@/lib/secrets";
import prisma from "@/lib/prisma";
import { decryptConfig } from "@/lib/integrations/config-crypto";

type SlackConfig = {
  accessToken: string;
  teamId: string;
  teamName: string;
  botUserId: string;
  authedUserId: string;
  scope: string;
  channel?: string;
};

export class SlackService {
  private webhookUrl: string;
  private teamId: string;

  constructor(teamId?: string) {
    this.webhookUrl = getSecret("SLACK_WEBHOOK_URL") || "";
    this.teamId = teamId || "";
  }

  private async getIntegrationConfig(): Promise<SlackConfig | null> {
    if (!this.teamId) return null;

    const integration = await prisma.integration.findFirst({
      where: { teamId: this.teamId, provider: "slack", enabled: true },
    });

    if (!integration?.config) return null;

    // Legacy plaintext passes through; `v1:` envelopes are decrypted.
    // decryptConfig never throws; undecryptable rows are treated as
    // unconfigured instead of crashing the request.
    const rawConfig = decryptConfig(integration.config);
    if (!rawConfig) return null;

    try {
      return JSON.parse(rawConfig) as SlackConfig;
    } catch {
      return null;
    }
  }

  private async getBotToken(): Promise<string | null> {
    const config = await this.getIntegrationConfig();
    return config?.accessToken || null;
  }

  async sendDirectMessage(userSlackId: string, text: string): Promise<boolean> {
    const token = await this.getBotToken();
    if (!token) return false;

    try {
      const openRes = await fetch("https://slack.com/api/conversations.open", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ users: userSlackId }),
      });
      const openData = await openRes.json();
      if (!openData.ok) return false;

      const channelId = openData.channel.id;

      const res = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channel: channelId, text }),
      });
      const data = await res.json();
      return data.ok === true;
    } catch {
      return false;
    }
  }

  async sendCallSummary(message: SlackMessage, assigneeSlackId?: string): Promise<boolean> {
    const blocks = this.buildSummaryBlocks(message);
    const channelSent = await this.postToChannel(blocks, message);

    if (channelSent && assigneeSlackId && message.actionItems.length > 0) {
      const items = message.actionItems.map(
        a => `• *${a.task}*${a.due ? ` (due: ${a.due})` : ""}`
      ).join("\n");
      await this.sendDirectMessage(
        assigneeSlackId,
        `*Action Items from: ${message.filename}*\n\n${items}`
      );
    }

    return channelSent;
  }

  private async postToChannel(blocks: any[], message: SlackMessage): Promise<boolean> {
    const config = await this.getIntegrationConfig();
    const token = config?.accessToken || null;

    if (token) {
      try {
        const res = await fetch("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channel: config?.channel || "#general",
            text: `New call notes: ${message.filename}`,
            blocks,
            unfurl_links: false,
          }),
        });
        const data = await res.json();
        return data.ok === true;
      } catch {
        return false;
      }
    }

    if (this.webhookUrl) {
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

    return false;
  }

  private buildSummaryBlocks(message: SlackMessage): any[] {
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
      const scoreEmoji = message.healthScore >= 70 ? "🟢" : message.healthScore >= 40 ? "🟡" : "🔴";
      blocks.push({
        type: "context",
        elements: [{ type: "mrkdwn", text: `${scoreEmoji} Health score: ${Math.round(message.healthScore)}%` }],
      });
    }

    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: `Sent by <${getSecret("NEXT_PUBLIC_APP_URL") || "https://usegauge.com"}|Gauge>` }],
    });

    return blocks;
  }

  async sendCompetitorAlert(competitors: Array<{ name: string; context: string | null; sentiment: string | null }>, filename: string, callUrl: string): Promise<boolean> {
    const config = await this.getIntegrationConfig();
    const token = config?.accessToken || null;
    if (!token && !this.webhookUrl) return false;
    if (competitors.length === 0) return false;

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
        elements: [{ type: "mrkdwn", text: `Sent by <${getSecret("NEXT_PUBLIC_APP_URL") || "https://usegauge.com"}|Gauge Intelligence>` }],
      },
    ];

    if (token) {
      try {
        const text = `🚨 Competitor Alert: ${competitors.map(c => c.name).join(", ")}`;
        const res = await fetch("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ channel: config?.channel || "#general", text, blocks, unfurl_links: false }),
        });
        const data = await res.json();
        return data.ok === true;
      } catch {
        return false;
      }
    }

    if (this.webhookUrl) {
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

    return false;
  }
}
