import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { render, screen } from "@testing-library/react";

/**
 * Pins BUNDLE-PLAN B-C: /dashboard must not pull the client PLANS chunk
 * (`6635`), /settings + /billing mount the lazy Toaster via toaster-host,
 * and the /settings delete copy must describe the real inline immediate
 * purge (api/user/delete/route.ts:17-27,111) instead of the dead
 * "7-day grace / sign in to cancel" queued semantics.
 */

const DASHBOARD = path.join(process.cwd(), "src/app/dashboard/page.tsx");
const SETTINGS = path.join(process.cwd(), "src/app/settings/page.tsx");
const BILLING = path.join(process.cwd(), "src/app/billing/page.tsx");

function read(file: string): string {
  return fs.readFileSync(file, "utf-8");
}

const mocks = vi.hoisted(() => ({
  prisma: {
    call: { count: vi.fn(), aggregate: vi.fn() },
    user: { count: vi.fn() },
  },
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

import { GET } from "@/app/api/billing/route";

describe("GET /api/billing returns an additive planName field", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.prisma.call.count.mockResolvedValue(3);
    mocks.prisma.call.aggregate.mockResolvedValue({ _sum: { duration: 1800 } });
  });

  function mockUser(overrides: Record<string, unknown> = {}) {
    mocks.getUserByClerkId.mockResolvedValue({
      id: "u1",
      plan: "PRO",
      teamId: null,
      subscriptionStatus: "active",
      subscriptionPlan: "PRO",
      paddleSubscriptionId: null,
      paddleCustomerId: null,
      trialEndsAt: null,
      cancellationEffectiveDate: null,
      ...overrides,
    });
  }

  it("derives planName from the plan tier (PRO -> Pro, BUSINESS -> Business)", async () => {
    mockUser({ plan: "PRO" });
    const res = await GET({} as any);
    const body = await res.json();
    expect(body.plan).toBe("pro");
    expect(body.planName).toBe("Pro");

    mockUser({ plan: "BUSINESS" });
    const res2 = await GET({} as any);
    const body2 = await res2.json();
    expect(body2.plan).toBe("business");
    expect(body2.planName).toBe("Business");
  });

  it("keeps every pre-existing response field (additive field only)", async () => {
    mockUser({ plan: "FREE", teamId: "team-1" });
    mocks.prisma.user.count.mockResolvedValue(4);

    const res = await GET({} as any);
    const body = await res.json();

    expect(body).toEqual({
      plan: "free",
      planName: "Free",
      usage: 3,
      minuteUsage: 30,
      limit: 5,
      minuteLimit: 300,
      teamMemberCount: 4,
      teamMemberLimit: 1,
      features: expect.any(Object),
      subscriptionStatus: "active",
      subscriptionPlan: "PRO",
      paddleSubscriptionId: null,
      paddleCustomerId: null,
      trialEndsAt: null,
      cancellationEffectiveDate: null,
    });
    expect(mocks.prisma.user.count).toHaveBeenCalledWith({ where: { teamId: "team-1" } });
  });

  it("401s without a session", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const res = await GET({} as any);
    expect(res.status).toBe(401);
  });
});

describe("dashboard drops the client PLANS value import (chunk 6635)", () => {
  const src = read(DASHBOARD);

  it("no longer imports getPlan or the PLANS value from @/lib/plans", () => {
    expect(src, "getPlan must not appear anywhere on the dashboard").not.toContain("getPlan");
    expect(src, "the only @/lib/plans import must be type-only").toContain(
      'import type { PlanTier } from "@/lib/plans";'
    );
  });

  it("reads the plan name from the billing API payload", () => {
    expect(src, "dashboard must render billing.planName").toContain("billing.planName");
    expect(src, "BillingInfo must carry the planName field").toContain("planName: string;");
  });
});

describe("toaster-host renders sonner's Toaster", () => {
  it("mounts a sonner toaster (notifications region) with the app theme", async () => {
    const { default: ToasterHost } = await import("@/components/toaster-host");
    render(<ToasterHost />);
    const region = screen.getByLabelText(/notifications/i);
    expect(region).toBeInTheDocument();
    expect(region.getAttribute("aria-live")).toBe("polite");
  });
});

describe("billing + settings mount the lazy Toaster host", () => {
  it("billing page imports and mounts ToasterHost", () => {
    const src = read(BILLING);
    expect(src).toContain('dynamic(() => import("@/components/toaster-host"), { ssr: false })');
    expect(src).toContain("<ToasterHost />");
  });

  it("settings page swapped its static Toaster for ToasterHost", () => {
    const src = read(SETTINGS);
    expect(src, "static sonner Toaster import must be gone").not.toContain('import { Toaster } from "sonner";');
    expect(src).toContain("<ToasterHost />");
  });
});

describe("settings delete copy is honest about the inline immediate purge", () => {
  const src = read(SETTINGS);

  it("contains no 7-day-grace or sign-in-to-cancel delete language", () => {
    expect(src).not.toContain("7-day grace");
    expect(src).not.toMatch(/sign in within 7 days/i);
    expect(src).not.toMatch(/scheduled for deletion/i);
    expect(src).not.toContain("Scheduling...");
  });

  it("states the account data is being permanently deleted", () => {
    expect(src).toMatch(/permanently deleted right now/i);
    expect(src).toMatch(/account data is being permanently deleted/i);
  });

  it("preserves the accurate export-download expiry copy (7-day export token, worker.ts ttl)", () => {
    expect(src).toContain("Link is valid for 7 days");
    expect(src).toContain("valid 7 days");
  });
});