/**
 * Part 3A: Bearer API-key auth on /api/upload-url + key mint on
 * POST /api/v1/keys/exchange.
 *
 * Covers: read_write Bearer succeeds on upload-url, exchange returns the
 * { raw, prefix } once-shape, read-scope Bearer 403s on POST, no-auth
 * 401s, and the Clerk cookie flow is unaffected.
 *
 * Mocks Clerk / Prisma / fetch. No live network: resolveApiKey's
 * per-key rate check fails open without Upstash creds, and global fetch
 * throws if anything tries to leave the process.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateApiKey, hashKey, prefixOf } from "@/lib/api-key";

const {
  mockAuth,
  mockGetUser,
  mockIssueSignedToken,
  mockPresignUrl,
  mockCheckRateLimit,
  mockLogAudit,
  mockPrisma,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetUser: vi.fn(),
  mockIssueSignedToken: vi.fn(),
  mockPresignUrl: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockLogAudit: vi.fn(),
  mockPrisma: {
    user: { findUnique: vi.fn() },
    apiKey: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/get-user", () => ({
  getUserByClerkId: mockGetUser,
}));

vi.mock("@/lib/prisma", () => ({
  default: mockPrisma,
}));

vi.mock("@vercel/blob", () => ({
  issueSignedToken: mockIssueSignedToken,
  presignUrl: mockPresignUrl,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
}));

vi.mock("@/lib/audit-logger", () => ({
  logAuditAction: mockLogAudit,
}));

import { POST as uploadPost } from "@/app/api/upload-url/route";
import { POST as exchangePost } from "@/app/api/v1/keys/exchange/route";

function uploadRequest(init?: { authHeader?: string; body?: Record<string, unknown> }): Request {
  return new Request("https://usegauge.com/api/upload-url", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(init?.authHeader ? { authorization: init.authHeader } : {}),
    },
    body: JSON.stringify({
      filename: "call.webm",
      fileSize: 1024 * 1024,
      contentType: "audio/webm",
      ...init?.body,
    }),
  });
}

/** Seed prisma.apiKey.findUnique so resolveApiKey() validates `raw` for real. */
function seedKeyRow(raw: string, scope: string) {
  mockPrisma.apiKey.findUnique.mockResolvedValue({
    id: "key-1",
    userId: "user-1",
    hash: hashKey(raw),
    scope,
    prefix: prefixOf(raw),
    revokedAt: null,
  });
}

describe("Part 3A Bearer-key upload + extension exchange", () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BLOB_STORE_ID = "store_4SiryHapG57GVkfq";
    // No live network — fail loudly if anything tries.
    fetchSpy.mockRejectedValue(new Error("live network disabled in test"));
    vi.stubGlobal("fetch", fetchSpy);

    mockAuth.mockResolvedValue({ userId: null });
    mockGetUser.mockResolvedValue({ id: "user-1", plan: "pro" });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      plan: "pro",
      teamId: null,
      email: "u@example.com",
    });
    mockPrisma.apiKey.findUnique.mockResolvedValue(null);
    mockPrisma.apiKey.update.mockResolvedValue({});
    mockCheckRateLimit.mockResolvedValue({ success: true, remaining: 4, reset: 0 });
    mockLogAudit.mockResolvedValue(undefined);
    mockIssueSignedToken.mockResolvedValue("signed-token");
    mockPresignUrl.mockResolvedValue({
      presignedUrl: "https://verify-upload.blob.vercel-storage.com/upload",
    });
  });

  afterEach(() => {
    delete process.env.BLOB_STORE_ID;
    vi.unstubAllGlobals();
  });

  it("Bearer read_write key succeeds on /api/upload-url without a session", async () => {
    const { raw } = generateApiKey("test");
    seedKeyRow(raw, "read_write");

    const res = await uploadPost(uploadRequest({ authHeader: `Bearer ${raw}` }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.presignedUrl).toContain("https://");
    expect(body.blobUrl).toContain(".private.blob.vercel-storage.com/uploads/user-1/");
    expect(body.blobUrl).not.toContain("store_");
    // Clerk session never consulted on the key path.
    expect(mockAuth).not.toHaveBeenCalled();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("POST /api/v1/keys/exchange mints a read_write extension key (raw once + prefix)", async () => {
    mockAuth.mockResolvedValue({ userId: "clerk-9" });
    mockGetUser.mockResolvedValue({ id: "user-9", plan: "pro" });
    mockPrisma.apiKey.create.mockImplementation(async (args: any) => ({
      id: "key-9",
      name: args.data.name,
      prefix: args.data.prefix,
      scope: args.data.scope,
      createdAt: new Date("2026-09-27T00:00:00Z"),
    }));

    const res = await exchangePost();
    expect(res.status).toBe(201);
    const body = await res.json();

    expect(body.scope).toBe("read_write");
    expect(body.name).toMatch(/^extension-\d{4}-\d{2}-\d{2}$/);
    expect(typeof body.raw).toBe("string");
    expect(body.raw.startsWith("cn_")).toBe(true);
    expect(body.prefix).toBe(body.raw.slice(0, 12));
    // 5/hr v1keys bucket + api_access plan gate reused.
    expect(mockCheckRateLimit).toHaveBeenCalledWith("v1keys:clerk-9", "v1keys");
    expect(mockLogAudit).toHaveBeenCalledWith(
      "user-9",
      "apikey.create",
      "key-9",
      "ApiKey",
      expect.objectContaining({ scope: "read_write", via: "extension-exchange" }),
    );
  });

  it("exchange requires the api_access plan gate (free plan 403s)", async () => {
    mockAuth.mockResolvedValue({ userId: "clerk-1" });
    mockGetUser.mockResolvedValue({ id: "user-1", plan: "free" });

    const res = await exchangePost();

    expect(res.status).toBe(403);
    expect(mockPrisma.apiKey.create).not.toHaveBeenCalled();
  });

  it("Bearer read-scope key 403s on POST /api/upload-url", async () => {
    const { raw } = generateApiKey("test");
    seedKeyRow(raw, "read");

    const res = await uploadPost(uploadRequest({ authHeader: `Bearer ${raw}` }));

    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("Insufficient scope");
    expect(mockIssueSignedToken).not.toHaveBeenCalled();
  });

  it("no Bearer + no session 401s", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await uploadPost(uploadRequest());

    expect(res.status).toBe(401);
    expect(mockPrisma.apiKey.findUnique).not.toHaveBeenCalled();
    expect(mockIssueSignedToken).not.toHaveBeenCalled();
  });

  it("Clerk cookie flow is unaffected (no Bearer header → old behavior)", async () => {
    mockAuth.mockResolvedValue({ userId: "clerk-1" });
    mockGetUser.mockResolvedValue({ id: "user-1", plan: "free" });

    const res = await uploadPost(uploadRequest());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.blobUrl).toContain("/uploads/clerk-1/");
    expect(mockGetUser).toHaveBeenCalledWith("clerk-1");
  });

  it("unknown Bearer key falls back to Clerk (bad key + session still works)", async () => {
    mockAuth.mockResolvedValue({ userId: "clerk-1" });
    mockGetUser.mockResolvedValue({ id: "user-1", plan: "free" });
    mockPrisma.apiKey.findUnique.mockResolvedValue(null); // unknown prefix

    const { raw } = generateApiKey("test");
    const res = await uploadPost(uploadRequest({ authHeader: `Bearer ${raw}` }));

    expect(res.status).toBe(200);
    expect((await res.json()).blobUrl).toContain("/uploads/clerk-1/");
  });
});
