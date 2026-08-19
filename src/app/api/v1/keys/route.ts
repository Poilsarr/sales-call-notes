import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { generateApiKey } from "@/lib/api-key";
import { logAuditAction } from "@/lib/audit-logger";
import { getPlan, hasFeature } from "@/lib/plans";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * GET  /api/v1/keys        — list current user's API keys (no raw secrets)
 * POST /api/v1/keys        — create a new key. Body: { name, scope? }
 *                            Response includes `raw` — shown ONCE.
 */

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getUserByClerkId(userId);
    const rows = await prisma.apiKey.findMany({
      where: { userId: user.id, revokedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        prefix: true,
        scope: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ keys: rows });
  } catch (err) {
    console.error("[GET /api/v1/keys]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Per-user key-creation cap (5/hr) — otherwise rotation evades the
    // per-key buckets by minting fresh keys. Fail-open on Redis outage.
    const { success } = await checkRateLimit(`v1keys:${userId}`, "v1keys");
    if (!success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 64) {
      return NextResponse.json({ error: "name required (1-64 chars)" }, { status: 400 });
    }
    const scope = body.scope === "read_write" ? "read_write" : "read";

    const user = await getUserByClerkId(userId);
    if (!hasFeature(getPlan(user.plan), "api_access")) {
      return NextResponse.json({ error: "API access is a Pro plan feature" }, { status: 403 });
    }

    const { raw, prefix, hash } = generateApiKey();

    const row = await prisma.apiKey.create({
      data: { userId: user.id, name, prefix, hash, scope },
      select: { id: true, name: true, prefix: true, scope: true, createdAt: true },
    });

    await logAuditAction(user.id, "apikey.create", row.id, "ApiKey", {
      name: row.name,
      scope: row.scope,
    });

    // raw returned ONCE — never shown again.
    return NextResponse.json({ ...row, raw }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/keys]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}