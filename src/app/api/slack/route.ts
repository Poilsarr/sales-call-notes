import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/get-user";
import { SlackService } from "@/services/slack";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { callId } = await req.json();

    if (!callId) {
      return NextResponse.json({ error: "callId required" }, { status: 400 });
    }

    const user = await getUserByClerkId(userId);
    const teamId = user.teamId || "";

    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: { actionItems: true, decisions: true, assignee: true },
    });

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    const slack = new SlackService(teamId);
    const assigneeSlackId = call.assignee?.slackUserId || undefined;

    const sent = await slack.sendCallSummary(
      {
        filename: call.filename,
        summary: call.summary || "",
        actionItems: call.actionItems.map(a => ({ task: a.task, owner: a.owner, due: a.due })),
        keyDecisions: call.decisions.map(d => d.content),
        healthScore: call.healthScore,
      },
      assigneeSlackId
    );

    if (!sent) {
      return NextResponse.json({ error: "Failed to send to Slack" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Slack integration failed" }, { status: 500 });
  }
}
