/**
 * Per-API-key rate limiting for /api/v1/*.
 *
 * Limits:
 *   read       → 60  req/min per keyId
 *   read_write → 600 req/min per keyId
 *
 * Backed by the existing Upstash sliding-window primitive in src/lib/rate-limit.ts.
 * Fails OPEN on Redis error — we never want infra hiccups to lock paying
 * customers out of their own data.
 */
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiKeyScope } from "@/lib/api-key";

export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  /** Unix ms when the window resets. */
  resetAt: number;
};

const LIMITS: Record<ApiKeyScope, number> = {
  read: 60,
  read_write: 600,
};

export function limitForScope(scope: string): number {
  return LIMITS[scope as ApiKeyScope] ?? LIMITS.read;
}

/**
 * Check (and increment) the per-key rate limit bucket.
 * Identifies the bucket as `api:ratelimit:{keyId}:{minute}` so logs
 * and Redis introspection line up.
 *
 * Always returns a decision. On Redis failure, allowed=true with
 * remaining=limit so the request proceeds.
 */
export async function checkApiKeyRateLimit(opts: {
  keyId: string;
  scope: string;
}): Promise<RateLimitDecision> {
  const limit = limitForScope(opts.scope);
  const minute = Math.floor(Date.now() / 60_000);
  const redisKey = `api:ratelimit:${opts.keyId}:${minute}`;
  const windowMs = 60_000;

  try {
    // Pass the per-scope type ("read" 60/min, "read_write" 600/min) so the
    // underlying LIMITS buckets in src/lib/rate-limit.ts are honored instead
    // of the flat "api" bucket. Same fail-open + resetAt semantics.
    const { success, remaining, reset } = await checkRateLimit(redisKey, opts.scope);
    // `reset` from Upstash is a unix-seconds timestamp.
    const resetAt =
      typeof reset === "number" && reset > 0 ? reset * 1000 : Date.now() + windowMs;
    return {
      allowed: success,
      remaining: typeof remaining === "number" ? remaining : limit,
      resetAt,
    };
  } catch (e) {
    console.warn(
      `[api-rate-limit] failing open for keyId=${opts.keyId} scope=${opts.scope}`,
      (e as Error)?.message || e,
    );
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowMs };
  }
}