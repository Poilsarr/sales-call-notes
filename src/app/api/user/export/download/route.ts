import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isExportTokenValid } from "@/lib/gdpr-token";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/export/download?token=...
 *
 * Token format produced by the data-export worker:
 *   exp_<expiresAtMs>_<hash16>_<userId>
 *
 * Validates: token not expired, HMAC verified (constant-time), user
 * exists, then re-runs the export on demand and returns it as a JSON
 * download. (Inline payload — the worker stores the token in AuditLog
 * metadata; in production this would serve a presigned S3 URL.)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const parts = token.split("_");
    if (parts.length < 4 || parts[0] !== "exp") {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const expiresAtMs = Number(parts[1]);
    // Clerk user IDs contain underscores (user_2...), so the userId is
    // everything after exp_<ms>_<hash>_ joined back together.
    const userId = parts.slice(3).join("_");

    if (!expiresAtMs || !userId || Number.isNaN(expiresAtMs)) {
      return NextResponse.json({ error: "Malformed token" }, { status: 400 });
    }

    if (Date.now() > expiresAtMs) {
      return NextResponse.json(
        { error: "Download link expired. Request a new export." },
        { status: 410 }
      );
    }

    // HMAC verification (constant-time). A token with the right shape
    // but a forged or borrowed hash MUST be rejected — this is what
    // prevents guessing another user's export URL.
    if (!isExportTokenValid(token, userId)) {
      return NextResponse.json({ error: "Invalid download link" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Rebuild the export payload server-side. Same query path the
    // worker used; safe to re-run since this is a one-shot download.
    const { buildUserExport } = await import("@/lib/gdpr-export");
    const payload = await buildUserExport(userId);
    const body = JSON.stringify(payload, null, 2);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="gauge-export-${userId}-${Date.now()}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[/api/user/export/download GET]", err);
    return NextResponse.json({ error: "Failed to serve export" }, { status: 500 });
  }
}
