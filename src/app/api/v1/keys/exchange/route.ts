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
    const user = await getUserByClerkId(userId);
    const planTier = (user.plan || "free").toLowerCase();

    if (!success) {
      // Graceful fallback: return user & plan tier so extension auth succeeds even if key minting is throttled
      return NextResponse.json({
        ok: true,
        rateLimited: true,
        plan: planTier,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: planTier,
        },
      }, { status: 200 });
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

    // raw returned ONCE — never shown again. Includes user plan tier for extension UI gating.
    return NextResponse.json(
      {
        ...row,
        raw,
        plan: planTier,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: planTier,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/v1/keys/exchange]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * GET /api/v1/keys/exchange
 *
 * Check session status and plan tier for the extension.
 * Supports dual-auth:
 * 1. Bearer API key (for Chrome Extension background & side panel)
 * 2. Clerk session cookie (for the web app & connect page)
 */
export async function GET(req: Request) {
  try {
    let user: { id: string; email: string; name: string | null; plan: string | null } | null = null;
    let userId: string | null = null;

    // 1. Try Bearer API key first
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const { resolveApiKey } = await import("@/lib/resolve-api-key");
      const apiKeyResult = await resolveApiKey(authHeader);
      if (apiKeyResult && apiKeyResult.kind === "ok") {
        const dbUser = await prisma.user.findUnique({
          where: { id: apiKeyResult.context.userId },
          select: { id: true, email: true, name: true, plan: true },
        });
        if (dbUser) {
          user = dbUser;
          userId = dbUser.id;
        }
      }
    }

    // 2. Fall back to Clerk session cookie
    if (!userId) {
      const session = await auth();
      userId = session.userId;
      if (userId) {
        try {
          user = await getUserByClerkId(userId);
        } catch (e) {
          console.warn("[GET /api/v1/keys/exchange] user lookup error:", e);
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ authenticated: false, error: "Unauthorized" }, { status: 401 });
    }

    const planTier = (user?.plan || "free").toLowerCase();

    return NextResponse.json({
      authenticated: true,
      plan: planTier,
      user: {
        id: user?.id || userId,
        email: user?.email || "",
        name: user?.name || null,
        plan: planTier,
      },
    });
  } catch (err) {
    console.error("[GET /api/v1/keys/exchange]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

