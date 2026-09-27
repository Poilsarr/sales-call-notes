import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { generateApiKey } from "@/lib/api-key";
import { logAuditAction } from "@/lib/audit-logger";
import { getPlan, hasFeature } from "@/lib/plans";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/v1/keys/exchange
 *
 * Clerk-gated key mint for the Chrome extension side panel. The side
 * panel is cross-origin (no Clerk session cookies), so it cannot call
 * session-cookie APIs directly: the signed-in web app calls this route
 * once, receives a `read_write` API key, and hands it to the extension,
 * which then uses `Authorization: Bearer` on /api/upload-url + /api/analyze.
 *
 * Mirrors POST /api/v1/keys guards: 5/hr per-user creation cap + the
 * `api_access` plan gate. The key is named `extension-<yyyy-mm-dd>` so
 * rotation is visible in the key list. `raw` is returned ONCE.
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Per-user key-creation cap (5/hr) — same bucket as /api/v1/keys so
    // exchange calls count toward the same rotation-evasion limit.
    // Fail-open on Redis outage.
    const { success } = await checkRateLimit(`v1keys:${userId}`, "v1keys");
    if (!success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const user = await getUserByClerkId(userId);
    if (!hasFeature(getPlan(user.plan), "api_access")) {
      return NextResponse.json({ error: "API access is a Pro plan feature" }, { status: 403 });
    }

    const name = `extension-${new Date().toISOString().slice(0, 10)}`;
    const { raw, prefix, hash } = generateApiKey();

    const row = await prisma.apiKey.create({
      data: { userId: user.id, name, prefix, hash, scope: "read_write" },
      select: { id: true, name: true, prefix: true, scope: true, createdAt: true },
    });

    await logAuditAction(user.id, "apikey.create", row.id, "ApiKey", {
      name: row.name,
      scope: row.scope,
      via: "extension-exchange",
    });

    // raw returned ONCE — never shown again.
    return NextResponse.json({ ...row, raw }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/keys/exchange]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
