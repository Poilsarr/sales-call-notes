import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { HubSpotService } from "@/services/crm/hubspot";
import { SalesforceService } from "@/services/crm/salesforce";
import { TeamsService } from "@/services/crm/teams";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { provider, accessToken } = await req.json();

    const call = await prisma.call.findUnique({
      where: { id: params.id },
      include: {
        actionItems: true,
        decisions: true,
        nextSteps: true,
        analytics: true,
      },
    });

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    let result;

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

    if (provider === "hubspot") {
      const hubspot = new HubSpotService();
      result = await hubspot.syncCall(crmCall, accessToken);
    } else if (provider === "salesforce") {
      const salesforce = new SalesforceService();
      result = await salesforce.syncCall(crmCall, accessToken);
    } else if (provider === "teams") {
      const teams = new TeamsService();
      result = await teams.syncCall(crmCall, accessToken);
    } else {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
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
      { error: "CRM sync failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}