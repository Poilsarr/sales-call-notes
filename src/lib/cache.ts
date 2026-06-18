import { Redis } from "@upstash/redis/cloudflare";

const DEFAULT_TTL = 60;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token || url.includes("your-database-name")) return null;
  return new Redis({ url, token });
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = DEFAULT_TTL,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    /* fail silently */
  }
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    /* fail silently */
  }
}

export function makeCacheKey(
  prefix: string,
  ...parts: (string | undefined)[]
): string {
  return `cache:${prefix}:${parts.filter(Boolean).join(":")}`;
}
