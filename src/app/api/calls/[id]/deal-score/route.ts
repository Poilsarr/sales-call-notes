import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { canAccessCall } from "@/lib/call-access";
import { scoreDeal } from "@/lib/deal-risk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkUserId);

    const call = await prisma.call.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        teamId: true,
        sharedWithTeam: true,
        transcript: true,
        summary: true,
        healthScore: true,
        sentiment: true,
        actionItems: { select: { task: true } },
        competitorMentions: { select: { competitor: true } },
      },
    });

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    // IDOR guard: same pattern as /api/slack — owner or teammate on
    // team-shared calls only.
    if (
      !canAccessCall(
        { id: user.id, teamId: user.teamId, teamRole: user.teamRole },
        call,
      )
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Computed on read — no persistence.
    const result = scoreDeal({
      transcript: call.transcript ?? undefined,
      summary: call.summary ?? undefined,
      actionItems: call.actionItems.map((a) => a.task),
      competitors: call.competitorMentions.map((m) => m.competitor),
      healthScore: call.healthScore ?? undefined,
      sentiment: call.sentiment ?? undefined,
    });

    return NextResponse.json({ callId: call.id, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to score deal: ${message}` },
      { status: 500 },
    );
  }
}
