import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  auth: vi.fn(),
  resolveApiKey: vi.fn(),
  scopeAllowsMethod: vi.fn(),
  getUserByClerkId: vi.fn(),
  generateApiKey: vi.fn(),
  logAuditAction: vi.fn(),
  getPlan: vi.fn(),
  hasFeature: vi.fn(),
  createKey: vi.fn(),
  findManyCalls: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => mocks.checkRateLimit(...args),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/resolve-api-key", () => ({ resolveApiKey: mocks.resolveApiKey }));
vi.mock("@/lib/api-key", () => ({
  scopeAllowsMethod: mocks.scopeAllowsMethod,
  generateApiKey: mocks.generateApiKey,
}));
vi.mock("@/lib/get-user", () => ({ getUserByClerkId: mocks.getUserByClerkId }));
vi.mock("@/lib/audit-logger", () => ({ logAuditAction: mocks.logAuditAction }));
vi.mock("@/lib/plans", () => ({
  getPlan: mocks.getPlan,
  hasFeature: mocks.hasFeature,
}));
vi.mock("@/lib/prisma", () => ({
  default: {
    apiKey: { create: mocks.createKey },
    call: { findMany: mocks.findManyCalls },
  },
}));

import { rateLimitMiddleware } from "@/middleware-rate-limit";
import { checkApiKeyRateLimit } from "@/lib/api-rate-limit";
import { POST as keysPost } from "@/app/api/v1/keys/route";
import { GET as callsGet } from "@/app/api/v1/calls/route";

const repoRoot = join(__dirname, "..", "..");

beforeEach(() => {
  vi.clearAllMocks();
  mocks.checkRateLimit.mockResolvedValue({ success: true, remaining: 999, reset: 0 });
  mocks.auth.mockResolvedValue({ userId: "clerk-1" });
  mocks.resolveApiKey.mockResolvedValue(null);
});

function fakeReq(pathname: string, headers: Record<string, string> = {}) {
  return {
    nextUrl: { pathname },
    headers: new Headers(headers),
  } as any;
}

describe("XFF last-hop keying (middleware-rate-limit)", () => {
  it("keys on the LAST x-forwarded-for entry, not the client-controlled first hop", async () => {
    await rateLimitMiddleware(
      fakeReq("/api/test", { "x-forwarded-for": "1.2.3.4, 203.0.113.9" }),
    );
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("203.0.113.9", "api");
  });

  it("uses x-real-ip when x-forwarded-for is absent", async () => {
    await rateLimitMiddleware(fakeReq("/api/test", { "x-real-ip": "198.51.100.7" }));
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("198.51.100.7", "api");
  });

  it("falls back to anonymous when no proxy headers exist", async () => {
    await rateLimitMiddleware(fakeReq("/api/test"));
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("anonymous", "api");
  });

  it("handles a single-entry x-forwarded-for", async () => {
    await rateLimitMiddleware(fakeReq("/api/test", { "x-forwarded-for": "203.0.113.9" }));
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("203.0.113.9", "api");
  });

  it("still skips /api/transcribe/live (in-route limiter owns it)", async () => {
    const res = await rateLimitMiddleware(fakeReq("/api/transcribe/live"));
    expect(res).toBeNull();
    expect(mocks.checkRateLimit).not.toHaveBeenCalled();
  });

  it("returns 429 when the bucket is exhausted", async () => {
    mocks.checkRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: 0 });
    const res = await rateLimitMiddleware(fakeReq("/api/test"));
    expect(res?.status).toBe(429);
  });
});

describe("LIMITS buckets in src/lib/rate-limit.ts", () => {
  const SRC = readFileSync(join(repoRoot, "src/lib/rate-limit.ts"), "utf8");

  const cases: Array<[string, RegExp]> = [
    ["read", /read:\s*\{\s*tokens:\s*60,\s*window:\s*"1 m"\s*\}/],
    ["read_write", /read_write:\s*\{\s*tokens:\s*600,\s*window:\s*"1 m"\s*\}/],
    ["v1keys", /v1keys:\s*\{\s*tokens:\s*5,\s*window:\s*"1 h"\s*\}/],
    ["v1session", /v1session:\s*\{\s*tokens:\s*60,\s*window:\s*"1 m"\s*\}/],
    ["live", /live:\s*\{\s*tokens:\s*120,\s*window:\s*"1 m"\s*\}/],
  ];

  it.each(cases)("defines %s with the right tokens/window", (_name, re) => {
    expect(SRC).toMatch(re);
  });

  it("defaults unknown types to the 60/min default bucket", () => {
    expect(SRC).toMatch(/LIMITS\[type\] \|\| LIMITS\.default/);
  });
});

