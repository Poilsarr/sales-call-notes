import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockGetUserByClerkId, mockRequireRole, mockRateLimit, mockFindUnique, mockUpdate, mockRefreshIntegrationToken } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetUserByClerkId: vi.fn(),
  mockRequireRole: vi.fn(),
  mockRateLimit: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockRefreshIntegrationToken: vi.fn(),
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

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mockRateLimit,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    integration: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
  },
}));

vi.mock("@/lib/integrations/token-refresh", () => ({
  refreshIntegrationToken: mockRefreshIntegrationToken,
}));

import { GET } from "@/app/api/integrations/[id]/test/route";

const TEST_ENCRYPTION_KEY = "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=";

function mockNextRequest(url: string): NextRequest {
  const req = new Request(url);
  const nextUrl = new URL(url);
  Object.defineProperty(req, "nextUrl", { value: nextUrl, writable: false });
  return req as unknown as NextRequest;
}

function integration(overrides: Record<string, any> = {}) {
  return {
    id: "int-1",
    teamId: "team-1",
    provider: "hubspot",
    enabled: true,
    config: JSON.stringify({ accessToken: "hs-token", refreshToken: "hs-refresh" }),
    syncedAt: null,
    ...overrides,
  };
}

describe("GET /api/integrations/[id]/test", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("ENCRYPTION_KEY", TEST_ENCRYPTION_KEY);
    mockAuth.mockReset();
    mockGetUserByClerkId.mockReset();
    mockRequireRole.mockReset();
    mockRateLimit.mockReset();
    mockFindUnique.mockReset();
    mockUpdate.mockReset();
    mockRefreshIntegrationToken.mockReset();
    mockAuth.mockResolvedValue({ userId: "user-1" });
    mockGetUserByClerkId.mockResolvedValue({ teamId: "team-1" });
    mockRequireRole.mockResolvedValue({ allowed: true, userRole: "ADMIN" });
    mockRateLimit.mockResolvedValue({ success: true });
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await GET(mockNextRequest("http://localhost/api/integrations/int-1/test"), {
      params: Promise.resolve({ id: "int-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin team member", async () => {
    mockRequireRole.mockResolvedValue({ allowed: false, userRole: "MEMBER" });
    const res = await GET(mockNextRequest("http://localhost/api/integrations/int-1/test"), {
      params: Promise.resolve({ id: "int-1" }),
    });
    expect(res.status).toBe(403);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockResolvedValue({ success: false });
    const res = await GET(mockNextRequest("http://localhost/api/integrations/int-1/test"), {
      params: Promise.resolve({ id: "int-1" }),
    });
    expect(res.status).toBe(429);
  });

  it("returns 404 when the integration is not found or not owned by the team", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await GET(mockNextRequest("http://localhost/api/integrations/int-1/test"), {
      params: Promise.resolve({ id: "int-1" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns not_supported for teams without calling any provider API", async () => {
    mockFindUnique.mockResolvedValue(integration({ provider: "teams" }));
    const res = await GET(mockNextRequest("http://localhost/api/integrations/int-1/test"), {
      params: Promise.resolve({ id: "int-1" }),
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("not_supported");
  });

  it("returns 400 for an unknown provider and never calls Slack", async () => {
    mockFindUnique.mockResolvedValue(integration({ provider: "not_a_provider" }));
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    } as Response);
    const res = await GET(mockNextRequest("http://localhost/api/integrations/int-1/test"), {
      params: Promise.resolve({ id: "int-1" }),
    });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("Unknown provider");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("reports healthy for google_calendar when tokeninfo returns 200", async () => {
    mockFindUnique.mockResolvedValue(integration({ provider: "google_calendar" }));
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    } as Response);
    const res = await GET(mockNextRequest("http://localhost/api/integrations/int-1/test"), {
      params: Promise.resolve({ id: "int-1" }),
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("https://oauth2.googleapis.com/tokeninfo"));
    expect(mockUpdate).toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("marks google_calendar needs_reconnect on tokeninfo 401 and refreshes", async () => {
    mockFindUnique.mockResolvedValue(integration({ provider: "google_calendar" }));
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "invalid_token" }),
    } as Response);
    mockRefreshIntegrationToken.mockResolvedValue("fresh-google-token");
    const res = await GET(mockNextRequest("http://localhost/api/integrations/int-1/test"), {
      params: Promise.resolve({ id: "int-1" }),
    });
    const body = await res.json();
    expect(mockRefreshIntegrationToken).toHaveBeenCalledWith("team-1", "google_calendar");
    expect(body.status).toBe("needs_reconnect");
    fetchSpy.mockRestore();
  });

  it("checks Slack for the slack provider only", async () => {
    mockFindUnique.mockResolvedValue(integration({ provider: "slack" }));
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    } as Response);
    const res = await GET(mockNextRequest("http://localhost/api/integrations/int-1/test"), {
      params: Promise.resolve({ id: "int-1" }),
    });
    const body = await res.json();
    expect(body.status).toBe("healthy");
    expect(fetchSpy).toHaveBeenCalledWith("https://slack.com/api/auth.test", expect.anything());
    fetchSpy.mockRestore();
  });

  it("reads tokens from an encrypted config", async () => {
    const { encryptConfig } = await import("@/lib/integrations/config-crypto");
    mockFindUnique.mockResolvedValue(
      integration({
        config: encryptConfig(JSON.stringify({ accessToken: "encrypted-token" })),
      }),
    );
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    } as Response);
    const res = await GET(mockNextRequest("http://localhost/api/integrations/int-1/test"), {
      params: Promise.resolve({ id: "int-1" }),
    });
    const body = await res.json();
    expect(body.status).toBe("healthy");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.hubapi.com/crm/v3/objects/contacts?limit=1",
      expect.objectContaining({ headers: { Authorization: "Bearer encrypted-token" } }),
    );
    fetchSpy.mockRestore();
  });
});
