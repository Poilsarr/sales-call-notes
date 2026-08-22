import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const {
  mockPrismaFindFirst,
  mockPrismaUpdate,
  mockPrismaUpdateMany,
  mockLogAuditAction,
  mockUnmarshal,
  mockGetSecret,
  mockPaddleEventCreate,
  mockAuditLogCreate,
  mockPrismaFindUnique,
} = vi.hoisted(() => ({
  mockPrismaFindFirst: vi.fn(),
  mockPrismaUpdate: vi.fn(),
  mockPrismaUpdateMany: vi.fn(),
  mockLogAuditAction: vi.fn(),
  mockUnmarshal: vi.fn(),
  mockGetSecret: vi.fn(),
  mockPaddleEventCreate: vi.fn().mockResolvedValue({}),
  mockAuditLogCreate: vi.fn().mockResolvedValue({}),
  mockPrismaFindUnique: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findFirst: mockPrismaFindFirst,
      update: mockPrismaUpdate,
      updateMany: mockPrismaUpdateMany,
      findUnique: mockPrismaFindUnique,
    },
    paddleEvent: {
      create: mockPaddleEventCreate,
    },
    auditLog: {
      create: mockAuditLogCreate,
    },
  },
}));

vi.mock("@/lib/paddle", () => ({
  getPaddleClient: () => ({
    webhooks: { unmarshal: mockUnmarshal },
  }),
}));

vi.mock("@/lib/secrets", () => ({
  getSecret: mockGetSecret,
}));

vi.mock("@/lib/audit-logger", () => ({
  logAuditAction: mockLogAuditAction,
}));

// The webhook route resolves PLANS via a dynamic `await import("@/lib/plans")`
// inside the handler, so mocking @/lib/plans makes plan mapping from price IDs
// deterministic (and keeps the module's module-load env reads out of the test).
vi.mock("@/lib/plans", () => ({
  PLANS: {
    free: { tier: "free", paddlePriceId: undefined, paddlePriceIdAnnual: undefined },
    pro: {
      tier: "pro",
      paddlePriceId: "pri_pro_test_monthly",
      paddlePriceIdAnnual: "pri_pro_test_annual",
    },
    business: {
      tier: "business",
      paddlePriceId: "pri_biz_test_monthly",
      paddlePriceIdAnnual: "pri_biz_test_annual",
    },
    enterprise: { tier: "enterprise", paddlePriceId: undefined, paddlePriceIdAnnual: undefined },
  },
}));

import { POST } from "@/app/api/paddle/webhook/route";

