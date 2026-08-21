import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { requireRole } from "@/lib/rbac";
import { checkFeatureAccess } from "@/lib/entitlements";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAuditAction } from "@/lib/audit-logger";
import { validateCompetitor } from "@/lib/competitor-watchlist";

export const dynamic = "force-dynamic";

async function getOwnedEntry(clerkId: string, entryId: string) {
  const user = await getUserByClerkId(clerkId);
  if (!user) return { user: null, entry: null };
  // Gate first — free users cannot mutate even if they guess cuid
  const gate = await checkFeatureAccess(clerkId, "competitive_intelligence" as any);
  if (!gate.allowed) return { user, entry: null, gateBlocked: true as const };

  const rl = await checkRateLimit(`competitors_write:${user.id}`, "api");
  if (!rl.success) return { user, entry: null, rateLimited: true as const };

  if (user.teamId) {
    const { allowed } = await requireRole(clerkId, user.teamId, "ADMIN");
    if (!allowed) return { user, entry: null, forbidden: true as const };
    const entry = await prisma.trackedCompetitor.findFirst({
      where: { id: entryId, teamId: user.teamId },
      select: { id: true, teamId: true, userId: true, name: true, normalizedName: true },
    });
    return { user, entry };
  }
  const entry = await prisma.trackedCompetitor.findFirst({
    where: { id: entryId, userId: user.id },
    select: { id: true, teamId: true, userId: true, name: true, normalizedName: true },
  });
  return { user, entry };
}

/**
 * PATCH /api/competitors/:id
 *  Body: { name } — rename
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result: any = await getOwnedEntry(clerkId, id);
    if (!result.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (result.gateBlocked) return NextResponse.json({ error: "Upgrade required", code: "PLAN_REQUIRED" }, { status: 403 });
    if (result.rateLimited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    if (result.forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!result.entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const parsed = validateCompetitor(body.name);
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

    try {
      const updated = await prisma.trackedCompetitor.update({
        where: { id: result.entry.id },
        data: { name: parsed.name, normalizedName: parsed.normalizedName },
        select: { id: true, name: true, normalizedName: true, createdAt: true },
      });
      await logAuditAction(result.user.id, "COMPETITOR_UPDATE", updated.id, "TrackedCompetitor", {
        name: updated.name,
        normalizedName: updated.normalizedName,
      }).catch(() => {});
      return NextResponse.json({ entry: updated });
    } catch (e: any) {
      if (e?.code === "P2002") return NextResponse.json({ error: "Already on watchlist" }, { status: 400 });
      throw e;
    }
  } catch (err) {
    console.error("[PATCH /api/competitors/:id]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * DELETE /api/competitors/:id — ADMIN/OWNER if on team else solo
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result: any = await getOwnedEntry(clerkId, id);
    if (!result.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (result.gateBlocked) return NextResponse.json({ error: "Upgrade required", code: "PLAN_REQUIRED" }, { status: 403 });
    if (result.rateLimited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    if (result.forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!result.entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.trackedCompetitor.delete({ where: { id: result.entry.id } });
    await logAuditAction(result.user.id, "COMPETITOR_DELETE", result.entry.id, "TrackedCompetitor", {
      name: result.entry.name,
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/competitors/:id]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
