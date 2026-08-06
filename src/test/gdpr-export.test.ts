import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildUserExport, type ExportPayload } from "@/lib/gdpr-export";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    call: { findMany: vi.fn() },
    actionItem: { findMany: vi.fn() },
    decision: { findMany: vi.fn() },
    nextStep: { findMany: vi.fn() },
    callComment: { findMany: vi.fn() },
    auditLog: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

describe("buildUserExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates all user-owned data into a single payload", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u1",
      email: "u@test.com",
      name: "Test User",
      clerkId: "clerk_1",
      plan: "PRO",
      createdAt: new Date("2026-01-01"),
    });
    (prisma.call.findMany as any).mockResolvedValue([
      { id: "c1", filename: "call1.mp3", createdAt: new Date("2026-05-01") },
    ]);
    (prisma.actionItem.findMany as any).mockResolvedValue([
      { id: "a1", task: "Send proposal", callId: "c1" },
    ]);
    (prisma.decision.findMany as any).mockResolvedValue([]);
    (prisma.nextStep.findMany as any).mockResolvedValue([]);
    (prisma.callComment.findMany as any).mockResolvedValue([]);
    (prisma.auditLog.findMany as any).mockResolvedValue([]);

    const payload = await buildUserExport("u1");

    expect(payload.user.email).toBe("u@test.com");
    expect(payload.calls).toHaveLength(1);
    expect(payload.actionItems).toHaveLength(1);
    expect(payload.exportedAt).toBeTruthy();
  });

  it("throws when user not found", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    await expect(buildUserExport("missing")).rejects.toThrow("User not found");
  });

  it("scopes calls strictly to the user's own calls, even when in a team", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "u2",
      email: "u2@test.com",
      clerkId: "clerk_2",
      teamId: "t1",
      plan: "FREE",
      createdAt: new Date(),
    });
    (prisma.call.findMany as any).mockResolvedValue([]);
    (prisma.actionItem.findMany as any).mockResolvedValue([]);
    (prisma.decision.findMany as any).mockResolvedValue([]);
    (prisma.nextStep.findMany as any).mockResolvedValue([]);
    (prisma.callComment.findMany as any).mockResolvedValue([]);
    (prisma.auditLog.findMany as any).mockResolvedValue([]);

    await buildUserExport("u2");

    // GDPR export must NOT include teammates' calls — scope to userId only,
    // even when the requester belongs to a team.
    expect(prisma.call.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u2" },
      })
    );
  });
});

describe("ExportPayload shape", () => {
  it("has all required GDPR fields", () => {
    const payload: ExportPayload = {
      user: {} as any,
      calls: [],
      actionItems: [],
      decisions: [],
      nextSteps: [],
      comments: [],
      auditLogs: [],
      exportedAt: new Date().toISOString(),
      schemaVersion: "1.0",
    };
    expect(payload.schemaVersion).toBe("1.0");
    expect(payload.exportedAt).toBeTruthy();
  });
});
