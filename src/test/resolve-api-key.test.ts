import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    apiKey: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
    user: { findUnique: vi.fn() },
    call: { findMany: vi.fn() },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/get-user", () => ({
  getUserByClerkId: vi.fn(),
}));

vi.mock("@/lib/audit-logger", () => ({
  logAuditAction: vi.fn(),
}));

// Mock the rate-limit lib so tests don't hit Redis and we control pass/deny.
const checkApiKeyRateLimitMock = vi.fn();
vi.mock("@/lib/api-rate-limit", () => ({
  checkApiKeyRateLimit: (...args: unknown[]) => checkApiKeyRateLimitMock(...args),
}));

import { resolveApiKey } from "@/lib/resolve-api-key";
import prisma from "@/lib/prisma";

const mockPrisma = prisma as unknown as {
  apiKey: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
};
mockPrisma.apiKey.update.mockResolvedValue(undefined);

const fakeRow = (overrides: Partial<{
  revokedAt: Date | null;
  hash: string;
}> = {}) => ({
  id: "key_1",
  userId: "u_1",
  prefix: "cn_live_abcd",
  scope: "read",
  hash: "irrelevant",
  revokedAt: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.apiKey.update.mockResolvedValue(undefined);
  // Default: rate limit allows.
  checkApiKeyRateLimitMock.mockResolvedValue({
    allowed: true,
    remaining: 60,
    resetAt: Date.now() + 60_000,
  });
});

describe("resolveApiKey", () => {
  it("returns null on missing header", async () => {
    expect(await resolveApiKey(null)).toBeNull();
    expect(await resolveApiKey("")).toBeNull();
  });

  it("returns null on malformed Bearer", async () => {
    expect(await resolveApiKey("Basic abc")).toBeNull();
    expect(await resolveApiKey("Bearer sk_live_x")).toBeNull();
  });

  it("returns null when prefix not found", async () => {
    mockPrisma.apiKey.findUnique.mockResolvedValueOnce(null);
    expect(await resolveApiKey("Bearer cn_live_unknown_long_enough")).toBeNull();
  });

  it("returns null when key is revoked", async () => {
    mockPrisma.apiKey.findUnique.mockResolvedValueOnce(
      fakeRow({ revokedAt: new Date() }),
    );
    expect(await resolveApiKey("Bearer cn_live_abcd1234efgh5678")).toBeNull();
  });

  it("returns null on hash mismatch (timing-safe)", async () => {
    mockPrisma.apiKey.findUnique.mockResolvedValueOnce(fakeRow());
    expect(await resolveApiKey("Bearer cn_live_abcd1234efgh5678")).toBeNull();
  });

  it("returns ok context on valid key + matching hash", async () => {
    const { generateApiKey } = await import("@/lib/api-key");
    const { raw, hash } = generateApiKey("test");
    mockPrisma.apiKey.findUnique.mockResolvedValueOnce({
      id: "key_2",
      userId: "u_2",
      prefix: prefixOfRaw(raw),
      scope: "read_write",
      hash,
      revokedAt: null,
    });
    const result = await resolveApiKey(`Bearer ${raw}`);
    expect(result).toEqual({
      kind: "ok",
      context: {
        userId: "u_2",
        keyId: "key_2",
        scope: "read_write",
        prefix: prefixOfRaw(raw),
      },
    });
  });

  it("does not block on lastUsedAt update", async () => {
    const { generateApiKey } = await import("@/lib/api-key");
    const { raw, hash } = generateApiKey();
    mockPrisma.apiKey.findUnique.mockResolvedValueOnce({
      id: "key_3",
      userId: "u_3",
      prefix: prefixOfRaw(raw),
      scope: "read",
      hash,
      revokedAt: null,
    });
    const result = await resolveApiKey(`Bearer ${raw}`);
    expect(result?.kind).toBe("ok");
    if (result?.kind === "ok") {
      expect(result.context.userId).toBe("u_3");
    }
  });

  it("returns rate_limited when checkApiKeyRateLimit denies", async () => {
    const { generateApiKey } = await import("@/lib/api-key");
    const { raw, hash } = generateApiKey();
    mockPrisma.apiKey.findUnique.mockResolvedValueOnce({
      id: "key_4",
      userId: "u_4",
      prefix: prefixOfRaw(raw),
      scope: "read",
      hash,
      revokedAt: null,
    });
    const resetAt = Date.now() + 30_000;
    checkApiKeyRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt,
    });
    const result = await resolveApiKey(`Bearer ${raw}`);
    expect(result).toEqual({ kind: "rate_limited", resetAt });
  });

  it("passes keyId + scope to checkApiKeyRateLimit", async () => {
    const { generateApiKey } = await import("@/lib/api-key");
    const { raw, hash } = generateApiKey();
    mockPrisma.apiKey.findUnique.mockResolvedValueOnce({
      id: "key_5",
      userId: "u_5",
      prefix: prefixOfRaw(raw),
      scope: "read_write",
      hash,
      revokedAt: null,
    });
    await resolveApiKey(`Bearer ${raw}`);
    expect(checkApiKeyRateLimitMock).toHaveBeenCalledWith({
      keyId: "key_5",
      scope: "read_write",
    });
  });
});

function prefixOfRaw(raw: string): string {
  return raw.slice(0, 12);
}