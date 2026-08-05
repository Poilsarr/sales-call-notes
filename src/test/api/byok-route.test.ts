import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockCheckFeatureAccess,
  mockPrismaFindUnique,
  mockPrismaUpdate,
  mockCaptureApiError,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCheckFeatureAccess: vi.fn(),
  mockPrismaFindUnique: vi.fn(),
  mockPrismaUpdate: vi.fn(),
  mockCaptureApiError: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/entitlements", () => ({
  checkFeatureAccess: mockCheckFeatureAccess,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: mockPrismaFindUnique,
      update: mockPrismaUpdate,
    },
  },
}));

vi.mock("@/lib/sentry", () => ({
  captureApiError: mockCaptureApiError,
}));

import { GET, PUT } from "@/app/api/settings/byok/route";
import { decryptSecret } from "@/lib/byok";

const MASTER = "test-master-key-0123456789abcdef";
const PRO_GATE = { allowed: true, plan: "PRO", upgradeUrl: undefined, reason: undefined };
const FREE_GATE = { allowed: false, plan: "FREE", upgradeUrl: "/pricing", reason: "Pro" };

function putBody(payload: object): Request {
  return new Request("https://usegauge.com/api/settings/byok", {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: { "content-type": "application/json" },
  });
}

describe("GET /api/settings/byok", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BYOK_MASTER_KEY = MASTER;
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("reports BYOK blocked on Free with an upgrade url", async () => {
    mockAuth.mockResolvedValue({ userId: "clerk-1" });
    mockCheckFeatureAccess.mockResolvedValue(FREE_GATE);
    mockPrismaFindUnique.mockResolvedValue({ byokOpenaiKey: null, byokGroqKey: null });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      allowed: false,
      plan: "FREE",
      upgradeUrl: "/pricing",
      openaiConfigured: false,
      groqConfigured: false,
    });
  });

  it("reports configured keys for a Pro user", async () => {
    mockAuth.mockResolvedValue({ userId: "clerk-1" });
    mockCheckFeatureAccess.mockResolvedValue(PRO_GATE);
    mockPrismaFindUnique.mockResolvedValue({
      byokOpenaiKey: "iv.tag.cipher",
      byokGroqKey: null,
    });

    const body = await (await GET()).json();

    expect(body).toMatchObject({ allowed: true, openaiConfigured: true, groqConfigured: false });
  });

  it("returns 500 when the lookup fails", async () => {
    mockAuth.mockResolvedValue({ userId: "clerk-1" });
    mockCheckFeatureAccess.mockResolvedValue(PRO_GATE);
    mockPrismaFindUnique.mockRejectedValue(new Error("DB down"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Failed to load BYOK status" });
    expect(mockCaptureApiError).toHaveBeenCalledWith("/api/settings/byok", expect.anything(), {
      method: "GET",
    });
  });
});

describe("PUT /api/settings/byok", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BYOK_MASTER_KEY = MASTER;
    mockAuth.mockResolvedValue({ userId: "clerk-1" });
    mockCheckFeatureAccess.mockResolvedValue(PRO_GATE);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await PUT(putBody({ openaiKey: "sk-proj-abcdefghijklmnopqrstuvwx" }));

    expect(response.status).toBe(401);
  });

  it("returns 403 with upgrade url when the plan doesn't allow BYOK", async () => {
    mockCheckFeatureAccess.mockResolvedValue(FREE_GATE);

    const response = await PUT(putBody({ openaiKey: "sk-proj-abcdefghijklmnopqrstuvwx" }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain("Pro");
    expect(body.upgradeUrl).toBe("/pricing");
    expect(mockPrismaUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-JSON body", async () => {
    const request = new Request("https://usegauge.com/api/settings/byok", {
      method: "PUT",
      body: "{ not json",
    });

    const response = await PUT(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid request body" });
  });

  it("returns 400 when no keys are provided", async () => {
    const response = await PUT(putBody({}));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Provide openaiKey and/or groqKey",
    });
  });

  it("returns 400 for an implausible OpenAI key", async () => {
    const response = await PUT(putBody({ openaiKey: "sk-short" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "That doesn't look like an OpenAI key (expects sk-…).",
    });
  });

  it("returns 400 for a Groq key passed as an OpenAI key", async () => {
    const response = await PUT(putBody({ openaiKey: "gsk_abcdefghijklmnopqrstuvwx" }));

    expect(response.status).toBe(400);
  });

  it("saves an encrypted OpenAI key (plaintext never hits the DB)", async () => {
    const plain = "sk-proj-abcdefghijklmnopqrstuvwx";
    mockPrismaUpdate.mockResolvedValue({});

    const response = await PUT(putBody({ openaiKey: plain }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, openaiConfigured: true, groqConfigured: false });
    expect(mockPrismaUpdate).toHaveBeenCalledTimes(1);
    const args = mockPrismaUpdate.mock.calls[0][0];
    const stored = args.data.byokOpenaiKey;
    expect(stored).not.toContain(plain);
    expect(decryptSecret(stored)).toBe(plain);
  });

  it("clears a key when an empty string is sent", async () => {
    mockPrismaUpdate.mockResolvedValue({});

    const response = await PUT(putBody({ openaiKey: "" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, openaiConfigured: false, groqConfigured: false });
    expect(mockPrismaUpdate).toHaveBeenCalledWith({
      where: { clerkId: "clerk-1" },
      data: { byokOpenaiKey: null },
    });
  });

  it("updates only the provided key (partial save)", async () => {
    const groq = "gsk_abcdefghijklmnopqrstuvwx";
    mockPrismaUpdate.mockResolvedValue({});

    const response = await PUT(putBody({ groqKey: groq }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, openaiConfigured: false, groqConfigured: true });
    const args = mockPrismaUpdate.mock.calls[0][0];
    expect(args.data).not.toHaveProperty("byokOpenaiKey");
    expect(decryptSecret(args.data.byokGroqKey)).toBe(groq);
  });

  it("returns 500 with a clear message when BYOK_MASTER_KEY is not configured", async () => {
    delete process.env.BYOK_MASTER_KEY;

    const response = await PUT(putBody({ openaiKey: "sk-proj-abcdefghijklmnopqrstuvwx" }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain("BYOK_MASTER_KEY");
    expect(mockCaptureApiError).not.toHaveBeenCalled();
  });

  it("returns 500 and reports to sentry when the DB update fails", async () => {
    mockPrismaUpdate.mockRejectedValue(new Error("DB down"));

    const response = await PUT(putBody({ openaiKey: "sk-proj-abcdefghijklmnopqrstuvwx" }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to save key");
    expect(mockCaptureApiError).toHaveBeenCalledWith("/api/settings/byok", expect.anything(), {
      method: "PUT",
    });
  });
});
