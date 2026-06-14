import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindFirst = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  default: {
    integration: {
      findFirst: (...args: any[]) => mockFindFirst(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
  },
}));

vi.mock("@/lib/secrets", () => ({
  getSecret: (key: string) => {
    const map: Record<string, string> = {
      SALESFORCE_CLIENT_ID: "test-sf-client-id",
      SALESFORCE_CLIENT_SECRET: "test-sf-client-secret",
    };
    return map[key] || "";
  },
}));

import { SalesforceService } from "@/services/crm/salesforce";

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
    if (url.includes("/sobjects/Contact")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ id: "sf-contact-1", success: true }),
      });
    }
    if (url.includes("/sobjects/Opportunity")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ id: "sf-opp-1", success: true }),
      });
    }
    if (url.includes("/sobjects/Task")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ id: "sf-task-1", success: true }),
      });
    }
    if (url.includes("/services/oauth2/token")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          access_token: "refreshed-token",
          instance_url: "https://example.my.salesforce.com",
        }),
      });
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
  });
}

describe("SalesforceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use existing token when not expired", async () => {
    const futureExpiry = new Date(Date.now() + 3600000).toISOString();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "salesforce",
      enabled: true,
      config: JSON.stringify({
        accessToken: "valid-token",
        refreshToken: "refresh-token",
        expiresAt: futureExpiry,
        instanceUrl: "https://example.my.salesforce.com",
      }),
    });

    mockCrmResponses();

    const service = new SalesforceService("team-1", "https://example.my.salesforce.com");
    const result = await service.syncCall(mockCall);

    expect(result).toEqual({ contactId: "sf-contact-1", opportunityId: "sf-opp-1" });
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { teamId: "team-1", provider: "salesforce", enabled: true } }),
    );
  });

  it("should refresh token when expired", async () => {
    const pastExpiry = new Date(Date.now() - 3600000).toISOString();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "salesforce",
      enabled: true,
      config: JSON.stringify({
        accessToken: "expired-token",
        refreshToken: "refresh-token",
        expiresAt: pastExpiry,
        instanceUrl: "https://example.my.salesforce.com",
      }),
    });

    mockCrmResponses();

    const service = new SalesforceService("team-1", "https://example.my.salesforce.com");
    const result = await service.syncCall(mockCall);

    expect(result).toEqual({ contactId: "sf-contact-1", opportunityId: "sf-opp-1" });
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

    const service = new SalesforceService("team-1");
    await expect(service.syncCall(mockCall)).rejects.toThrow("Salesforce not connected");
  });

  it("should throw when no teamId is set", async () => {
    const service = new SalesforceService();
    await expect(service.syncCall(mockCall)).rejects.toThrow("Salesforce not connected");
  });

  it("should throw when config missing accessToken", async () => {
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "salesforce",
      enabled: true,
      config: JSON.stringify({
        refreshToken: "rt",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        instanceUrl: "https://example.my.salesforce.com",
      }),
    });

    const service = new SalesforceService("team-1");
    await expect(service.syncCall(mockCall)).rejects.toThrow("Salesforce not connected");
  });

  it("should throw when no refresh token exists for expired token", async () => {
    const pastExpiry = new Date(Date.now() - 3600000).toISOString();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "salesforce",
      enabled: true,
      config: JSON.stringify({
        accessToken: "expired-token",
        expiresAt: pastExpiry,
        instanceUrl: "https://example.my.salesforce.com",
      }),
    });

    const service = new SalesforceService("team-1", "https://example.my.salesforce.com");
    await expect(service.syncCall(mockCall)).rejects.toThrow("Salesforce not connected");
  });

  it("should throw on Salesforce API error", async () => {
    const futureExpiry = new Date(Date.now() + 3600000).toISOString();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "salesforce",
      enabled: true,
      config: JSON.stringify({
        accessToken: "valid-token",
        refreshToken: "refresh-token",
        expiresAt: futureExpiry,
        instanceUrl: "https://example.my.salesforce.com",
      }),
    });

    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/sobjects/Contact")) {
        return Promise.resolve({ ok: true, json: async () => ({ id: "sf-contact-1" }) });
      }
      if (url.includes("/sobjects/Opportunity")) {
        return Promise.resolve({ ok: false, status: 400, json: async () => ([{ message: "Bad request" }]) });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    const service = new SalesforceService("team-1", "https://example.my.salesforce.com");
    await expect(service.syncCall(mockCall)).rejects.toThrow("Failed to create Salesforce opportunity");
  });

  it("should use existing token when expiresAt is missing", async () => {
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "salesforce",
      enabled: true,
      config: JSON.stringify({
        accessToken: "valid-token",
        refreshToken: "refresh-token",
        instanceUrl: "https://example.my.salesforce.com",
      }),
    });

    mockCrmResponses();

    const service = new SalesforceService("team-1", "https://example.my.salesforce.com");
    const result = await service.syncCall(mockCall);

    expect(result).toEqual({ contactId: "sf-contact-1", opportunityId: "sf-opp-1" });
    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/services/oauth2/token"),
      expect.anything(),
    );
  });
});
