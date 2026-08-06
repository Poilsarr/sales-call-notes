import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    call: { findUnique: vi.fn(), findFirst: vi.fn() },
    actionItem: { create: vi.fn() },
  },
  auth: vi.fn(),
  getUserByClerkId: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ default: mocks.prisma }));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/get-user", () => ({ getUserByClerkId: mocks.getUserByClerkId }));

import { POST } from "@/app/api/action-items/route";

describe("POST /api/action-items ownership check", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects adding an action item to another user's private call", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.getUserByClerkId.mockResolvedValue({ id: "u1", teamId: null });
    mocks.prisma.call.findUnique.mockResolvedValue({
      id: "c-x",
      userId: "u2",
      teamId: null,
      sharedWithTeam: false,
    });

    const res = await POST({
      json: () => Promise.resolve({ task: "follow up", owner: "", callId: "c-x" }),
    } as any);
    expect(res.status).toBe(404);
    expect(mocks.prisma.actionItem.create).not.toHaveBeenCalled();
  });

  it("allows adding an action item to the user's own call", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.getUserByClerkId.mockResolvedValue({ id: "u1", teamId: null });
    mocks.prisma.call.findUnique.mockResolvedValue({
      id: "c-mine",
      userId: "u1",
      teamId: null,
      sharedWithTeam: false,
    });
    mocks.prisma.actionItem.create.mockResolvedValue({ id: "a1" });

    const res = await POST({
      json: () => Promise.resolve({ task: "follow up", owner: "", callId: "c-mine" }),
    } as any);
    expect(res.status).toBe(201);
    expect(mocks.prisma.actionItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ callId: "c-mine" }) }),
    );
  });
});
