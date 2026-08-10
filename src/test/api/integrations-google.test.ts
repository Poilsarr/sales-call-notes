import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockGetUserByClerkId, mockRequireRole, mockFindFirst, mockCreate, mockUpdate, mockGetSecret, mockDevSandboxEnabled, mockDevSandboxCredentials, mockLogAuditAction, mockPrismaTeamCreate, mockPrismaUserUpdate, mockPrismaUserFindUnique, mockCookieStore } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetUserByClerkId: vi.fn(),
  mockRequireRole: vi.fn(),
  mockFindFirst: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockGetSecret: vi.fn(),
  mockDevSandboxEnabled: vi.fn(),
  mockDevSandboxCredentials: vi.fn(),
  mockLogAuditAction: vi.fn(),
  mockPrismaTeamCreate: vi.fn(),
  mockPrismaUserUpdate: vi.fn(),
  mockPrismaUserFindUnique: vi.fn(),
  mockCookieStore: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
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
      findFirst: (...args: any[]) => mockFindFirst(...args),
      create: (...args: any[]) => mockCreate(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
    team: {
      create: (...args: any[]) => mockPrismaTeamCreate(...args),
    },
    user: {
      update: (...args: any[]) => mockPrismaUserUpdate(...args),
      findUnique: (...args: any[]) => mockPrismaUserFindUnique(...args),
    },
  },
}));

vi.mock("@/lib/secrets", () => ({
  getSecret: mockGetSecret,
}));

vi.mock("@/lib/integrations/dev-sandbox", () => ({
  isDevSandboxEnabled: mockDevSandboxEnabled,
  getDevSandboxCredentials: mockDevSandboxCredentials,
}));

vi.mock("@/lib/audit-logger", () => ({
  logAuditAction: mockLogAuditAction,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookieStore),
}));

import { GET as ConnectGET } from "@/app/api/integrations/google/connect/route";
import { GET as CallbackGET } from "@/app/api/integrations/google/callback/route";
import { decryptConfig } from "@/lib/integrations/config-crypto";

// 32-byte test key (base64) — mirrors src/lib/integrations/config-crypto.test.ts
const TEST_ENCRYPTION_KEY = "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=";

function mockNextRequest(url: string): NextRequest {
  const req = new Request(url);
  const nextUrl = new URL(url);
  Object.defineProperty(req, "nextUrl", {
    value: nextUrl,
    writable: false,
  });
  return req as unknown as NextRequest;
}

describe("Google Calendar Connect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await ConnectGET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 403 for a team member", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockGetUserByClerkId.mockResolvedValue({
      id: "user-1",
      clerkId: "test-user",
      email: "test@example.com",
      name: "Test User",
      teamId: "team-1",
    });
    mockRequireRole.mockResolvedValue({ allowed: false, userRole: "MEMBER" });

    const response = await ConnectGET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(mockRequireRole).toHaveBeenCalledWith("test-user", "team-1", "ADMIN");
  });

  it("returns 400 when GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockGetUserByClerkId.mockResolvedValue({
      id: "user-1",
      clerkId: "test-user",
      email: "test@example.com",
      name: "Test User",
      teamId: "team-1",
    });
    mockRequireRole.mockResolvedValue({ allowed: true, userRole: "ADMIN" });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      return "";
    });

    const response = await ConnectGET();
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Google OAuth is not configured" });
  });

  it("returns 400 when GOOGLE_CLIENT_SECRET is missing even with an ID present", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockGetUserByClerkId.mockResolvedValue({
      id: "user-1",
      clerkId: "test-user",
      email: "test@example.com",
      name: "Test User",
      teamId: "team-1",
    });
    mockRequireRole.mockResolvedValue({ allowed: true, userRole: "ADMIN" });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "GOOGLE_CLIENT_ID") return "test-google-client-id";
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      return "";
    });

    const response = await ConnectGET();
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Google OAuth is not configured" });
  });

  it("redirects to Google OAuth URL when configured", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockGetUserByClerkId.mockResolvedValue({
      id: "user-1",
      clerkId: "test-user",
      email: "test@example.com",
      name: "Test User",
      teamId: "team-1",
    });
    mockRequireRole.mockResolvedValue({ allowed: true, userRole: "ADMIN" });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "GOOGLE_CLIENT_ID") return "test-google-client-id";
      if (key === "GOOGLE_CLIENT_SECRET") return "test-google-client-secret";
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      return "";
    });

    const response = await ConnectGET();

    expect(response.status).toBe(307);
    const location = response.headers.get("location") || "";
    expect(location).toContain("accounts.google.com/o/oauth2/v2/auth");
    expect(location).toContain("client_id=test-google-client-id");
    expect(location).toContain("access_type=offline");
    expect(location).toContain("prompt=consent");
    expect(location).toContain("scope=" + encodeURIComponent("https://www.googleapis.com/auth/calendar"));
  });
});

