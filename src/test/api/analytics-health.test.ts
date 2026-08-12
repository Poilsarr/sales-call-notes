import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUser: vi.fn(),
  findInsights: vi.fn(),
  findTeam: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({
  default: {
    user: { findUnique: mocks.findUser },
    callInsight: { findMany: mocks.findInsights },
    team: { findUnique: mocks.findTeam },
  },
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));

import { GET } from "@/app/api/analytics/health/route";

function insight(overrides?: {
  createdAt?: Date;
  sentimentScore?: number | null;
  objections?: Array<{ type: string }> | null;
  closeProbability?: number | null;
}) {
  return {
    createdAt: overrides?.createdAt ?? new Date("2026-07-06T12:00:00Z"),
    sentimentScore: overrides?.sentimentScore ?? 0.8,
    objections: overrides?.objections ?? null,
    closeProbability: overrides?.closeProbability ?? 0.6,
  };
}

describe("GET /api/analytics/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ success: true });
  });

  it("returns 401 when unauthenticated", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const res = await GET(new Request("http://x/api/analytics/health"));
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.rateLimit.mockResolvedValue({ success: false });
    const res = await GET(new Request("http://x/api/analytics/health"));
    expect(res.status).toBe(429);
    expect(mocks.rateLimit).toHaveBeenCalledWith({ key: "health:clerk-1", limit: 20, windowSec: 60 });
  });

  it("returns 400 for an invalid range param", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    const res = await GET(new Request("http://x/api/analytics/health?range=0"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when the user row cannot be resolved", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.findUser.mockResolvedValue(null);
    const res = await GET(new Request("http://x/api/analytics/health"));
    expect(res.status).toBe(401);
  });

  it("aggregates team-shared call insights when the user has a team", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.findUser.mockResolvedValue({ id: "u1", teamId: "t1" });
    mocks.findInsights.mockResolvedValue([
      insight({ createdAt: new Date("2026-07-06T12:00:00Z"), sentimentScore: 0.8, objections: [{ type: "price" }] }),
      insight({ createdAt: new Date("2026-07-13T12:00:00Z"), sentimentScore: 0.6, objections: [{ type: "price" }, { type: "timeline" }] }),
    ]);
    mocks.findTeam.mockResolvedValue({ id: "t1", name: "Acme SDRs" });

    const res = await GET(new Request("http://x/api/analytics/health"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.scope).toBe("team");
    expect(json.team).toEqual({ id: "t1", name: "Acme SDRs" });
    expect(json.totalCalls).toBe(2);
    expect(json.avgScore).toBe(0.7);
    expect(json.callsPerWeek).toBe(1);
    expect(json.topObjections[0]).toEqual({ type: "price", count: 2 });
    expect(json.buckets).toHaveLength(2);

    const callWhere = mocks.findInsights.mock.calls[0][0].where;
    expect(callWhere.call.teamId).toBe("t1");
    expect(callWhere.call.sharedWithTeam).toBe(true);
  });

  it("falls back to personal call insights when the user has no team", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.findUser.mockResolvedValue({ id: "u1", teamId: null });
    mocks.findInsights.mockResolvedValue([]);

    const res = await GET(new Request("http://x/api/analytics/health"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.scope).toBe("personal");
    expect(json.team).toBeNull();
    expect(json.totalCalls).toBe(0);
    expect(json.callsPerWeek).toBe(0);
    expect(mocks.findTeam).not.toHaveBeenCalled();

    const callWhere = mocks.findInsights.mock.calls[0][0].where;
    expect(callWhere.call.userId).toBe("u1");
  });

  it("returns 500 when the insight query fails", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.findUser.mockResolvedValue({ id: "u1", teamId: null });
    mocks.findInsights.mockRejectedValue(new Error("db down"));
    const res = await GET(new Request("http://x/api/analytics/health"));
    expect(res.status).toBe(500);
  });
});