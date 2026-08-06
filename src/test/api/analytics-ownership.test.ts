import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    call: { findUnique: vi.fn() },
    analytics: { upsert: vi.fn() },
  },
  auth: vi.fn(),
  getUserByClerkId: vi.fn(),
  AnalyticsService: class {
    async analyzeCall() {
      return { talkRatio: null, interruptions: 0, questionsAsked: 0, objections: [], budgetMentioned: false, timelineMentioned: false, decisionMakerPresent: false, competitorMentioned: false, sentiment: "neutral" };
    }
  },
}));

vi.mock("@/lib/prisma", () => ({ default: mocks.prisma }));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/get-user", () => ({ getUserByClerkId: mocks.getUserByClerkId }));
vi.mock("@/services/ai/analytics", () => ({ AnalyticsService: mocks.AnalyticsService }));

import { POST } from "@/app/api/analytics/route";

describe("POST /api/analytics ownership check", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects upserting analytics on a call the user cannot access", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.getUserByClerkId.mockResolvedValue({ id: "u1", teamId: "t1" });
    mocks.prisma.call.findUnique.mockResolvedValue({
      id: "c-x",
      userId: "u2",
      teamId: "t2",
      sharedWithTeam: false,
    });

    const res = await POST({ json: () => Promise.resolve({ transcript: "hello", callId: "c-x" }) } as any);
    expect(res.status).toBe(404);
    expect(mocks.prisma.analytics.upsert).not.toHaveBeenCalled();
  });

  it("allows upserting analytics on the user's own call", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.getUserByClerkId.mockResolvedValue({ id: "u1", teamId: null });
    mocks.prisma.call.findUnique.mockResolvedValue({
      id: "c-mine",
      userId: "u1",
      teamId: null,
      sharedWithTeam: false,
    });
    mocks.prisma.analytics.upsert.mockResolvedValue({});

    const res = await POST({ json: () => Promise.resolve({ transcript: "hello", callId: "c-mine" }) } as any);
    expect(res.status).toBe(200);
    expect(mocks.prisma.analytics.upsert).toHaveBeenCalled();
  });
});
