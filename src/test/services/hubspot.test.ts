import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindFirst = vi.fn();
const mockUpdate = vi.fn();

const { mockGetSecret } = vi.hoisted(() => ({ mockGetSecret: vi.fn() }));

// Default: no ENCRYPTION_KEY (legacy plaintext behavior). Encryption tests
// override per-test to opt in.
mockGetSecret.mockImplementation((key: string) => {
  const map: Record<string, string> = {
    HUBSPOT_CLIENT_ID: "test-hs-client-id",
    HUBSPOT_CLIENT_SECRET: "test-hs-client-secret",
  };
  return map[key] || "";
});

vi.mock("@/lib/prisma", () => ({
  default: {
    integration: {
      findFirst: (...args: any[]) => mockFindFirst(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
  },
}));

vi.mock("@/lib/secrets", () => ({
  getSecret: mockGetSecret,
}));

import { HubSpotService } from "@/services/crm/hubspot";
import { encryptConfig, decryptConfig } from "@/lib/integrations/config-crypto";

const TEST_ENCRYPTION_KEY = "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockCall = {
  filename: "test-call.mp3",
  createdAt: new Date("2025-01-15"),
  transcript: "Hello this is a test call with john@example.com and phone 555-123-4567",
  summary: "Test summary",
  analytics: { budgetMentioned: true, timelineMentioned: false, decisionMakerPresent: true },
  actionItems: [{ task: "Follow up", owner: "John", due: "2025-02-01" }],
  decisions: [{ content: "Proceed with proposal" }],
  nextSteps: [{ step: "Send contract", date: "2025-01-20" }],
};

function mockCrmResponses() {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes("/crm/v3/objects/contacts")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: "hs-contact-1",
          properties: { email: "john@example.com", firstname: "Contact", lastname: "Name" },
        }),
      });
    }
    if (url.includes("/crm/v3/objects/deals")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: "hs-deal-1",
          properties: { dealname: "test-call.mp3", dealstage: "appointmentscheduled" },
        }),
      });
    }
    if (url.includes("/crm/v3/objects/notes")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ id: "hs-note-1" }),
      });
    }
    if (url.includes("/oauth/v1/token")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          access_token: "refreshed-token",
          expires_in: 3600,
          refresh_token: "new-refresh-token",
        }),
      });
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
  });
}

