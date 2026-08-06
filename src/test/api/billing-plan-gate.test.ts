import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: { user: { update: vi.fn() } },
  auth: vi.fn(),
  getUserByClerkId: vi.fn(),
  logAuditAction: vi.fn(),
  captureApiError: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/get-user", () => ({ getUserByClerkId: mocks.getUserByClerkId }));
vi.mock("@/lib/prisma", () => ({ default: mocks.prisma }));
vi.mock("@/lib/audit-logger", () => ({ logAuditAction: mocks.logAuditAction }));
vi.mock("@/lib/sentry", () => ({ captureApiError: mocks.captureApiError }));

import { POST } from "@/app/api/billing/route";

describe("POST /api/billing paid-plan self-grant guard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects paid plan when the user has no active matching subscription", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.getUserByClerkId.mockResolvedValue({ id: "u1", plan: "FREE", subscriptionStatus: null, subscriptionPlan: null });

    const res = await POST({ json: () => Promise.resolve({ plan: "business" }) } as any);
    expect(res.status).toBe(403);
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects paid plan when subscriptionStatus is not active", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.getUserByClerkId.mockResolvedValue({ id: "u1", plan: "PRO", subscriptionStatus: "canceled", subscriptionPlan: "PRO" });

    const res = await POST({ json: () => Promise.resolve({ plan: "pro" }) } as any);
    expect(res.status).toBe(403);
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
  });

  it("allows plan change only when the Paddle subscription matches the target plan", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.getUserByClerkId.mockResolvedValue({
      id: "u1",
      plan: "PRO",
      subscriptionStatus: "active",
      subscriptionPlan: "PRO",
    });
    mocks.prisma.user.update.mockResolvedValue({});

    const res = await POST({ json: () => Promise.resolve({ plan: "pro" }) } as any);
    expect(res.status).toBe(200);
    expect(mocks.prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ plan: "PRO", subscriptionStatus: "active", subscriptionPlan: "PRO" }),
      }),
    );
  });

  it("never auto-creates a user with a paid plan", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-new" });
    mocks.getUserByClerkId.mockResolvedValue(null);

    const res = await POST({ json: () => Promise.resolve({ plan: "business" }) } as any);
    expect(res.status).toBe(403);
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
  });

  it("still allows explicit downgrade to free", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.getUserByClerkId.mockResolvedValue({ id: "u1", plan: "PRO", subscriptionStatus: "active", subscriptionPlan: "PRO" });
    mocks.prisma.user.update.mockResolvedValue({});

    const res = await POST({ json: () => Promise.resolve({ plan: "free" }) } as any);
    expect(res.status).toBe(200);
  });
});
