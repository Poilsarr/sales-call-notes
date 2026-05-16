import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstashCreds = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  && !process.env.UPSTASH_REDIS_REST_URL.includes("your-database-name");

let ratelimitInstance: Ratelimit | null = null;

if (hasUpstashCreds) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  ratelimitInstance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: true,
  });
}

export async function checkRateLimit(identifier: string) {
  if (!ratelimitInstance) {
    return { success: true, remaining: 999, reset: 0 };
  }
  try {
    const { success, remaining, reset } = await ratelimitInstance.limit(identifier);
    return { success, remaining, reset };
  } catch {
    return { success: true, remaining: 999, reset: 0 };
  }
}
