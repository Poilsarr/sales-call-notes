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
  getUserByClerkId: vi.fn(),
  getByokKeys: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ default: mocks.prisma }));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/openai-client", () => ({ createOpenAIClient: mocks.createOpenAIClient }));
vi.mock("@/services/ai/knowledge-graph", () => ({ KnowledgeGraphService: mocks.KnowledgeGraphService }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));
vi.mock("@/lib/get-user", () => ({ getUserByClerkId: mocks.getUserByClerkId }));
vi.mock("@/lib/byok-resolver", () => ({ getByokKeys: mocks.getByokKeys }));

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
    mocks.getUserByClerkId.mockResolvedValue({ id: "user-db-id", plan: "pro" });
    mocks.getByokKeys.mockResolvedValue({ openaiKey: "sk-byok-test", groqKey: undefined, dropped: [] });
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

  it("returns 401 when the Clerk user has no matching DB record", async () => {
    mocks.getUserByClerkId.mockResolvedValueOnce(null);
    const res = await POST({ json: () => Promise.resolve({ query: "hello" }) } as any);
    expect(res.status).toBe(401);
    expect(mocks.getUserByClerkId).toHaveBeenCalledWith("clerk-1");
  });

  it("returns 403 with PLAN_REQUIRED for free-plan users", async () => {
    mocks.getUserByClerkId.mockResolvedValueOnce({ id: "user-db-id", plan: "free" });
    const res = await POST({ json: () => Promise.resolve({ query: "hello" }) } as any);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("PLAN_REQUIRED");
  });

  it("returns 200 for pro-plan users", async () => {
    const res = await POST({ json: () => Promise.resolve({ query: "hello" }) } as any);
    expect(res.status).toBe(200);
  });
});