describe("HubSpotService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use existing token when not expired", async () => {
    const futureExpiry = new Date(Date.now() + 3600000).toISOString();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "hubspot",
      enabled: true,
      config: JSON.stringify({
        accessToken: "valid-token",
        refreshToken: "refresh-token",
        expiresAt: futureExpiry,
      }),
    });

    mockCrmResponses();

    const service = new HubSpotService("team-1");
    const result = await service.syncCall(mockCall);

    expect(result).toEqual({ contactId: "hs-contact-1", dealId: "hs-deal-1" });
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { teamId: "team-1", provider: "hubspot", enabled: true } }),
    );
  });

  it("should refresh token when expired", async () => {
    const pastExpiry = new Date(Date.now() - 3600000).toISOString();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "hubspot",
      enabled: true,
      config: JSON.stringify({
        accessToken: "expired-token",
        refreshToken: "refresh-token",
        expiresAt: pastExpiry,
      }),
    });

    mockCrmResponses();

    const service = new HubSpotService("team-1");
    const result = await service.syncCall(mockCall);

    expect(result).toEqual({ contactId: "hs-contact-1", dealId: "hs-deal-1" });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "int-1" },
        data: expect.objectContaining({
          config: expect.stringContaining("refreshed-token"),
          syncedAt: expect.any(Date),
        }),
      }),
    );
  });

  it("should throw when no integration record exists", async () => {
    mockFindFirst.mockResolvedValue(null);

    const service = new HubSpotService("team-1");
    await expect(service.syncCall(mockCall)).rejects.toThrow("HubSpot not connected");
  });

  it("should throw when no teamId is set", async () => {
    const service = new HubSpotService();
    await expect(service.syncCall(mockCall)).rejects.toThrow("HubSpot not connected");
  });

  it("should throw when config is missing accessToken", async () => {
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "hubspot",
      enabled: true,
      config: JSON.stringify({ refreshToken: "rt", expiresAt: new Date(Date.now() + 3600000).toISOString() }),
    });

    const service = new HubSpotService("team-1");
    await expect(service.syncCall(mockCall)).rejects.toThrow("HubSpot not connected");
  });

  it("should return null when no refresh token exists for expired token", async () => {
    const pastExpiry = new Date(Date.now() - 3600000).toISOString();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "hubspot",
      enabled: true,
      config: JSON.stringify({
        accessToken: "expired-token",
        expiresAt: pastExpiry,
      }),
    });

    const service = new HubSpotService("team-1");
    await expect(service.syncCall(mockCall)).rejects.toThrow("HubSpot not connected");
  });

  it("should throw on HubSpot API error", async () => {
    const futureExpiry = new Date(Date.now() + 3600000).toISOString();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "hubspot",
      enabled: true,
      config: JSON.stringify({
        accessToken: "valid-token",
        refreshToken: "refresh-token",
        expiresAt: futureExpiry,
      }),
    });

    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/crm/v3/objects/contacts")) {
        return Promise.resolve({ ok: true, json: async () => ({ id: "hs-contact-1" }) });
      }
      if (url.includes("/crm/v3/objects/deals")) {
        return Promise.resolve({ ok: false, status: 400, json: async () => ({ message: "Bad request" }) });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    const service = new HubSpotService("team-1");
    await expect(service.syncCall(mockCall)).rejects.toThrow("Failed to create HubSpot deal");
  });

  it("should use existing token when expiresAt is missing", async () => {
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "hubspot",
      enabled: true,
      config: JSON.stringify({
        accessToken: "valid-token",
        refreshToken: "refresh-token",
      }),
    });

    mockCrmResponses();

    const service = new HubSpotService("team-1");
    const result = await service.syncCall(mockCall);

    expect(result).toEqual({ contactId: "hs-contact-1", dealId: "hs-deal-1" });
    expect(mockFetch).not.toHaveBeenCalledWith(
      "https://api.hubapi.com/oauth/v1/token",
      expect.anything(),
    );
  });

  it("should read a token from an encrypted config (decrypt on read)", async () => {
    mockGetSecret.mockImplementation((key: string) =>
      key === "ENCRYPTION_KEY" ? TEST_ENCRYPTION_KEY : "",
    );
    const futureExpiry = new Date(Date.now() + 3600000).toISOString();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "hubspot",
      enabled: true,
      config: encryptConfig(
        JSON.stringify({
          accessToken: "valid-token",
          refreshToken: "refresh-token",
          expiresAt: futureExpiry,
        }),
      ),
    });

    mockCrmResponses();

    const service = new HubSpotService("team-1");
    const result = await service.syncCall(mockCall);

    expect(result).toEqual({ contactId: "hs-contact-1", dealId: "hs-deal-1" });
    // Valid (unexpired) token from the encrypted row — no refresh call.
    expect(mockFetch).not.toHaveBeenCalledWith(
      "https://api.hubapi.com/oauth/v1/token",
      expect.anything(),
    );
  });

  it("should re-encrypt on refresh (lazy migration of legacy plaintext)", async () => {
    mockGetSecret.mockImplementation((key: string) =>
      key === "ENCRYPTION_KEY"
        ? TEST_ENCRYPTION_KEY
        : key === "HUBSPOT_CLIENT_ID"
          ? "test-hs-client-id"
          : key === "HUBSPOT_CLIENT_SECRET"
            ? "test-hs-client-secret"
            : "",
    );
    const pastExpiry = new Date(Date.now() - 3600000).toISOString();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "hubspot",
      enabled: true,
      // Legacy plaintext row — the pre-encryption format.
      config: JSON.stringify({
        accessToken: "expired-token",
        refreshToken: "refresh-token",
        expiresAt: pastExpiry,
      }),
    });

    mockCrmResponses();

    const service = new HubSpotService("team-1");
    const result = await service.syncCall(mockCall);

    expect(result).toEqual({ contactId: "hs-contact-1", dealId: "hs-deal-1" });

    const updateCall = mockUpdate.mock.calls[0][0] as { data: { config: string } };
    const stored = updateCall.data.config;

    // The refreshed config is stored encrypted, not as legacy plaintext.
    expect(stored.startsWith("v1:")).toBe(true);
    expect(stored).not.toContain("refreshed-token");

    // And it round-trips to the refreshed token set.
    const decrypted = decryptConfig(stored);
    expect(decrypted).not.toBeNull();
    expect(JSON.parse(decrypted as string)).toMatchObject({
      accessToken: "refreshed-token",
      refreshToken: "new-refresh-token",
    });
  });
});
