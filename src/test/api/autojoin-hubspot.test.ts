import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockGetUserByClerkId,
  mockRequireRole,
  mockFindFirst,
  mockUpdate,
  mockCreate,
  mockRefreshToken,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetUserByClerkId: vi.fn(),
  mockRequireRole: vi.fn(),
  mockFindFirst: vi.fn(),
  mockUpdate: vi.fn(),
  mockCreate: vi.fn(),
  mockRefreshToken: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/get-user", () => ({
  getUserByClerkId: mockGetUserByClerkId,
}));

vi.mock("@/lib/rbac", () => ({
  requireRole: mockRequireRole,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    integration: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

vi.mock("@/lib/integrations/token-refresh", () => ({
  refreshIntegrationToken: (...args: unknown[]) => mockRefreshToken(...args),
}));

import { GET, POST } from "@/app/api/calendar/auto-join/route";
import { HubSpotService, buildCallDeepLink } from "@/services/crm/hubspot";
import type { CRMCall } from "@/types/crm";

const ADMIN_USER = {
  id: "user-1",
  clerkId: "admin_123",
  email: "admin@example.com",
  name: "Admin",
  teamId: "team-1",
};

function mockAdmin() {
  mockAuth.mockResolvedValue({ userId: ADMIN_USER.clerkId });
  mockGetUserByClerkId.mockResolvedValue(ADMIN_USER);
  mockRequireRole.mockResolvedValue({ allowed: true, userRole: "ADMIN" });
}

function postReq(payload: unknown): NextRequest {
  return new NextRequest("http://localhost/api/calendar/auto-join", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function baseCall(id = "call_123"): CRMCall & { id: string } {
  return {
    id,
    filename: "acme-discovery.mp3",
    createdAt: new Date("2026-09-01T10:00:00.000Z"),
    transcript: "hello@acme.com called about pricing",
    summary: "Discovery call went well.",
    analytics: null,
    actionItems: [],
    decisions: [],
    nextSteps: [],
  };
}

describe("buildCallDeepLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ENCRYPTION_KEY", "");
  });

  it("formats the deep-link from NEXT_PUBLIC_APP_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example.com");
    expect(buildCallDeepLink("call_123")).toBe("https://app.example.com/app/calls/call_123");
  });

  it("strips a trailing slash and falls back to localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example.com/");
    expect(buildCallDeepLink("abc")).toBe("https://app.example.com/app/calls/abc");

    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(buildCallDeepLink("abc")).toBe("http://localhost:3000/app/calls/abc");
  });
});

describe("HubSpot syncCall note deep-link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ENCRYPTION_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example.com");
  });

  it("appends the View in Gauge link without replacing existing note fields", async () => {
    mockRefreshToken.mockResolvedValue("test-token");
    const bodies: Array<Record<string, { hs_note_body?: string }>> = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).endsWith("/crm/v3/objects/contacts")) {
        return { ok: true, json: async () => ({ id: "contact-1" }) } as Response;
      }
      if (String(url).endsWith("/crm/v3/objects/deals")) {
        return { ok: true, json: async () => ({ id: "deal-1" }) } as Response;
      }
      bodies.push(JSON.parse((init?.body as string) ?? "{}"));
      return { ok: true, json: async () => ({ id: "note-1" }) } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const svc = new HubSpotService("team-1");
    await svc.syncCall(baseCall("call_123"));

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const noteBody = bodies[0]?.properties?.hs_note_body ?? "";
    expect(noteBody).toContain("CALL LOG");
    expect(noteBody).toContain("Discovery call went well.");
    expect(noteBody).toContain(
      "View in Gauge: https://app.example.com/app/calls/call_123",
    );

    vi.unstubAllGlobals();
  });

  it("omits the link when the call has no id (backwards compatible)", async () => {
    mockRefreshToken.mockResolvedValue("test-token");
    let captured = "";
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).endsWith("/crm/v3/objects/contacts")) {
        return { ok: true, json: async () => ({ id: "contact-1" }) } as Response;
      }
      if (String(url).endsWith("/crm/v3/objects/deals")) {
        return { ok: true, json: async () => ({ id: "deal-1" }) } as Response;
      }
      captured =
        (JSON.parse((init?.body as string) ?? "{}") as Record<string, { hs_note_body?: string }>)
          ?.properties?.hs_note_body ?? "";
      return { ok: true, json: async () => ({ id: "note-1" }) } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const svc = new HubSpotService("team-1");
    const { id: _omit, ...noId } = baseCall("call_123");
    await svc.syncCall(noId as CRMCall);

    expect(captured).toContain("CALL LOG");
    expect(captured).not.toContain("View in Gauge:");

    vi.unstubAllGlobals();
  });
});

describe("GET /api/calendar/auto-join", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ENCRYPTION_KEY", "");
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 400 NO_TEAM for a teamless user", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockGetUserByClerkId.mockResolvedValue({ ...ADMIN_USER, teamId: null });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("NO_TEAM");
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-admin", async () => {
    mockAdmin();
    mockRequireRole.mockResolvedValue({ allowed: false, userRole: "MEMBER" });

    const res = await GET();

    expect(res.status).toBe(403);
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it("defaults to false when no Integration row exists", async () => {
    mockAdmin();
    mockFindFirst.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ autoJoin: false });
  });

  it("returns 200-false for an undecryptable config (no 500)", async () => {
    mockAdmin();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "google_calendar",
      config: "v1:tampered-payload",
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ autoJoin: false });
  });

  it("returns the stored flag when present", async () => {
    mockAdmin();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "google_calendar",
      config: JSON.stringify({ accessToken: "tok", autoJoin: true }),
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ autoJoin: true });
  });
});

describe("POST /api/calendar/auto-join", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ENCRYPTION_KEY", "");
  });

  it("returns 403 for a non-admin without persisting", async () => {
    mockAdmin();
    mockRequireRole.mockResolvedValue({ allowed: false, userRole: "MEMBER" });

    const res = await POST(postReq({ autoJoin: true }));

    expect(res.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 NO_TEAM for a teamless user", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockGetUserByClerkId.mockResolvedValue({ ...ADMIN_USER, teamId: null });

    const res = await POST(postReq({ autoJoin: true }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("NO_TEAM");
  });

  it("rejects a non-boolean autoJoin with 400", async () => {
    mockAdmin();

    const res = await POST(postReq({ autoJoin: "yes" }));

    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("updates the existing row, preserving other config keys", async () => {
    mockAdmin();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "google_calendar",
      config: JSON.stringify({ accessToken: "tok", refreshToken: "ref" }),
    });
    mockUpdate.mockResolvedValue({ id: "int-1" });

    const res = await POST(postReq({ autoJoin: true }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ autoJoin: true });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "int-1" },
      data: { config: expect.any(String) },
    });
    const stored = JSON.parse(
      (mockUpdate.mock.calls[0][0] as { data: { config: string } }).data.config,
    ) as Record<string, unknown>;
    expect(stored).toMatchObject({ accessToken: "tok", refreshToken: "ref", autoJoin: true });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates a row when none exists", async () => {
    mockAdmin();
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "int-new" });

    const res = await POST(postReq({ autoJoin: false }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ autoJoin: false });
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ teamId: "team-1", provider: "google_calendar" }),
    });
    const stored = JSON.parse(
      (mockCreate.mock.calls[0][0] as { data: { config: string } }).data.config,
    ) as Record<string, unknown>;
    expect(stored).toMatchObject({ autoJoin: false });
  });
});
