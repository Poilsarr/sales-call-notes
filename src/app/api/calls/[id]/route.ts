import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { cacheGet, cacheSet, makeCacheKey } from "@/lib/cache";

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
    const cacheKey = makeCacheKey("calls", user.id, id);

    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const call = await prisma.call.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        teamId: true,
        sharedWithTeam: true,
        isPublic: true,
        archived: true,
        assigneeId: true,
        filename: true,
        title: true,
        duration: true,
        transcript: true,
        language: true,
        summary: true,
        healthScore: true,
        sentiment: true,
        crmSynced: true,
        crmProvider: true,
        crmRecordId: true,
        source: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        speakers: true,
        analytics: true,
        insight: true,
        actionItems: true,
        decisions: true,
        nextSteps: true,
      },
    });

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    const ownsCall = call.userId === user.id;
    const sharedWithTeam = call.sharedWithTeam && call.teamId === user.teamId;

    if (!ownsCall && !sharedWithTeam) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await cacheSet(cacheKey, call, 300);

    return NextResponse.json(call);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch call: ${message}` },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    let userId: string | null = null;

    // 1. Try Bearer API key first
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const { resolveApiKey } = await import("@/lib/resolve-api-key");
      const apiKeyResult = await resolveApiKey(authHeader);
      if (apiKeyResult && apiKeyResult.kind === "ok") {
        userId = apiKeyResult.context.userId;
      }
    }

    // 2. Fall back to Clerk session
    if (!userId) {
      const clerkSession = await auth();
      if (clerkSession.userId) {
        const user = await getUserByClerkId(clerkSession.userId);
        userId = user.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const newTitle = typeof body.title === "string" ? body.title.trim().slice(0, 200) : undefined;
    const newFilename = typeof body.filename === "string" ? body.filename.trim().slice(0, 200) : undefined;

    const call = await prisma.call.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    if (call.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.call.update({
      where: { id },
      data: {
        ...(newTitle !== undefined ? { title: newTitle } : {}),
        ...(newFilename !== undefined ? { filename: newFilename } : {}),
      },
      select: { id: true, title: true, filename: true, updatedAt: true },
    });

    return NextResponse.json({ ok: true, call: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to update call: ${message}` }, { status: 500 });
  }
}
