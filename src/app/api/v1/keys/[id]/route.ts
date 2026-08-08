import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { logAuditAction } from "@/lib/audit-logger";

/**
 * DELETE /api/v1/keys/[id] — revoke a key.
 * Revoked keys remain in the DB so audit history is preserved,
 * but resolveApiKey returns null for them.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getUserByClerkId(userId);

    const key = await prisma.apiKey.findUnique({
      where: { id },
      select: { id: true, userId: true, revokedAt: true, name: true },
    });
    if (!key || key.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (key.revokedAt) {
      return NextResponse.json({ error: "Already revoked" }, { status: 409 });
    }

    await prisma.apiKey.update({
      where: { id: key.id },
      data: { revokedAt: new Date() },
    });
    await logAuditAction(user.id, "apikey.revoke", key.id, "ApiKey", {
      name: key.name,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/v1/keys/[id]]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}