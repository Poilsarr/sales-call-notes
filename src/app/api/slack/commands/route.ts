import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getSecret } from "@/lib/secrets";
import { decryptConfig } from "@/lib/integrations/config-crypto";

type SlackCommandPayload = {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
};

function verifySlackRequest(rawBody: string, signature: string, timestamp: string): boolean {
  const signingSecret = getSecret("SLACK_SIGNING_SECRET");
  if (!signingSecret) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false;

  const base = `v0:${timestamp}:${rawBody}`;
  const hmac = crypto.createHmac("sha256", signingSecret).update(base).digest("hex");
  const expected = `v0=${hmac}`;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

function formatCallResponse(call: {
  filename: string;
  summary: string | null;
  healthScore: number | null;
  actionItems: Array<{ task: string; owner: string; due: string | null }>;
  keyDecisions: string[];
}) {
  const blocks: any[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `📞 ${call.filename}` },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Summary*\n${call.summary || "No summary available"}` },
    },
  ];

  if (call.actionItems.length > 0) {
    const items = call.actionItems.map(
      a => `• *${a.task}* — ${a.owner}${a.due ? ` (due: ${a.due})` : ""}`
    ).join("\n");
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Action Items*\n${items}` },
    });
  }

  if (call.keyDecisions.length > 0) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Key Decisions*\n${call.keyDecisions.map(d => `• ${d}`).join("\n")}` },
    });
  }

  if (call.healthScore !== null && call.healthScore !== undefined) {
    const scoreEmoji = call.healthScore >= 70 ? "🟢" : call.healthScore >= 40 ? "🟡" : "🔴";
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: `${scoreEmoji} Health score: ${Math.round(call.healthScore)}%` }],
    });
  }

  return {
    response_type: "ephemeral",
    blocks,
  };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-slack-signature") || "";
    const timestamp = req.headers.get("x-slack-request-timestamp") || "";

    if (!verifySlackRequest(rawBody, signature, timestamp)) {
      return new NextResponse("Invalid request signature", { status: 401 });
    }

    const params = new URLSearchParams(rawBody);
    const payload: SlackCommandPayload = {
      token: params.get("token") || "",
      team_id: params.get("team_id") || "",
      team_domain: params.get("team_domain") || "",
      channel_id: params.get("channel_id") || "",
      channel_name: params.get("channel_name") || "",
      user_id: params.get("user_id") || "",
      user_name: params.get("user_name") || "",
      command: params.get("command") || "",
      text: params.get("text") || "",
      response_url: params.get("response_url") || "",
      trigger_id: params.get("trigger_id") || "",
    };

    const callId = payload.text.trim();

    if (!callId) {
      return NextResponse.json({
        response_type: "ephemeral",
        text: "Usage: `/callnote <callId>` — Get a call summary in Slack.\nExample: `/callnote abc123`",
      });
    }

    const integrations = await prisma.integration.findMany({
      where: { provider: "slack", enabled: true },
      include: { team: { include: { calls: true } } },
    });

    // Match the Slack workspace (payload.team_id) to the integration that
    // registered it. Without this, findFirst picked an arbitrary team's
    // integration and any workspace could query any team's calls.
    const integration = integrations.find((i) => {
      if (!i.config) return false;
      try {
        // decryptConfig passes legacy plaintext through and never throws;
        // an undecryptable row just fails the match.
        const config = JSON.parse(decryptConfig(i.config) ?? "null") as { teamId?: string };
        return config.teamId === payload.team_id;
      } catch {
        return false;
      }
    });

    if (!integration) {
      return NextResponse.json({
        response_type: "ephemeral",
        text: "No Slack integration found for this workspace. Ask your admin to connect Slack.",
      });
    }

    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        actionItems: { where: { status: "PENDING" } },
        decisions: true,
      },
    });

    if (!call || call.teamId !== integration.teamId) {
      return NextResponse.json({
        response_type: "ephemeral",
        text: `Call \`${callId}\` not found in your team's workspace.`,
      });
    }

    const response = formatCallResponse({
      filename: call.filename,
      summary: call.summary,
      healthScore: call.healthScore,
      actionItems: call.actionItems.map(a => ({ task: a.task, owner: a.owner, due: a.due })),
      keyDecisions: call.decisions.map(d => d.content),
    });

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        response_type: "ephemeral",
        text: "An error occurred while processing your command.",
      },
      { status: 200 },
    );
  }
}
