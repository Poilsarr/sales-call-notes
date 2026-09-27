/**
 * Shared dual-auth resolver for upload/analyze routes (Part 3A).
 *
 * Tries `Authorization: Bearer cn_...` API-key auth FIRST via
 * resolveApiKey(); falls back to the existing Clerk session otherwise.
 * The Clerk cookie flow is untouched — when no (valid) Bearer key is
 * present the behavior is byte-for-byte the old `auth()` preamble.
 *
 * Scope rule: callers pass the request method; a valid key whose scope
 * does not allow the method yields 403 WITHOUT falling back to Clerk
 * (otherwise a read-only key + stolen session cookie could escalate).
 * Rate-limited keys yield 429 with a Retry-After hint.
 */
import type { User } from "@prisma/client";
import prisma from "@/lib/prisma";
import { resolveApiKey } from "@/lib/resolve-api-key";
import { scopeAllowsMethod } from "@/lib/api-key";
import { getUserByClerkId } from "@/lib/get-user";

export type ResolvedRequestUser =
  | {
      ok: true;
      user: User;
      authType: "api_key" | "session";
      /** Clerk id for the session path (blob-path namespace); null for API keys. */
      clerkUserId: string | null;
    }
  | {
      ok: false;
      status: 401 | 403 | 429;
      error: string;
      /** Set on 429 — caller must send a Retry-After header. */
      retryAfterSec?: number;
    };

export async function resolveRequestUser(
  req: Request,
  method: string,
): Promise<ResolvedRequestUser> {
  // 1. Try API key first (per-key rate limit enforced inside).
  const apiKeyResult = await resolveApiKey(req.headers.get("authorization"));

  if (apiKeyResult && apiKeyResult.kind === "rate_limited") {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((apiKeyResult.resetAt - Date.now()) / 1000),
    );
    return {
      ok: false,
      status: 429,
      error: "Rate limit exceeded",
      retryAfterSec,
    };
  }

  const apiKey = apiKeyResult?.kind === "ok" ? apiKeyResult.context : null;
  if (apiKey) {
    if (!scopeAllowsMethod(apiKey.scope, method)) {
      return { ok: false, status: 403, error: "Insufficient scope" };
    }
    // ApiKey.userId is already the Prisma User id (see resolve-api-key).
    const dbUser = await prisma.user.findUnique({
      where: { id: apiKey.userId },
    });
    if (!dbUser) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }
    return { ok: true, user: dbUser, authType: "api_key", clerkUserId: null };
  }

  // 2. Fall back to Clerk session — the pre-existing behavior.
  const { auth } = await import("@clerk/nextjs/server");
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  const dbUser = await getUserByClerkId(clerkUserId);
  return { ok: true, user: dbUser, authType: "session", clerkUserId };
}
