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
      TEAMS_CLIENT_ID: "test-teams-client-id",
      TEAMS_CLIENT_SECRET: "test-teams-client-secret",
    };
    return map[key] || "";
  },
}));

import { TeamsService } from "@/services/teams";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockGraphResponses() {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes("onlineMeetings") && url.includes("v1.0")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          value: [
            {
              id: "meeting-1",
              subject: "Q1 Review",
              startDateTime: "2025-02-01T10:00:00Z",
              endDateTime: "2025-02-01T11:00:00Z",
              joinUrl: "https://teams.microsoft.com/meeting/1",
            },
            {
              id: "meeting-2",
              subject: "Sprint Planning",
              startDateTime: "2025-02-03T14:00:00Z",
              endDateTime: "2025-02-03T15:00:00Z",
              joinUrl: "https://teams.microsoft.com/meeting/2",
            },
          ],
        }),
      });
    }
    if (url.includes("/oauth2/v2.0/token")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          access_token: "refreshed-teams-token",
          refresh_token: "new-refresh-token",
          expires_in: 3600,
        }),
      });
    }
    if (url.includes("onlineMeetings") && !url.includes("v1.0")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: "meeting-3",
          subject: "New Meeting",
          startDateTime: "2025-03-01T10:00:00Z",
          endDateTime: "2025-03-01T11:00:00Z",
          joinUrl: "https://teams.microsoft.com/meeting/3",
        }),
      });
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
  });
}

describe("TeamsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return meetings list when token is valid", async () => {
    const futureExpiry = new Date(Date.now() + 3600000).toISOString();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "teams",
      enabled: true,
      config: JSON.stringify({
        accessToken: "valid-token",
        refreshToken: "refresh-token",
        expiresAt: futureExpiry,
      }),
    });

    mockGraphResponses();

    const service = new TeamsService("team-1");
    const meetings = await service.listMeetings();

    expect(meetings).toHaveLength(2);
    expect(meetings[0].subject).toBe("Q1 Review");
    expect(meetings[1].subject).toBe("Sprint Planning");
  });

  it("should refresh token when expired for listMeetings", async () => {
    const pastExpiry = new Date(Date.now() - 3600000).toISOString();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "teams",
      enabled: true,
      config: JSON.stringify({
        accessToken: "expired-token",
        refreshToken: "refresh-token",
        expiresAt: pastExpiry,
      }),
    });

    mockGraphResponses();

    const service = new TeamsService("team-1");
    const meetings = await service.listMeetings();

    expect(meetings).toHaveLength(2);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "int-1" },
        data: expect.objectContaining({
          config: expect.stringContaining("refreshed-teams-token"),
          syncedAt: expect.any(Date),
        }),
      }),
    );
  });

  it("should throw when no integration record exists for listMeetings", async () => {
    mockFindFirst.mockResolvedValue(null);

    const service = new TeamsService("team-1");
    await expect(service.listMeetings()).rejects.toThrow("Teams not connected");
  });

  it("should throw when config missing accessToken", async () => {
    const futureExpiry = new Date(Date.now() + 3600000).toISOString();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "teams",
      enabled: true,
      config: JSON.stringify({
        refreshToken: "rt",
        expiresAt: futureExpiry,
      }),
    });

    const service = new TeamsService("team-1");
    await expect(service.listMeetings()).rejects.toThrow("Teams not connected");
  });

  it("should create a meeting successfully", async () => {
    const futureExpiry = new Date(Date.now() + 3600000).toISOString();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "teams",
      enabled: true,
      config: JSON.stringify({
        accessToken: "valid-token",
        refreshToken: "refresh-token",
        expiresAt: futureExpiry,
      }),
    });

    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes("onlineMeetings") && options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: "meeting-created",
            subject: "Sprint Review",
            startDateTime: "2025-03-01T10:00:00Z",
            endDateTime: "2025-03-01T11:00:00Z",
            joinUrl: "https://teams.microsoft.com/meeting/created",
          }),
        });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    const service = new TeamsService("team-1");
    const meeting = await service.createMeeting(
      "Sprint Review",
      "2025-03-01T10:00:00Z",
      "2025-03-01T11:00:00Z",
    );

    expect(meeting.id).toBe("meeting-created");
    expect(meeting.subject).toBe("Sprint Review");
    expect(meeting.joinUrl).toBe("https://teams.microsoft.com/meeting/created");
  });

  it("should create a meeting with attendees", async () => {
    const futureExpiry = new Date(Date.now() + 3600000).toISOString();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "teams",
      enabled: true,
      config: JSON.stringify({
        accessToken: "valid-token",
        refreshToken: "refresh-token",
        expiresAt: futureExpiry,
      }),
    });

    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes("onlineMeetings") && options?.method === "POST") {
        const body = JSON.parse(options.body as string);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: "meeting-attendees",
            subject: body.subject,
            startDateTime: "2025-03-01T15:00:00Z",
            endDateTime: "2025-03-01T16:00:00Z",
            joinUrl: "https://teams.microsoft.com/meeting/attendees",
            participants: body.participants,
          }),
        });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    const service = new TeamsService("team-1");
    const meeting = await service.createMeeting(
      "Team Sync",
      "2025-03-01T15:00:00Z",
      "2025-03-01T16:00:00Z",
      ["alice@example.com", "bob@example.com"],
    );

    expect(meeting.id).toBe("meeting-attendees");
    expect(meeting.subject).toBe("Team Sync");
    expect(meeting.participants).toBeDefined();
  });

  it("should throw when createMeeting fails on API error", async () => {
    const futureExpiry = new Date(Date.now() + 3600000).toISOString();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "teams",
      enabled: true,
      config: JSON.stringify({
        accessToken: "valid-token",
        refreshToken: "refresh-token",
        expiresAt: futureExpiry,
      }),
    });

    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Bad request" } }),
    });

    const service = new TeamsService("team-1");
    await expect(
      service.createMeeting("Fail", "2025-01-01T00:00:00Z", "2025-01-01T01:00:00Z"),
    ).rejects.toThrow("Failed to create Teams meeting");
  });

  it("should throw when listMeetings fails on API error", async () => {
    const futureExpiry = new Date(Date.now() + 3600000).toISOString();
    mockFindFirst.mockResolvedValue({
      id: "int-1",
      teamId: "team-1",
      provider: "teams",
      enabled: true,
      config: JSON.stringify({
        accessToken: "valid-token",
        refreshToken: "refresh-token",
        expiresAt: futureExpiry,
      }),
    });

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "Server error" } }),
    });

    const service = new TeamsService("team-1");
    await expect(service.listMeetings()).rejects.toThrow("Failed to list Teams meetings");
  });
});
