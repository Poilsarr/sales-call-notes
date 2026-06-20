import { NextResponse } from "next/server";
import { resolveApiKey } from "@/lib/resolve-api-key";
import { scopeAllowsMethod } from "@/lib/api-key";
import prisma from "@/lib/prisma";

/**
 * GET /api/v1/calls
 *
 * Proves API key auth works. Lists the caller's own calls.
 * Accepts EITHER:
 *   - Clerk session cookie (existing behavior)
 *   - Authorization: Bearer cn_live_...   (new API key path)
 *
 * Scope rules:
 *   read → may call GET
 *   read_write → may call any method
 *
 * Rate limiting:
 *   Each API key is limited to 60 req/min (read) or 600 req/min (read_write).
 *   Over-limit requests return 429 with a Retry-After header (seconds).
 */
export async function GET(req: Request) {
  // 1. Try API key first (preserves Clerk session fallback).
  const apiKeyResult = await resolveApiKey(req.headers.get("authorization"));

  if (apiKeyResult && apiKeyResult.kind === "rate_limited") {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((apiKeyResult.resetAt - Date.now()) / 1000),
    );
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      },
    );
  }

  const apiKey = apiKeyResult?.kind === "ok" ? apiKeyResult.context : null;
  let userId: string | null = null;

  if (apiKey) {
    if (!scopeAllowsMethod(apiKey.scope, "GET")) {
      return NextResponse.json({ error: "Insufficient scope" }, { status: 403 });
    }
    userId = apiKey.userId;
  } else {
    // Fall back to Clerk session — same logic as the original /api/calls GET.
    const { auth } = await import("@clerk/nextjs/server");
    const session = await auth();
    userId = session.userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // 2. Look up db userId from clerkId (api key already gave us db id).
  let dbUserId: string;
  if (apiKey) {
    dbUserId = apiKey.userId;
  } else {
    const { getUserByClerkId } = await import("@/lib/get-user");
    const u = await getUserByClerkId(userId!);
    dbUserId = u.id;
  }

  const calls = await prisma.call.findMany({
    where: { userId: dbUserId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      filename: true,
      createdAt: true,
      healthScore: true,
      duration: true,
      source: true,
    },
  });

  return NextResponse.json({ calls });
}