describe("Google Calendar Callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to sign-in when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const req = mockNextRequest("http://localhost/api/integrations/google/callback?code=test&state=test-state");
    const response = await CallbackGET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/sign-in");
  });

  it("redirects with error when Google returns error", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      return "";
    });

    const req = mockNextRequest("http://localhost/api/integrations/google/callback?error=access_denied");
    const response = await CallbackGET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("error=google_access_denied");
  });

  it("redirects with error when code or state missing", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      return "";
    });

    const req = mockNextRequest("http://localhost/api/integrations/google/callback");
    const response = await CallbackGET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("error=missing_params");
  });

  it("redirects with error when state cookie is missing", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      return "";
    });

    const req = mockNextRequest("http://localhost/api/integrations/google/callback?code=test-code&state=invalid-state");
    const response = await CallbackGET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("error=invalid_nonce");
  });

  it("stores integration and redirects on success with sandbox", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockCookieStore.get.mockImplementation((key: string) => {
      if (key === "oauth_google_calendar") return { value: "test-state" };
      return undefined;
    });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      if (key === "GOOGLE_CLIENT_ID") return "dev-google-client-id";
      if (key === "GOOGLE_CLIENT_SECRET") return "dev-google-client-secret";
      return "";
    });
    mockGetUserByClerkId.mockResolvedValue({
      id: "user-1",
      clerkId: "test-user",
      email: "test@example.com",
      name: "Test User",
      teamId: "team-1",
    });
    mockRequireRole.mockResolvedValue({ allowed: true, userRole: "ADMIN" });
    mockDevSandboxEnabled.mockReturnValue(true);
    mockDevSandboxCredentials.mockReturnValue({
      clientId: "dev-google-client-id",
      clientSecret: "dev-google-client-secret",
      redirectUri: "http://localhost:3000/api/integrations/google/callback",
      scope: ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"],
      notesUrl: "https://console.cloud.google.com/",
    });
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "google_calendar",
      syncedAt: new Date("2025-01-15T00:00:00.000Z"),
    });

    const req = mockNextRequest("http://localhost/api/integrations/google/callback?code=test-code&state=test-state");
    const response = await CallbackGET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("google=connected");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          teamId: "team-1",
          provider: "google_calendar",
          config: expect.stringContaining("dev-google-access-token"),
        }),
      }),
    );
  });

  it("encrypts the stored config at rest when ENCRYPTION_KEY is set", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockCookieStore.get.mockImplementation((key: string) => {
      if (key === "oauth_google_calendar") return { value: "test-state" };
      return undefined;
    });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      if (key === "GOOGLE_CLIENT_ID") return "dev-google-client-id";
      if (key === "GOOGLE_CLIENT_SECRET") return "dev-google-client-secret";
      if (key === "ENCRYPTION_KEY") return TEST_ENCRYPTION_KEY;
      return "";
    });
    mockGetUserByClerkId.mockResolvedValue({
      id: "user-1",
      clerkId: "test-user",
      email: "test@example.com",
      name: "Test User",
      teamId: "team-1",
    });
    mockRequireRole.mockResolvedValue({ allowed: true, userRole: "ADMIN" });
    mockDevSandboxEnabled.mockReturnValue(true);
    mockDevSandboxCredentials.mockReturnValue({
      clientId: "dev-google-client-id",
      clientSecret: "dev-google-client-secret",
      redirectUri: "http://localhost:3000/api/integrations/google/callback",
      scope: ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"],
      notesUrl: "https://console.cloud.google.com/",
    });
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "google_calendar",
      syncedAt: new Date("2025-01-15T00:00:00.000Z"),
    });

    const req = mockNextRequest("http://localhost/api/integrations/google/callback?code=test-code&state=test-state");
    const response = await CallbackGET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("google=connected");

    const createCall = mockCreate.mock.calls[0][0] as { data: { config: string } };
    const stored = createCall.data.config;

    expect(stored.startsWith("v1:")).toBe(true);
    expect(stored).not.toContain("dev-google-access-token");
    expect(stored).not.toContain("accessToken");

    const decrypted = decryptConfig(stored);
    expect(decrypted).not.toBeNull();
    expect(JSON.parse(decrypted as string)).toMatchObject({
      accessToken: "dev-google-access-token:test-code",
      refreshToken: "dev-google-refresh-token",
    });
  });

  it("creates team for user without teamId", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockCookieStore.get.mockImplementation((key: string) => {
      if (key === "oauth_google_calendar") return { value: "test-state" };
      return undefined;
    });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      if (key === "GOOGLE_CLIENT_ID") return "dev-google-client-id";
      if (key === "GOOGLE_CLIENT_SECRET") return "dev-google-client-secret";
      return "";
    });
    mockGetUserByClerkId.mockResolvedValue({
      id: "user-1",
      clerkId: "test-user",
      email: "test@example.com",
      name: "Test User",
      teamId: null,
    });
    mockDevSandboxEnabled.mockReturnValue(true);
    mockDevSandboxCredentials.mockReturnValue({
      clientId: "dev-google-client-id",
      clientSecret: "dev-google-client-secret",
      redirectUri: "http://localhost:3000/api/integrations/google/callback",
      scope: ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"],
      notesUrl: "https://console.cloud.google.com/",
    });
    mockPrismaTeamCreate.mockResolvedValue({ id: "new-team-1" });
    mockPrismaUserUpdate.mockResolvedValue({});
    mockPrismaUserFindUnique.mockResolvedValue({ id: "user-1", teamId: "new-team-1" });
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: "int-1",
      teamId: "new-team-1",
      provider: "google_calendar",
      syncedAt: new Date("2025-01-15T00:00:00.000Z"),
    });

    const req = mockNextRequest("http://localhost/api/integrations/google/callback?code=test-code&state=test-state");
    const response = await CallbackGET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("google=connected");
    expect(mockPrismaTeamCreate).toHaveBeenCalled();
  });

  it("updates existing integration record", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockCookieStore.get.mockImplementation((key: string) => {
      if (key === "oauth_google_calendar") return { value: "test-state" };
      return undefined;
    });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      if (key === "GOOGLE_CLIENT_ID") return "dev-google-client-id";
      if (key === "GOOGLE_CLIENT_SECRET") return "dev-google-client-secret";
      return "";
    });
    mockGetUserByClerkId.mockResolvedValue({
      id: "user-1",
      clerkId: "test-user",
      email: "test@example.com",
      name: "Test User",
      teamId: "team-1",
    });
    mockRequireRole.mockResolvedValue({ allowed: true, userRole: "ADMIN" });
    mockDevSandboxEnabled.mockReturnValue(true);
    mockDevSandboxCredentials.mockReturnValue({
      clientId: "dev-google-client-id",
      clientSecret: "dev-google-client-secret",
      redirectUri: "http://localhost:3000/api/integrations/google/callback",
      scope: ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"],
      notesUrl: "https://console.cloud.google.com/",
    });
    mockFindFirst.mockResolvedValue({ id: "existing-int-1", teamId: "team-1", provider: "google_calendar" });
    mockUpdate.mockResolvedValue({
      id: "existing-int-1",
      teamId: "team-1",
      provider: "google_calendar",
      syncedAt: new Date("2025-01-15T00:00:00.000Z"),
    });

    const req = mockNextRequest("http://localhost/api/integrations/google/callback?code=test-code&state=test-state");
    const response = await CallbackGET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("google=connected");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "existing-int-1" },
        data: expect.objectContaining({ enabled: true }),
      }),
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("redirects with forbidden for a team member", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockCookieStore.get.mockImplementation((key: string) => {
      if (key === "oauth_google_calendar") return { value: "test-state" };
      return undefined;
    });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      if (key === "GOOGLE_CLIENT_ID") return "dev-google-client-id";
      if (key === "GOOGLE_CLIENT_SECRET") return "dev-google-client-secret";
      return "";
    });
    mockGetUserByClerkId.mockResolvedValue({
      id: "user-1",
      clerkId: "test-user",
      email: "test@example.com",
      name: "Test User",
      teamId: "team-1",
    });
    mockRequireRole.mockResolvedValue({ allowed: false, userRole: "MEMBER" });
    mockDevSandboxEnabled.mockReturnValue(true);
    mockDevSandboxCredentials.mockReturnValue({
      clientId: "dev-google-client-id",
      clientSecret: "dev-google-client-secret",
      redirectUri: "http://localhost:3000/api/integrations/google/callback",
      scope: ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"],
      notesUrl: "https://console.cloud.google.com/",
    });

    const req = mockNextRequest("http://localhost/api/integrations/google/callback?code=test-code&state=test-state");
    const response = await CallbackGET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("error=forbidden");
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