function webhookRequest(body: unknown, signature = "test-signature"): NextRequest {
  return new Request("http://localhost/api/paddle/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "paddle-signature": signature,
    },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function subscriptionEvent(status = "active") {
  return {
    eventType: "subscription.created",
    data: {
      id: "sub_123",
      status,
      customerId: "cus_123",
      items: [{ price: { id: "pri_pro_test_monthly" } }],
      customData: { clerkUserId: "clerk_1" },
    },
  };
}

describe("POST /api/paddle/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSecret.mockReturnValue("whsec_test");
    mockPrismaFindFirst.mockReset();
    mockPrismaUpdate.mockReset();
    mockPrismaUpdateMany.mockReset();
    mockLogAuditAction.mockResolvedValue(undefined);
    mockPaddleEventCreate.mockReset();
    mockPaddleEventCreate.mockResolvedValue({});
    mockAuditLogCreate.mockReset();
    mockAuditLogCreate.mockResolvedValue({});
    mockPrismaFindUnique.mockReset();
    mockPrismaFindUnique.mockResolvedValue(null);
  });

  it("returns 401 when the webhook signature is invalid", async () => {
    mockUnmarshal.mockRejectedValue(new Error("signature verification failed"));

    const res = await POST(webhookRequest({ eventType: "subscription.created", data: {} }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Invalid webhook signature" });
    expect(mockPrismaUpdate).not.toHaveBeenCalled();
    expect(mockPrismaUpdateMany).not.toHaveBeenCalled();
  });

  it("maps a PRO price ID to plan PRO, links the user via customData.clerkUserId, and updates the user row", async () => {
    mockUnmarshal.mockResolvedValue(subscriptionEvent("active"));
    // First findFirst: dedup check by paddleSubscriptionId -> no existing row.
    // Second findFirst: target user via OR [{paddleCustomerId}, {clerkId}] -> found.
    mockPrismaFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "user_1", clerkId: "clerk_1" });
    mockPrismaUpdate.mockResolvedValue({});

    const res = await POST(webhookRequest(subscriptionEvent("active")));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ received: true });
    expect(mockPrismaFindFirst).toHaveBeenNthCalledWith(1, {
      where: { paddleSubscriptionId: "sub_123" },
      select: { subscriptionStatus: true },
    });
    expect(mockPrismaFindFirst).toHaveBeenNthCalledWith(2, {
      where: { OR: [{ paddleCustomerId: "cus_123" }, { clerkId: "clerk_1" }] },
      select: { id: true, clerkId: true },
    });
    expect(mockPrismaUpdate).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: {
        paddleCustomerId: "cus_123",
        paddleSubscriptionId: "sub_123",
        subscriptionStatus: "active",
        subscriptionPlan: "PRO",
        plan: "PRO",
        credits: 999,
      },
    });
    expect(mockLogAuditAction).toHaveBeenCalledWith(
      "SYSTEM",
      "PADDLE_WEBHOOK_SYNC",
      "user_1",
      "User",
      expect.objectContaining({ eventType: "subscription.created", plan: "PRO", status: "active" }),
    );
  });

  it("maps a BUSINESS annual price ID to plan BUSINESS and grants active credits", async () => {
    mockUnmarshal.mockResolvedValue({
      eventType: "subscription.created",
      data: {
        id: "sub_456",
        status: "active",
        customerId: "cus_456",
        items: [{ price: { id: "pri_biz_test_annual" } }],
        customData: { clerkUserId: "clerk_2" },
      },
    });
    mockPrismaFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "user_2", clerkId: "clerk_2" });
    mockPrismaUpdate.mockResolvedValue({});

    const res = await POST(
      webhookRequest({
        eventType: "subscription.created",
        data: {
          id: "sub_456",
          status: "active",
          customerId: "cus_456",
          items: [{ price: { id: "pri_biz_test_annual" } }],
          customData: { clerkUserId: "clerk_2" },
        },
      })
    );

    expect(res.status).toBe(200);
    expect(mockPrismaUpdate).toHaveBeenCalledWith({
      where: { id: "user_2" },
      data: {
        paddleCustomerId: "cus_456",
        paddleSubscriptionId: "sub_456",
        subscriptionStatus: "active",
        subscriptionPlan: "BUSINESS",
        plan: "BUSINESS",
        credits: 999,
      },
    });
  });

  it("dedupes: a repeated webhook with the same subscription status does not update the user again", async () => {
    mockUnmarshal.mockResolvedValue(subscriptionEvent("active"));
    // Dedup check always finds an existing row with the same status.
    mockPrismaFindFirst.mockResolvedValue({ subscriptionStatus: "active" });

    const first = await POST(webhookRequest(subscriptionEvent("active")));
    const second = await POST(webhookRequest(subscriptionEvent("active")));

    expect(first.status).toBe(200);
    await expect(first.json()).resolves.toEqual({ received: true, deduped: true });
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toEqual({ received: true, deduped: true });
    expect(mockPrismaUpdate).not.toHaveBeenCalled();
  });

  it("maps subscription.canceled to plan FREE with 5 credits", async () => {
    mockUnmarshal.mockResolvedValue({
      eventType: "subscription.canceled",
      data: { id: "sub_123" },
    });

    const res = await POST(
      webhookRequest({ eventType: "subscription.canceled", data: { id: "sub_123" } })
    );

    expect(res.status).toBe(200);
    expect(mockPrismaUpdateMany).toHaveBeenCalledWith({
      where: { paddleSubscriptionId: "sub_123" },
      data: {
        subscriptionStatus: "canceled",
        plan: "FREE",
        credits: 5,
      },
    });
    expect(mockLogAuditAction).toHaveBeenCalledWith(
      "SYSTEM",
      "PADDLE_WEBHOOK_CANCEL",
      "sub_123",
      "User",
      expect.objectContaining({ eventType: "subscription.canceled" }),
    );
  });

  it("grants 999 credits for transaction.completed without a subscriptionId", async () => {
    mockUnmarshal.mockResolvedValue({
      eventType: "transaction.completed",
      data: { customerId: "cus_123", subscriptionId: null },
    });

    const res = await POST(
      webhookRequest({
        eventType: "transaction.completed",
        data: { customerId: "cus_123", subscriptionId: null },
      })
    );

    expect(res.status).toBe(200);
    expect(mockPrismaUpdateMany).toHaveBeenCalledWith({
      where: { paddleCustomerId: "cus_123" },
      data: { credits: 999 },
    });
  });

  it("does not touch credits for transaction.completed with a subscriptionId", async () => {
    mockUnmarshal.mockResolvedValue({
      eventType: "transaction.completed",
      data: { customerId: "cus_123", subscriptionId: "sub_123" },
    });

    const res = await POST(
      webhookRequest({
        eventType: "transaction.completed",
        data: { customerId: "cus_123", subscriptionId: "sub_123" },
      })
    );

    expect(res.status).toBe(200);
    expect(mockPrismaUpdateMany).not.toHaveBeenCalled();
  });

  it("dead-letters with 200 (not 404) when no user matches the subscription's customData — Paddle will not retry", async () => {
    mockUnmarshal.mockResolvedValue(subscriptionEvent("active"));
    mockPrismaFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const res = await POST(webhookRequest(subscriptionEvent("active")));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ received: true, orphan: true });
    expect(mockPrismaUpdate).not.toHaveBeenCalled();
    expect(mockAuditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "PADDLE_WEBHOOK_ORPHAN" }),
      })
    );
  });
});
