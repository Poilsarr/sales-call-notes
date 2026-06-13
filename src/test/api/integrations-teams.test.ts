import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockGetUserByClerkId, mockFindFirst, mockCreate, mockUpdate, mockGetSecret, mockDevSandboxEnabled, mockDevSandboxCredentials, mockLogAuditAction, mockPrismaTeamCreate, mockPrismaUserUpdate, mockPrismaUserFindUnique, mockCookieStore } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetUserByClerkId: vi.fn(),
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

import { GET as ConnectGET } from "@/app/api/integrations/teams/connect/route";
import { GET as CallbackGET } from "@/app/api/integrations/teams/callback/route";

function mockNextRequest(url: string): Request {
  const req = new Request(url);
  const nextUrl = new URL(url);
  Object.defineProperty(req, "nextUrl", {
    value: nextUrl,
    writable: false,
  });
  return req;
}

describe("Teams Connect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await ConnectGET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when TEAMS_CLIENT_ID is not configured", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      return "";
    });

    const response = await ConnectGET();
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Not configured" });
  });

  it("redirects to Microsoft OAuth URL when configured", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "TEAMS_CLIENT_ID") return "test-teams-client-id";
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      return "";
    });

    const response = await ConnectGET();

    expect(response.status).toBe(307);
    const location = response.headers.get("location") || "";
    expect(location).toContain("login.microsoftonline.com/common/oauth2/v2.0/authorize");
    expect(location).toContain("client_id=test-teams-client-id");
    expect(location).toContain("response_type=code");
    expect(location).toContain("scope=" + encodeURIComponent("offline_access User.Read Calendars.ReadWrite OnlineMeetings.ReadWrite").replace(/%20/g, "+"));
  });

  it("uses MICROSOFT_CLIENT_ID as fallback", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "MICROSOFT_CLIENT_ID") return "fallback-ms-client-id";
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      return "";
    });

    const response = await ConnectGET();

    expect(response.status).toBe(307);
    const location = response.headers.get("location") || "";
    expect(location).toContain("client_id=fallback-ms-client-id");
  });

  it("uses custom tenant when MICROSOFT_TENANT_ID is set", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "TEAMS_CLIENT_ID") return "test-teams-client-id";
      if (key === "MICROSOFT_TENANT_ID") return "custom-tenant";
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      return "";
    });

    const response = await ConnectGET();

    expect(response.status).toBe(307);
    const location = response.headers.get("location") || "";
    expect(location).toContain("login.microsoftonline.com/custom-tenant/oauth2/v2.0/authorize");
  });
});

