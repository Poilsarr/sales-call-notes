import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: { call: { findUnique: vi.fn() } },
  auth: vi.fn(),
  getUserByClerkId: vi.fn(),
  SlackService: class {
    constructor(public teamId: string) {}
    async sendCallSummary() {
      return true;
    }
  },
}));

vi.mock("@/lib/prisma", () => ({ default: mocks.prisma }));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/get-user", () => ({ getUserByClerkId: mocks.getUserByClerkId }));
vi.mock("@/services/slack", () => ({ SlackService: mocks.SlackService }));

import { POST } from "@/app/api/slack/route";

describe("POST /api/slack send-summary IDOR guard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("forbids sending another team's non-shared call to Slack", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.getUserByClerkId.mockResolvedValue({ id: "u1", teamId: "t1", teamRole: "MEMBER" });
    mocks.prisma.call.findUnique.mockResolvedValue({
      id: "other-call",
      userId: "someone-else",
      teamId: "t2",
      sharedWithTeam: false,
      actionItems: [],
      decisions: [],
      assignee: null,
      filename: "x.mp3",
      summary: null,
      healthScore: null,
    });

    const res = await POST({ json: () => Promise.resolve({ callId: "other-call" }) } as any);
    expect(res.status).toBe(403);
  });

  it("allows the owner to send their own call", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.getUserByClerkId.mockResolvedValue({ id: "u1", teamId: null, teamRole: "MEMBER" });
    mocks.prisma.call.findUnique.mockResolvedValue({
      id: "my-call",
      userId: "u1",
      teamId: null,
      sharedWithTeam: false,
      actionItems: [],
      decisions: [],
      assignee: null,
      filename: "x.mp3",
      summary: null,
      healthScore: null,
    });

    const res = await POST({ json: () => Promise.resolve({ callId: "my-call" }) } as any);
    expect(res.status).toBe(200);
  });
});
