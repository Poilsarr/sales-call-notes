import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";
import * as Sentry from "@sentry/nextjs";

type LimitConfig = {
  tokens: number;
  window: Duration;
};

const LIMITS: Record<string, LimitConfig> = {
  default: { tokens: 60, window: "1 m" },
  analyze: { tokens: 5, window: "1 h" },
  api: { tokens: 100, window: "1 m" },
  oauth: { tokens: 10, window: "1 h" },
  search: { tokens: 30, window: "1 m" },
  read: { tokens: 60, window: "1 m" },
  read_write: { tokens: 600, window: "1 m" },
  v1keys: { tokens: 5, window: "1 h" },
  v1session: { tokens: 60, window: "1 m" },
  live: { tokens: 120, window: "1 m" },
  leads: { tokens: 5, window: "1 h" },
};

const instances = new Map<string, Ratelimit>();

function getRatelimit(type: string = 'default'): Ratelimit | null {
  if (instances.has(type)) return instances.get(type)!;

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim() || "";
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || "";
  const hasCreds = upstashUrl && upstashToken && !upstashUrl.includes("your-database-name");

  if (!hasCreds) return null;

  try {
    const config = LIMITS[type] || LIMITS.default;
    const redis = new Redis({ url: upstashUrl, token: upstashToken });
    const rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.tokens, config.window),
      analytics: true,
    });
    instances.set(type, rl);
    return rl;
  } catch (e) {
    console.warn(`Rate limiter init failed for ${type}`, (e as Error)?.message || e);
    return null;
  }
}

export async function rateLimit(opts: { key: string; limit: number; windowSec: number }) {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim() || "";
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || "";
  const hasCreds = upstashUrl && upstashToken && !upstashUrl.includes("your-database-name");
  if (!hasCreds) return { success: true };

  const cacheKey = `rl_${opts.limit}_${opts.windowSec}`;
  let rl = instances.get(cacheKey) as Ratelimit | undefined;
  if (!rl) {
    try {
      const redis = new Redis({ url: upstashUrl, token: upstashToken });
      rl = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(opts.limit, `${opts.windowSec} s` as Duration),
        analytics: false,
      });
      instances.set(cacheKey, rl);
    } catch {
      return { success: true };
    }
  }
  try {
    const { success } = await rl.limit(opts.key);
    return { success };
  } catch {
    return { success: true };
  }
}

export async function checkRateLimit(identifier: string, type: string = 'default') {
  const rl = getRatelimit(type);
  if (!rl) return { success: true, remaining: 999, reset: 0 };

  try {
    const { success, remaining, reset } = await rl.limit(identifier);
    return { success, remaining, reset };
  } catch (e) {
    console.warn(`Rate limiter unavailable for ${type} (Redis down?), failing open`, (e as Error)?.message || e);
    // Fail-open is deliberate (never lock customers out of their own data),
    // but it must be observable — surface the outage to Sentry.
    if (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN) {
      Sentry.captureException(e, {
        tags: { source: "rate-limit", type },
        level: "warning",
      });
    }
    return { success: true, remaining: 999, reset: 0 };
  }
}

/**
 * Fail-CLOSED variant of checkRateLimit for unauthenticated public routes
 * (e.g. POST /api/leads). Unlike checkRateLimit — which deliberately fails
 * open so customers are never locked out of their own data — a public,
 * anonymous endpoint must not accept writes when the limiter is unavailable
 * (no Redis creds, Redis down, unexpected error). Callers should treat any
 * non-success result (limited OR unavailable) as a 429.
 */
export async function checkRateLimitStrict(identifier: string, type: string = 'default') {
  const rl = getRatelimit(type);
  if (!rl) {
    console.warn(`Rate limiter unavailable for ${type} (no credentials) — failing closed`);
    return { success: false, unavailable: true, remaining: 0, reset: 0 };
  }

  try {
    const { success, remaining, reset } = await rl.limit(identifier);
    return { success, unavailable: false, remaining, reset };
  } catch (e) {
    console.warn(`Rate limiter unavailable for ${type} (Redis down?), failing closed`, (e as Error)?.message || e);
    if (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN) {
      Sentry.captureException(e, {
        tags: { source: "rate-limit", type },
        level: "warning",
      });
    }
    return { success: false, unavailable: true, remaining: 0, reset: 0 };
  }
}
