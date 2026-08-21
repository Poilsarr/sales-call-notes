import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { requireRole } from "@/lib/rbac";
import { checkFeatureAccess } from "@/lib/entitlements";
import { validateCompanyName } from "@/lib/competitor-watchlist";
import { logAuditAction } from "@/lib/audit-logger";

export const dynamic = "force-dynamic";

function getEffectiveCompanyName(user: { teamId: string | null; companyName: string | null }, team: { companyName: string | null } | null): string | null {
  if (user.teamId && team?.companyName && team.companyName.trim().length > 0) return team.companyName.trim();
  if (user.companyName && user.companyName.trim().length > 0) return user.companyName.trim();
  return null;
}

/**
 * GET /api/company
 *  Returns effective companyName (team if on team else user) + source
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, teamId: true, companyName: true, teamRole: true },
    });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let team: { companyName: string | null } | null = null;
    if (user.teamId) {
      team = await prisma.team.findUnique({ where: { id: user.teamId }, select: { companyName: true } });
    }

    const companyName = getEffectiveCompanyName({ teamId: user.teamId, companyName: user.companyName }, team);

    // also need role for frontend gate
    let role: string | null = null;
    if (user.teamId) {
      const { userRole } = await requireRole(clerkId, user.teamId, "MEMBER");
      role = userRole;
    }

    return NextResponse.json({ companyName, role });
  } catch (err) {
    console.error("[GET /api/company]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * PUT /api/company
 *  Body: { companyName: string | null } — ADMIN/OWNER if on team else solo owner
 */
export async function PUT(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRecord = await getUserByClerkId(clerkId);
    if (!userRecord) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Gate: competitive_intelligence for writes (same as reads)
    const gate = await checkFeatureAccess(clerkId, "competitive_intelligence" as any);
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason || "Upgrade required", code: "PLAN_REQUIRED" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || !("companyName" in body)) return NextResponse.json({ error: "companyName is required" }, { status: 400 });

    const parsed = validateCompanyName(body.companyName);
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const companyName = parsed.companyName.length > 0 ? parsed.companyName : null;

    // Team branch → Team.companyName, ADMIN only
    if (userRecord.teamId) {
      const { allowed } = await requireRole(clerkId, userRecord.teamId, "ADMIN");
      if (!allowed) return NextResponse.json({ error: "Only admins can manage company name" }, { status: 403 });

      const updated = await prisma.team.update({
        where: { id: userRecord.teamId },
        data: { companyName },
        select: { companyName: true },
      });
      await logAuditAction(userRecord.id, "COMPANY_UPDATE", userRecord.teamId, "Team", {
        teamId: userRecord.teamId,
        companyName: updated.companyName,
      }).catch(() => {});
      return NextResponse.json({ companyName: updated.companyName });
    }

    // Solo branch → User.companyName
    const updated = await prisma.user.update({
      where: { id: userRecord.id },
      data: { companyName },
      select: { companyName: true },
    });
    await logAuditAction(userRecord.id, "COMPANY_UPDATE", userRecord.id, "User", {
      companyName: updated.companyName,
    }).catch(() => {});
    return NextResponse.json({ companyName: updated.companyName });
  } catch (err) {
    console.error("[PUT /api/company]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
