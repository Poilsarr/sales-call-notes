import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createOpenAIClient: vi.fn(),
  getSecret: vi.fn(() => undefined),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/openai-client", () => ({ createOpenAIClient: mocks.createOpenAIClient }));
vi.mock("@/lib/secrets", () => ({ getSecret: mocks.getSecret }));

import { GET } from "@/app/api/debug/transcription-test/route";

describe("GET /api/debug/transcription-test auth guard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated (no key booleans leaked)", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const res = await GET();
    expect(res.status).toBe(401);
    expect(mocks.getSecret).not.toHaveBeenCalled();
  });

  it("returns 200 with only boolean key-set flags for an authenticated user", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.createOpenAIClient.mockReturnValue({ models: { list: vi.fn().mockRejectedValue(new Error("no net")) } });
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).not.toHaveProperty("openaiKeyLength");
    expect(body).not.toHaveProperty("groqKeyLength");
    expect(body).toHaveProperty("openaiKeySet");
  });
});
