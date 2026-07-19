import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/get-user';
import { PLANS, PlanTier } from '@/lib/plans';

// ponytail: restore a soft-archived call to the visible pool. Free users are
// capped at uploadLimit visible calls, so we refuse (409) if restoring would
// exceed the cap — the user must upgrade or archive another call first.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserByClerkId(clerkUserId);
    const { id } = await params;

    const call = await prisma.call.findUnique({
      where: { id },
      select: { id: true, userId: true, archived: true },
    });

    if (!call || call.userId !== user.id) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }
    if (!call.archived) {
      return NextResponse.json({ ok: true, restored: false });
    }

    const plan = (user.plan?.toLowerCase() as PlanTier) || "free";
    const limit = PLANS[plan]?.uploadLimit;

    if (limit !== undefined && limit !== "unlimited") {
      const visibleCount = await prisma.call.count({
        where: { userId: user.id, archived: false },
      });
      if (visibleCount >= limit) {
        return NextResponse.json(
          {
            error: "Restore would exceed your plan's call limit. Upgrade for unlimited calls or remove a visible call first.",
            code: "AT_LIMIT",
          },
          { status: 409 },
        );
      }
    }

    await prisma.call.update({
      where: { id },
      data: { archived: false },
    });

    return NextResponse.json({ ok: true, restored: true });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: "Failed to restore call" }, { status: 500 });
  }
}
