import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockGetUserByClerkId,
  mockPrismaUpdate,
  mockLogAuditAction,
  mockCaptureApiError,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetUserByClerkId: vi.fn(),
  mockPrismaUpdate: vi.fn(),
  mockLogAuditAction: vi.fn(),
  mockCaptureApiError: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/get-user", () => ({
  getUserByClerkId: mockGetUserByClerkId,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      update: mockPrismaUpdate,
    },
  },
}));

vi.mock("@/lib/audit-logger", () => ({
  logAuditAction: mockLogAuditAction,
}));

vi.mock("@/lib/sentry", () => ({
  captureApiError: mockCaptureApiError,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

import { POST } from "@/app/api/billing/cancel/route";

describe("POST /api/billing/cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when user has no active subscription", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockGetUserByClerkId.mockResolvedValue({
      id: "user-1",
      clerkId: "test-user",
      paddleSubscriptionId: null,
    });

    const response = await POST();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "No active subscription" });
  });

  it("returns 200 on successful cancellation", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockGetUserByClerkId.mockResolvedValue({
      id: "user-1",
      clerkId: "test-user",
      paddleSubscriptionId: "sub-123",
    });
    mockPrismaUpdate.mockResolvedValue({});

    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockPrismaUpdate).toHaveBeenCalledWith({
      where: { clerkId: "test-user" },
      data: {
        plan: "FREE",
        subscriptionStatus: "cancelled",
        cancellationEffectiveDate: expect.any(Date),
        credits: 5,
      },
    });
    expect(mockLogAuditAction).toHaveBeenCalledWith(
      "user-1",
      "CANCEL_SUBSCRIPTION",
      "user-1",
      "User",
      expect.any(Object),
    );
  });

  it("returns 500 when database update fails", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockGetUserByClerkId.mockResolvedValue({
      id: "user-1",
      clerkId: "test-user",
      paddleSubscriptionId: "sub-123",
    });
    mockPrismaUpdate.mockRejectedValue(new Error("DB error"));

    const response = await POST();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Cancellation failed" });
    expect(mockCaptureApiError).toHaveBeenCalled();
  });
});
