import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";

type LimitConfig = {
  tokens: number;
  window: Duration;
};

const LIMITS: Record<string, LimitConfig> = {
  default: { tokens: 60, window: "1 m" },
  analyze: { tokens: 5, window: "1 h" },
  api: { tokens: 100, window: "1 m" },
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

export async function checkRateLimit(identifier: string, type: string = 'default') {
  const rl = getRatelimit(type);
  if (!rl) return { success: true, remaining: 999, reset: 0 };

  try {
    const { success, remaining, reset } = await rl.limit(identifier);
    return { success, remaining, reset };
  } catch (e) {
    console.warn(`Rate limiter unavailable for ${type} (Redis down?), failing open`, (e as Error)?.message || e);
    return { success: true, remaining: 999, reset: 0 };
  }
}
