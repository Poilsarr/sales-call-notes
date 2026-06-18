import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { cacheGet, cacheSet, makeCacheKey } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkUserId);
    const cacheKey = makeCacheKey("calls", user.id, params.id);

    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const call = await prisma.call.findUnique({
      where: { id: params.id },
      include: {
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
