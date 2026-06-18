import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRedis = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

vi.mock("@upstash/redis/cloudflare", () => {
  function MockRedis() {
    return mockRedis;
  }
  return { Redis: MockRedis };
});

beforeEach(() => {
  vi.clearAllMocks();
  process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
});

describe("cacheGet / cacheSet round-trip", () => {
  it("stores and retrieves a value", async () => {
    const { cacheGet, cacheSet } = await import("@/lib/cache");
    const testValue = { id: 1, name: "test" };

    await cacheSet("test-key", testValue, 60);
    expect(mockRedis.set).toHaveBeenCalledWith("test-key", testValue, { ex: 60 });

    mockRedis.get.mockResolvedValueOnce(testValue);
    const result = await cacheGet("test-key");
    expect(result).toEqual(testValue);
    expect(mockRedis.get).toHaveBeenCalledWith("test-key");
  });

  it("returns null when Redis is unavailable", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    const { cacheGet } = await import("@/lib/cache");
    const result = await cacheGet("any-key");
    expect(result).toBeNull();
  });
});

describe("cacheDel", () => {
  it("removes a key", async () => {
    const { cacheDel } = await import("@/lib/cache");

    await cacheDel("test-key");
    expect(mockRedis.del).toHaveBeenCalledWith("test-key");
  });

  it("silently fails when Redis is unavailable", async () => {
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { cacheDel } = await import("@/lib/cache");

    await expect(cacheDel("any-key")).resolves.toBeUndefined();
    expect(mockRedis.del).not.toHaveBeenCalled();
  });
});

describe("makeCacheKey", () => {
  it("builds correct key from prefix and parts", async () => {
    const { makeCacheKey } = await import("@/lib/cache");

    const key = makeCacheKey("calls", "user-1", "call-123");
    expect(key).toBe("cache:calls:user-1:call-123");
  });

  it("filters out undefined parts", async () => {
    const { makeCacheKey } = await import("@/lib/cache");

    const key = makeCacheKey("calls", "user-1", undefined);
    expect(key).toBe("cache:calls:user-1");
  });
});
