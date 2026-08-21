import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { requireRole } from "@/lib/rbac";
import { checkFeatureAccess } from "@/lib/entitlements";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAuditAction } from "@/lib/audit-logger";
import { validateCompetitor, competitorWatchlistLimit } from "@/lib/competitor-watchlist";

export const dynamic = "force-dynamic";

/**
 * GET /api/competitors
 *  Lists effective watchlist (team if on team else user)
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserByClerkId(clerkId);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (user.teamId) {
      const { allowed } = await requireRole(clerkId, user.teamId, "MEMBER");
      if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const entries = await prisma.trackedCompetitor.findMany({
        where: { teamId: user.teamId },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, normalizedName: true, createdAt: true },
      });
      const team = await prisma.team.findUnique({ where: { id: user.teamId }, select: { companyName: true } });
      return NextResponse.json({ entries, companyName: team?.companyName ?? null, scope: "team" as const });
    }

    const entries = await prisma.trackedCompetitor.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, normalizedName: true, createdAt: true },
    });
    return NextResponse.json({ entries, companyName: user.companyName ?? null, scope: "user" as const });
  } catch (err) {
    console.error("[GET /api/competitors]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/competitors
 *  Body: { name } — ADMIN/OWNER if on team else solo
 */
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserByClerkId(clerkId);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Gate first (free → 403 PLAN_REQUIRED before any write)
    const gate = await checkFeatureAccess(clerkId, "competitive_intelligence" as any);
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason || "Upgrade required", code: "PLAN_REQUIRED" }, { status: 403 });
    }

    // Rate limit per-clerk (Hobby fail-open handled inside checkRateLimit, but we also enforce via IP bucket)
    const rl = await checkRateLimit(`competitors_write:${user.id}`, "api");
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests — try again shortly" }, { status: 429 });
    }

    // RBAC
    if (user.teamId) {
      const { allowed } = await requireRole(clerkId, user.teamId, "ADMIN");
      if (!allowed) return NextResponse.json({ error: "Only admins can manage competitors" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const parsed = validateCompetitor(body.name);
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const limit = competitorWatchlistLimit(user.plan || "free");
    if (limit === 0) {
      return NextResponse.json({ error: "Upgrade to Pro to manage competitors", code: "PLAN_REQUIRED" }, { status: 403 });
    }

    // Enforce limit via count + catch P2002 — race-safe via unique index
    const whereCount = user.teamId ? { teamId: user.teamId } : { userId: user.id };
    const count = await prisma.trackedCompetitor.count({ where: whereCount as any });
    if (count >= limit) {
      return NextResponse.json({ error: `Watchlist is capped at ${limit} competitors. Delete one first.` }, { status: 400 });
    }

    try {
      const entry = await prisma.trackedCompetitor.create({
        data: {
          teamId: user.teamId ?? null,
          userId: user.teamId ? null : user.id,
          name: parsed.name,
          normalizedName: parsed.normalizedName,
        },
        select: { id: true, name: true, normalizedName: true, createdAt: true },
      });

      // Post-create count check to handle race (two concurrent at limit-1)
      const after = await prisma.trackedCompetitor.count({ where: whereCount as any });
      if (after > limit) {
        await prisma.trackedCompetitor.delete({ where: { id: entry.id } }).catch(() => {});
        return NextResponse.json({ error: `Watchlist is capped at ${limit} competitors. Delete one first.` }, { status: 400 });
      }

      await logAuditAction(user.id, "COMPETITOR_CREATE", entry.id, "TrackedCompetitor", {
        teamId: user.teamId,
        name: entry.name,
        normalizedName: entry.normalizedName,
      }).catch(() => {});
      return NextResponse.json({ entry }, { status: 201 });
    } catch (e: any) {
      if (e?.code === "P2002") {
        return NextResponse.json({ error: "Already on watchlist" }, { status: 400 });
      }
      throw e;
    }
  } catch (err) {
    console.error("[POST /api/competitors]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
