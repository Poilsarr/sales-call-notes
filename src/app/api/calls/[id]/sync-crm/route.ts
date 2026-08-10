import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { requireRole } from "@/lib/rbac";
import { HubSpotService } from "@/services/crm/hubspot";
import { SalesforceService } from "@/services/crm/salesforce";
import { TeamsService } from "@/services/crm/teams";
import { decryptConfig } from "@/lib/integrations/config-crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkUserId);
    if (!user.teamId) {
      return NextResponse.json({ error: "No team found" }, { status: 400 });
    }

    const { allowed } = await requireRole(clerkUserId, user.teamId, "ADMIN");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { provider } = await req.json();

    if (!provider || !["hubspot", "salesforce", "teams"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const call = await prisma.call.findUnique({
      where: { id },
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

    // The call must belong to the admin's team — a null teamId on the call
    // (or a different team) means it's not this team's data to sync.
    if (!call.user?.teamId || call.user.teamId !== user.teamId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const integration = await prisma.integration.findFirst({
      where: { teamId: user.teamId, provider },
    });

    let instanceUrl: string | undefined;
    if (integration?.config) {
      try {
        // Legacy plaintext passes through; `v1:` envelopes are decrypted.
        const parsed = JSON.parse(decryptConfig(integration.config) ?? "");
        instanceUrl = parsed.instanceUrl ?? undefined;
      } catch {
        return NextResponse.json({ error: "Integration not configured" }, { status: 400 });
      }
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
      const hubspot = new HubSpotService(user.teamId);
      result = await hubspot.syncCall(crmCall);
    } else if (provider === "salesforce") {
      const salesforce = new SalesforceService(user.teamId, instanceUrl);
      result = await salesforce.syncCall(crmCall);
    } else {
      const teams = new TeamsService();
      const mockToken = integration?.config
        ? JSON.parse(decryptConfig(integration.config) ?? "{}").accessToken
        : null;
      result = await teams.syncCall(crmCall, mockToken || "");
    }

    await prisma.call.update({
      where: { id },
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
