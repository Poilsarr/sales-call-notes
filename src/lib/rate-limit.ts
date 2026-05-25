import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";

let ratelimitInstance: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (ratelimitInstance) return ratelimitInstance;

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim() || "";
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || "";
  const hasCreds = upstashUrl && upstashToken && !upstashUrl.includes("your-database-name");

  if (!hasCreds) return null;

  try {
    const redis = new Redis({ url: upstashUrl, token: upstashToken });
    ratelimitInstance = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
    });
    return ratelimitInstance;
  } catch (e) {
    console.warn("Rate limiter init failed", (e as Error)?.message || e);
    return null;
  }
}

export async function checkRateLimit(identifier: string) {
  const rl = getRatelimit();
  if (!rl) return { success: true, remaining: 999, reset: 0 };

  try {
    const { success, remaining, reset } = await rl.limit(identifier);
    return { success, remaining, reset };
  } catch (e) {
    console.warn("Rate limiter unavailable (Redis down?), failing open", (e as Error)?.message || e);
    return { success: true, remaining: 999, reset: 0 };
  }
}
