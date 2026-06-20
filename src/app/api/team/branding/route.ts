import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { requireRole } from "@/lib/rbac";
import { logAuditAction } from "@/lib/audit-logger";
import {
  DEFAULT_BRAND_COLOR,
  validateBrandingUpdate,
} from "@/lib/team-branding";

/**
 * GET /api/team/branding
 *   Returns the branding for the current user's team, or 200 with `null`
 *   when the user is not on a team. Always returns — never 401 — so the
 *   sidebar / settings UI can safely call it without auth gymnastics.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({
        teamId: null,
        brandColor: null,
        logoUrl: null,
      });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { teamId: true },
    });

    if (!user?.teamId) {
      return NextResponse.json({
        teamId: null,
        brandColor: null,
        logoUrl: null,
      });
    }

    const team = await prisma.team.findUnique({
      where: { id: user.teamId },
      select: { id: true, brandColor: true, logoUrl: true },
    });

    return NextResponse.json({
      teamId: team?.id ?? null,
      brandColor: team?.brandColor ?? DEFAULT_BRAND_COLOR,
      logoUrl: team?.logoUrl ?? null,
    });
  } catch (err) {
    console.error("[GET /api/team/branding]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * PUT /api/team/branding
 *   Body: { brandColor?: string|null, logoUrl?: string|null }
 *   Permission: ADMIN or OWNER only.
 */
export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await getUserByClerkId(userId);
    if (!dbUser.teamId) {
      return NextResponse.json({ error: "No team" }, { status: 404 });
    }

    const { allowed } = await requireRole(userId, dbUser.teamId, "ADMIN");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = validateBrandingUpdate(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const update: Record<string, string | null> = {};
    if ("brandColor" in parsed.data) update.brandColor = parsed.data.brandColor ?? null;
    if ("logoUrl" in parsed.data) update.logoUrl = parsed.data.logoUrl ?? null;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.team.update({
      where: { id: dbUser.teamId },
      data: update,
      select: { id: true, brandColor: true, logoUrl: true },
    });

    await logAuditAction(dbUser.id, "team.branding.update", dbUser.teamId, "Team", {
      changes: update,
    });

    return NextResponse.json({
      teamId: updated.id,
      brandColor: updated.brandColor ?? DEFAULT_BRAND_COLOR,
      logoUrl: updated.logoUrl ?? null,
    });
  } catch (err) {
    console.error("[PUT /api/team/branding]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}