describe("Teams Callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to sign-in when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const req = mockNextRequest("http://localhost/api/integrations/teams/callback?code=test&state=teams:test-nonce");
    const response = await CallbackGET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/sign-in");
  });

  it("redirects with error when Microsoft returns error", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      return "";
    });

    const req = mockNextRequest("http://localhost/api/integrations/teams/callback?error=access_denied");
    const response = await CallbackGET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("error=teams_access_denied");
  });

  it("redirects with error when code or state missing", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      return "";
    });

    const req = mockNextRequest("http://localhost/api/integrations/teams/callback");
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

    const req = mockNextRequest("http://localhost/api/integrations/teams/callback?code=test-code&state=teams:invalid-state");
    const response = await CallbackGET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("error=invalid_nonce");
  });

  it("stores integration and redirects on success with sandbox", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockCookieStore.get.mockImplementation((key: string) => {
      if (key === "oauth_teams") return { value: "test-nonce" };
      return undefined;
    });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      if (key === "TEAMS_CLIENT_ID") return "dev-teams-client-id";
      if (key === "TEAMS_CLIENT_SECRET") return "dev-teams-client-secret";
      return "";
    });
    mockGetUserByClerkId.mockResolvedValue({
      id: "user-1",
      clerkId: "test-user",
      email: "test@example.com",
      name: "Test User",
      teamId: "team-1",
    });
    mockDevSandboxEnabled.mockReturnValue(true);
    mockDevSandboxCredentials.mockReturnValue({
      clientId: "dev-teams-client-id",
      clientSecret: "dev-teams-client-secret",
      redirectUri: "http://localhost:3000/api/integrations/teams/callback",
      scope: ["offline_access", "User.Read", "Calendars.ReadWrite", "OnlineMeetings.ReadWrite"],
      notesUrl: "https://portal.azure.com/",
    });
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "teams",
      syncedAt: new Date("2025-01-15T00:00:00.000Z"),
    });

    const req = mockNextRequest("http://localhost/api/integrations/teams/callback?code=test-code&state=teams:test-nonce");
    const response = await CallbackGET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("teams=connected");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          teamId: "team-1",
          provider: "teams",
          config: expect.stringContaining("dev-teams-access-token"),
        }),
      }),
    );
  });

  it("creates team for user without teamId", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockCookieStore.get.mockImplementation((key: string) => {
      if (key === "oauth_teams") return { value: "test-nonce" };
      return undefined;
    });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      if (key === "TEAMS_CLIENT_ID") return "dev-teams-client-id";
      if (key === "TEAMS_CLIENT_SECRET") return "dev-teams-client-secret";
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
      clientId: "dev-teams-client-id",
      clientSecret: "dev-teams-client-secret",
      redirectUri: "http://localhost:3000/api/integrations/teams/callback",
      scope: ["offline_access", "User.Read", "Calendars.ReadWrite", "OnlineMeetings.ReadWrite"],
      notesUrl: "https://portal.azure.com/",
    });
    mockPrismaTeamCreate.mockResolvedValue({ id: "new-team-1" });
    mockPrismaUserUpdate.mockResolvedValue({});
    mockPrismaUserFindUnique.mockResolvedValue({ id: "user-1", teamId: "new-team-1" });
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: "int-1",
      teamId: "new-team-1",
      provider: "teams",
      syncedAt: new Date("2025-01-15T00:00:00.000Z"),
    });

    const req = mockNextRequest("http://localhost/api/integrations/teams/callback?code=test-code&state=teams:test-nonce");
    const response = await CallbackGET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("teams=connected");
    expect(mockPrismaTeamCreate).toHaveBeenCalled();
  });

  it("updates existing integration record", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockCookieStore.get.mockImplementation((key: string) => {
      if (key === "oauth_teams") return { value: "test-nonce" };
      return undefined;
    });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      if (key === "TEAMS_CLIENT_ID") return "dev-teams-client-id";
      if (key === "TEAMS_CLIENT_SECRET") return "dev-teams-client-secret";
      return "";
    });
    mockGetUserByClerkId.mockResolvedValue({
      id: "user-1",
      clerkId: "test-user",
      email: "test@example.com",
      name: "Test User",
      teamId: "team-1",
    });
    mockDevSandboxEnabled.mockReturnValue(true);
    mockDevSandboxCredentials.mockReturnValue({
      clientId: "dev-teams-client-id",
      clientSecret: "dev-teams-client-secret",
      redirectUri: "http://localhost:3000/api/integrations/teams/callback",
      scope: ["offline_access", "User.Read", "Calendars.ReadWrite", "OnlineMeetings.ReadWrite"],
      notesUrl: "https://portal.azure.com/",
    });
    mockFindFirst.mockResolvedValue({ id: "existing-int-1", teamId: "team-1", provider: "teams" });
    mockUpdate.mockResolvedValue({
      id: "existing-int-1",
      teamId: "team-1",
      provider: "teams",
      syncedAt: new Date("2025-01-15T00:00:00.000Z"),
    });

    const req = mockNextRequest("http://localhost/api/integrations/teams/callback?code=test-code&state=teams:test-nonce");
    const response = await CallbackGET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("teams=connected");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "existing-int-1" },
        data: expect.objectContaining({ enabled: true }),
      }),
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("validates state provider prefix", async () => {
    mockAuth.mockResolvedValue({ userId: "test-user" });
    mockGetSecret.mockImplementation((key: string) => {
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      return "";
    });

    const req = mockNextRequest("http://localhost/api/integrations/teams/callback?code=test-code&state=hubspot:test-nonce");
    const response = await CallbackGET(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("error=invalid_state");
  });
});