describe("api-rate-limit passes per-scope type", () => {
  it("read keys hit the 'read' type bucket", async () => {
    mocks.checkRateLimit.mockResolvedValueOnce({ success: true, remaining: 60, reset: 1_700_000_000 });
    await checkApiKeyRateLimit({ keyId: "k-read", scope: "read" });
    expect(mocks.checkRateLimit).toHaveBeenCalledWith(
      expect.stringContaining("api:ratelimit:k-read:"),
      "read",
    );
  });

  it("read_write keys hit the 'read_write' type bucket", async () => {
    mocks.checkRateLimit.mockResolvedValueOnce({ success: true, remaining: 599, reset: 1_700_000_000 });
    await checkApiKeyRateLimit({ keyId: "k-rw", scope: "read_write" });
    expect(mocks.checkRateLimit).toHaveBeenCalledWith(
      expect.stringContaining("api:ratelimit:k-rw:"),
      "read_write",
    );
  });

  it("fails open on limiter error (allowed=true)", async () => {
    mocks.checkRateLimit.mockRejectedValueOnce(new Error("Redis down"));
    const result = await checkApiKeyRateLimit({ keyId: "k-err", scope: "read" });
    expect(result.allowed).toBe(true);
  });
});

describe("POST /api/v1/keys per-user cap", () => {
  it("returns 429 before creating a key when the 5/hr bucket is exhausted", async () => {
    mocks.checkRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: 0 });
    const res = await keysPost(
      new Request("http://localhost/api/v1/keys", {
        method: "POST",
        body: JSON.stringify({ name: "my key", scope: "read" }),
      }),
    );
    expect(res.status).toBe(429);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("v1keys:clerk-1", "v1keys");
    expect(mocks.createKey).not.toHaveBeenCalled();
    expect(mocks.generateApiKey).not.toHaveBeenCalled();
  });

  it("creates the key when under the limit (and still checks the bucket)", async () => {
    mocks.getUserByClerkId.mockResolvedValue({ id: "db-1", plan: "pro" });
    mocks.hasFeature.mockReturnValue(true);
    mocks.generateApiKey.mockReturnValue({ raw: "cn_live_raw", prefix: "cn_live_p", hash: "h" });
    mocks.createKey.mockResolvedValue({
      id: "k1",
      name: "my key",
      prefix: "cn_live_p",
      scope: "read",
      createdAt: new Date(),
    });
    mocks.logAuditAction.mockResolvedValue(undefined);
    const res = await keysPost(
      new Request("http://localhost/api/v1/keys", {
        method: "POST",
        body: JSON.stringify({ name: "my key", scope: "read" }),
      }),
    );
    expect(res.status).toBe(201);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("v1keys:clerk-1", "v1keys");
    expect(mocks.createKey).toHaveBeenCalled();
  });
});

describe("GET /api/v1/calls Clerk-session fallback limit", () => {
  it("returns 429 when the session bucket (60/min) is exhausted", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-9" });
    mocks.checkRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: 0 });
    const res = await callsGet(new Request("http://localhost/api/v1/calls"));
    expect(res.status).toBe(429);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("v1session:clerk-9", "v1session");
    expect(mocks.findManyCalls).not.toHaveBeenCalled();
  });

  it("proceeds when the session bucket allows", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-9" });
    mocks.getUserByClerkId.mockResolvedValue({ id: "db-9" });
    mocks.findManyCalls.mockResolvedValue([]);
    const res = await callsGet(new Request("http://localhost/api/v1/calls"));
    expect(res.status).toBe(200);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("v1session:clerk-9", "v1session");
    expect(mocks.findManyCalls).toHaveBeenCalled();
  });

  it("does not apply the v1session bucket on the API-key path", async () => {
    mocks.resolveApiKey.mockResolvedValue({
      kind: "ok",
      context: { userId: "db-2", keyId: "key_2", scope: "read", prefix: "cn_live_x" },
    });
    mocks.scopeAllowsMethod.mockReturnValue(true);
    mocks.findManyCalls.mockResolvedValue([]);
    const res = await callsGet(new Request("http://localhost/api/v1/calls"));
    expect(res.status).toBe(200);
    const calls = mocks.checkRateLimit.mock.calls;
    expect(calls.some((c: unknown[]) => String(c[0]).startsWith("v1session:"))).toBe(false);
  });
});

describe("middleware isPublicApi list", () => {
  const MW = readFileSync(join(repoRoot, "src/middleware.ts"), "utf8");

  it("no longer lists the phantom /api/v1/transcribe route", () => {
    expect(MW).not.toMatch(/\/api\/v1\/transcribe/);
  });

  it("no longer lists the phantom /api/v1/competitive-intelligence route", () => {
    expect(MW).not.toMatch(/\/api\/v1\/competitive-intelligence/);
  });

  it("still lists the real public API routes", () => {
    expect(MW).toMatch(/\/api\/v1\/calls/);
    expect(MW).toMatch(/\/api\/pricing-preview/);
    expect(MW).toMatch(/\/api\/health/);
  });
});