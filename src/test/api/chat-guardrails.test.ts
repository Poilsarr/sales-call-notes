import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: { call: { findMany: vi.fn() } },
  auth: vi.fn(),
  createOpenAIClient: vi.fn(),
  KnowledgeGraphService: class {
    async searchByQuery() {
      return [];
    }
  },
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ default: mocks.prisma }));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/openai-client", () => ({ createOpenAIClient: mocks.createOpenAIClient }));
vi.mock("@/services/ai/knowledge-graph", () => ({ KnowledgeGraphService: mocks.KnowledgeGraphService }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));

import { POST } from "@/app/api/chat/route";

const okResponse = () =>
  new Response(
    JSON.stringify({
      result: "answer",
      citations: [],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );

describe("POST /api/chat guardrails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.rateLimit.mockResolvedValue({ success: true });
    mocks.createOpenAIClient.mockReturnValue({
      chat: { completions: { create: vi.fn().mockResolvedValue({ choices: [{ message: { content: "answer" } }] }) } },
    });
    mocks.prisma.call.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rate-limits to 20 requests/min per user (429 on the 21st)", async () => {
    mocks.rateLimit.mockResolvedValueOnce({ success: false });
    const res = await POST({ json: () => Promise.resolve({ query: "hello" }) } as any);
    expect(res.status).toBe(429);
    expect(mocks.rateLimit).toHaveBeenCalledWith({ key: "chat:clerk-1", limit: 20, windowSec: 60 });
  });

  it("rejects queries longer than 2000 characters", async () => {
    const res = await POST({ json: () => Promise.resolve({ query: "x".repeat(2001) }) } as any);
    expect(res.status).toBe(400);
  });

  it("rejects non-string queries", async () => {
    const res = await POST({ json: () => Promise.resolve({ query: 42 }) } as any);
    expect(res.status).toBe(400);
  });

  it("returns 401 without an authenticated user", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const res = await POST({ json: () => Promise.resolve({ query: "hello" }) } as any);
    expect(res.status).toBe(401);
  });
});
