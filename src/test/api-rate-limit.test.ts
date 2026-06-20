import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the underlying rate-limit primitive so we control allow/deny/throw.
const checkRateLimitMock = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
}));

import {
  checkApiKeyRateLimit,
  limitForScope,
} from "@/lib/api-rate-limit";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("limitForScope", () => {
  it("returns 60 for read scope", () => {
    expect(limitForScope("read")).toBe(60);
  });
  it("returns 600 for read_write scope", () => {
    expect(limitForScope("read_write")).toBe(600);
  });
  it("falls back to read limit (60) for unknown scopes", () => {
    expect(limitForScope("admin")).toBe(60);
    expect(limitForScope("")).toBe(60);
  });
});

describe("checkApiKeyRateLimit", () => {
  it("returns allowed + remaining when under the limit", async () => {
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 42,
      reset: 1_700_000_000, // unix seconds
    });
    const result = await checkApiKeyRateLimit({
      keyId: "k1",
      scope: "read",
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(42);
    expect(result.resetAt).toBe(1_700_000_000_000); // converted to ms
  });

  it("returns denied + remaining=0 when over the limit", async () => {
    checkRateLimitMock.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: 1_700_000_030,
    });
    const result = await checkApiKeyRateLimit({
      keyId: "k2",
      scope: "read",
    });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetAt).toBe(1_700_000_030_000);
  });

  it("uses the read_write (600) bucket for read_write keys", async () => {
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 599,
      reset: 1_700_000_060,
    });
    const result = await checkApiKeyRateLimit({
      keyId: "k3",
      scope: "read_write",
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(599);
  });

  it("keys the redis bucket as api:ratelimit:{keyId}:{minute}", async () => {
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 60,
      reset: 1_700_000_060,
    });
    const before = Math.floor(Date.now() / 60_000);
    await checkApiKeyRateLimit({ keyId: "abc123", scope: "read" });
    const call = checkRateLimitMock.mock.calls[0];
    const redisKey = call[0] as string;
    expect(redisKey.startsWith("api:ratelimit:abc123:")).toBe(true);
    const after = Math.floor(Date.now() / 60_000);
    const minute = Number(redisKey.split(":").pop());
    expect([before, after]).toContain(minute);
  });

  it("uses 'api' rate-limit type so the right bucket is hit", async () => {
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 60,
      reset: 1_700_000_060,
    });
    await checkApiKeyRateLimit({ keyId: "k4", scope: "read" });
    expect(checkRateLimitMock).toHaveBeenCalledWith(
      expect.stringContaining("api:ratelimit:k4:"),
      "api",
    );
  });

  it("fails OPEN when the underlying rate limiter throws", async () => {
    checkRateLimitMock.mockRejectedValueOnce(new Error("Redis down"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await checkApiKeyRateLimit({
      keyId: "k5",
      scope: "read",
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(60); // full quota returned
    expect(result.resetAt).toBeGreaterThan(Date.now());
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("falls back to limit when the underlying limiter returns no `remaining`", async () => {
    // No `remaining` field — function should default to the per-scope limit
    // rather than NaN'ing out.
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      reset: 1_700_000_060,
    } as never);
    const result = await checkApiKeyRateLimit({
      keyId: "k6",
      scope: "read_write",
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(600);
  });

  it("computes resetAt from window length when reset is missing", async () => {
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 10,
      reset: 0,
    });
    const before = Date.now();
    const result = await checkApiKeyRateLimit({
      keyId: "k7",
      scope: "read",
    });
    expect(result.resetAt).toBeGreaterThanOrEqual(before + 60_000);
    expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 60_000 + 1_000);
  });

  it("returns a resetAt within the next 60 seconds on a normal allow", async () => {
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 30,
      reset: Math.floor(Date.now() / 1000) + 30, // 30s from now
    });
    const before = Date.now();
    const result = await checkApiKeyRateLimit({
      keyId: "k8",
      scope: "read",
    });
    // Should land roughly within (before+30s, before+60s) range.
    expect(result.resetAt).toBeGreaterThanOrEqual(before + 25_000);
    expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 60_000 + 1_000);
  });
});