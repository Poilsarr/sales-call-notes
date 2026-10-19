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
    let userTeamId = user.teamId;
    if (!userTeamId) {
      const personalTeam = await prisma.team.create({
        data: {
          name: `${user.name || "Personal"}'s Workspace`,
          slug: `team-${user.id.slice(0, 8)}-${Date.now().toString(36)}`,
          ownerId: user.id,
          companyName: user.companyName || "Gauge Workspace",
        },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { teamId: personalTeam.id },
      });
      userTeamId = personalTeam.id;
    }

    const { allowed } = await requireRole(clerkUserId, userTeamId, "ADMIN");
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

    // The call must belong to the admin's team — auto-link if owner is solo
    if (call.userId === user.id && (!call.teamId || !call.user?.teamId)) {
      await prisma.call.update({
        where: { id: call.id },
        data: { teamId: userTeamId },
      });
    } else if (call.user?.teamId !== userTeamId && call.teamId !== userTeamId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const integration = await prisma.integration.findFirst({
      where: { teamId: userTeamId, provider },
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
      const hubspot = new HubSpotService(userTeamId);
      result = await hubspot.syncCall(crmCall);
    } else if (provider === "salesforce") {
      const salesforce = new SalesforceService(userTeamId, instanceUrl);
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
