import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { HubSpotService } from "@/services/crm/hubspot";
import { SalesforceService } from "@/services/crm/salesforce";
import { TeamsService } from "@/services/crm/teams";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkUserId);
    if (!user.teamId) {
      return NextResponse.json({ error: "No team found" }, { status: 400 });
    }

    const { provider } = await req.json();

    if (!provider || !["hubspot", "salesforce", "teams"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const call = await prisma.call.findUnique({
      where: { id: params.id },
      include: {
        actionItems: true,
        decisions: true,
        nextSteps: true,
        analytics: true,
        user: { select: { teamId: true } },
      },
    });

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    if (call.user?.teamId && call.user.teamId !== user.teamId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const integration = await prisma.integration.findFirst({
      where: { teamId: user.teamId, provider },
    });

    let accessToken: string | null = null;
    if (integration?.config) {
      try {
        const parsed = JSON.parse(integration.config);
        accessToken = parsed.accessToken || null;
      } catch {
        return NextResponse.json({ error: "Integration not configured" }, { status: 400 });
      }
    }

    if (!accessToken) {
      return NextResponse.json({ error: "Integration not connected" }, { status: 400 });
    }

    const crmCall = {
      filename: call.filename,
      createdAt: call.createdAt,
      transcript: call.transcript,
      summary: call.summary,
      analytics: call.analytics,
      actionItems: call.actionItems.map(a => ({ task: a.task, owner: a.owner, due: a.due })),
      decisions: call.decisions.map(d => ({ content: d.content })),
      nextSteps: call.nextSteps.map(n => ({ step: n.step, date: n.date })),
    };

    let result;
    if (provider === "hubspot") {
      const hubspot = new HubSpotService();
      result = await hubspot.syncCall(crmCall, accessToken);
    } else if (provider === "salesforce") {
      const salesforce = new SalesforceService();
      result = await salesforce.syncCall(crmCall, accessToken);
    } else {
      const teams = new TeamsService();
      result = await teams.syncCall(crmCall, accessToken);
    }

    await prisma.call.update({
      where: { id: params.id },
      data: {
        crmSynced: true,
        crmProvider: provider,
        crmRecordId: (result as any).contactId || (result as any).dealId || (result as any).opportunityId || (result as any).taskId || "",
      },
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("CRM sync error:", error);
    return NextResponse.json(
      { error: "CRM sync failed" },
      { status: 500 }
    );
  }
}