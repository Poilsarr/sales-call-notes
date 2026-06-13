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
      GOOGLE_CLIENT_ID: "test-google-client-id",
      GOOGLE_CLIENT_SECRET: "test-google-client-secret",
    };
    return map[key] || "";
  },
}));

import { CalendarService } from "@/services/calendar";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockTokenResponse() {
  mockFetch.mockImplementation((url: string) => {
    if (url === "https://oauth2.googleapis.com/token") {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          access_token: "refreshed-google-token",
          expires_in: 3600,
        }),
      });
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
  });
}

function makeIntegrationConfig(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    accessToken: "valid-google-token",
    refreshToken: "valid-refresh-token",
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    ...overrides,
  });
}

describe("CalendarService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("token management", () => {
    it("should use existing token when not expired", async () => {
      const futureExpiry = new Date(Date.now() + 3600000).toISOString();
      mockFindFirst.mockResolvedValue({
        id: "int-1",
        teamId: "team-1",
        provider: "google_calendar",
        enabled: true,
        config: JSON.stringify({
          accessToken: "valid-token",
          refreshToken: "refresh-token",
          expiresAt: futureExpiry,
        }),
      });

      mockFetch.mockImplementation((url: string) => {
        if (url.includes("/calendar/v3/calendars/primary/events")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              items: [
                {
                  id: "event-1",
                  summary: "Test Meeting",
                  start: { dateTime: "2025-06-01T10:00:00Z" },
                  end: { dateTime: "2025-06-01T11:00:00Z" },
                },
              ],
            }),
          });
        }
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });

      const service = new CalendarService("team-1");
      const events = await service.listEvents();

      expect(events).toHaveLength(1);
      expect(events[0].summary).toBe("Test Meeting");
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("should refresh token when expired", async () => {
      const pastExpiry = new Date(Date.now() - 3600000).toISOString();
      mockFindFirst.mockResolvedValue({
        id: "int-1",
        teamId: "team-1",
        provider: "google_calendar",
        enabled: true,
        config: JSON.stringify({
          accessToken: "expired-token",
          refreshToken: "valid-refresh-token",
          expiresAt: pastExpiry,
        }),
      });

      mockFetch.mockImplementation((url: string) => {
        if (url === "https://oauth2.googleapis.com/token") {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              access_token: "refreshed-token",
              expires_in: 3600,
            }),
          });
        }
        if (url.includes("/calendar/v3/calendars/primary/events")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              items: [
                {
                  id: "event-1",
                  summary: "Refreshed Meeting",
                  start: { dateTime: "2025-06-01T10:00:00Z" },
                  end: { dateTime: "2025-06-01T11:00:00Z" },
                },
              ],
            }),
          });
        }
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });

      const service = new CalendarService("team-1");
      const events = await service.listEvents();

      expect(events).toHaveLength(1);
      expect(events[0].summary).toBe("Refreshed Meeting");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "int-1" },
          data: expect.objectContaining({
            config: expect.stringContaining("refreshed-token"),
          }),
        }),
      );
    });

    it("should throw when no integration exists", async () => {
      mockFindFirst.mockResolvedValue(null);

      const service = new CalendarService("team-1");
      await expect(service.listEvents()).rejects.toThrow("Google Calendar not connected");
    });

    it("should throw when no refresh token exists for expired token", async () => {
      const pastExpiry = new Date(Date.now() - 3600000).toISOString();
      mockFindFirst.mockResolvedValue({
        id: "int-1",
        teamId: "team-1",
        provider: "google_calendar",
        enabled: true,
        config: JSON.stringify({
          accessToken: "expired-token",
          expiresAt: pastExpiry,
        }),
      });

      const service = new CalendarService("team-1");
      await expect(service.listEvents()).rejects.toThrow("Google Calendar not connected");
    });
  });

  describe("event creation", () => {
    it("should create an event successfully", async () => {
      const futureExpiry = new Date(Date.now() + 3600000).toISOString();
      mockFindFirst.mockResolvedValue({
        id: "int-1",
        teamId: "team-1",
        provider: "google_calendar",
        enabled: true,
        config: JSON.stringify({
          accessToken: "valid-token",
          refreshToken: "refresh-token",
          expiresAt: futureExpiry,
        }),
      });

      mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
        if (url === "https://oauth2.googleapis.com/token") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ access_token: "token", expires_in: 3600 }),
          });
        }
        if (url.includes("/calendar/v3/calendars/primary/events")) {
          const body = opts?.body ? JSON.parse(opts.body as string) : {};
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: "new-event-1",
              summary: body.summary,
              start: body.start,
              end: body.end,
              attendees: body.attendees,
            }),
          });
        }
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });

      const service = new CalendarService("team-1");
      const event = await service.createEvent(
        "Follow-up call",
        "2025-06-15T14:00:00Z",
        "2025-06-15T15:00:00Z",
        "Discuss proposal",
        ["client@example.com"],
      );

      expect(event.summary).toBe("Follow-up call");
      expect(event.attendees).toEqual(["client@example.com"]);
    });

    it("should throw on Google API error", async () => {
      const futureExpiry = new Date(Date.now() + 3600000).toISOString();
      mockFindFirst.mockResolvedValue({
        id: "int-1",
        teamId: "team-1",
        provider: "google_calendar",
        enabled: true,
        config: JSON.stringify({
          accessToken: "valid-token",
          refreshToken: "refresh-token",
          expiresAt: futureExpiry,
        }),
      });

      mockFetch.mockImplementation((url: string) => {
        if (url.includes("/calendar/v3/calendars/primary/events")) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: async () => ({ error: { message: "Bad Request" } }),
          });
        }
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });

      const service = new CalendarService("team-1");
      await expect(
        service.createEvent("Test", "2025-06-15T14:00:00Z", "2025-06-15T15:00:00Z"),
      ).rejects.toThrow("Failed to create calendar event");
    });
  });

  describe("meeting detection", () => {
    it("should detect 'schedule a call' phrases", () => {
      const transcript = "We should schedule a call to discuss the proposal next week.";
      const service = new CalendarService("team-1");
      const meetings = service.detectUpcomingMeetings(transcript);

      expect(meetings.length).toBeGreaterThan(0);
      expect(meetings[0].summary).toContain("Follow-up");
    });

    it("should detect 'meeting next week' phrases", () => {
      const transcript = "Let's plan a meeting next week to go over the contract.";
      const service = new CalendarService("team-1");
      const meetings = service.detectUpcomingMeetings(transcript);

      expect(meetings.length).toBeGreaterThan(0);
      expect(meetings[0].description).toContain("Detected from transcript");
    });

    it("should detect 'let's set up a demo' phrases", () => {
      const transcript = "Let's set up a demo for the team on Thursday.";
      const service = new CalendarService("team-1");
      const meetings = service.detectUpcomingMeetings(transcript);

      expect(meetings.length).toBeGreaterThan(0);
    });

    it("should return empty array for non-meeting transcript", () => {
      const transcript = "Thank you for your time. We will send over the documents shortly.";
      const service = new CalendarService("team-1");
      const meetings = service.detectUpcomingMeetings(transcript);

      expect(meetings).toHaveLength(0);
    });

    it("should create valid date strings for detected meetings", () => {
      const transcript = "Let's schedule a call to discuss.";
      const service = new CalendarService("team-1");
      const meetings = service.detectUpcomingMeetings(transcript);

      expect(meetings.length).toBeGreaterThan(0);
      expect(() => new Date(meetings[0].startTime)).not.toThrow();
      expect(() => new Date(meetings[0].endTime)).not.toThrow();
      expect(new Date(meetings[0].endTime).getTime()).toBeGreaterThan(
        new Date(meetings[0].startTime).getTime(),
      );
    });

    it("should handle multiple meeting phrases in a transcript", () => {
      const transcript =
        "We should schedule a call for Monday. Also let's plan a demo next month. " +
        "And set up a meeting on Friday.";
      const service = new CalendarService("team-1");
      const meetings = service.detectUpcomingMeetings(transcript);

      expect(meetings.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("listEvents", () => {
    it("should normalize events with conference data", async () => {
      const futureExpiry = new Date(Date.now() + 3600000).toISOString();
      mockFindFirst.mockResolvedValue({
        id: "int-1",
        teamId: "team-1",
        provider: "google_calendar",
        enabled: true,
        config: JSON.stringify({
          accessToken: "valid-token",
          refreshToken: "refresh-token",
          expiresAt: futureExpiry,
        }),
      });

      mockFetch.mockImplementation((url: string) => {
        if (url.includes("/calendar/v3/calendars/primary/events")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              items: [
                {
                  id: "event-1",
                  summary: "Google Meet Call",
                  start: { dateTime: "2025-06-01T10:00:00Z" },
                  end: { dateTime: "2025-06-01T11:00:00Z" },
                  hangoutLink: "https://meet.google.com/abc-defg-hij",
                  conferenceData: {
                    entryPoints: [
                      {
                        entryPointType: "video",
                        uri: "https://meet.google.com/abc-defg-hij",
                        id: "conf-1",
                      },
                    ],
                  },
                  attendees: [{ email: "alice@example.com" }, { email: "bob@example.com" }],
                },
              ],
            }),
          });
        }
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });

      const service = new CalendarService("team-1");
      const events = await service.listEvents();

      expect(events).toHaveLength(1);
      expect(events[0].summary).toBe("Google Meet Call");
      expect(events[0].hangoutLink).toBe("https://meet.google.com/abc-defg-hij");
      expect(events[0].conferenceData?.type).toBe("googleMeet");
      expect(events[0].attendees).toEqual(["alice@example.com", "bob@example.com"]);
    });

    it("should throw on Google Calendar API error", async () => {
      const futureExpiry = new Date(Date.now() + 3600000).toISOString();
      mockFindFirst.mockResolvedValue({
        id: "int-1",
        teamId: "team-1",
        provider: "google_calendar",
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
        json: async () => ({}),
      });

      const service = new CalendarService("team-1");
      await expect(service.listEvents()).rejects.toThrow("Failed to list calendar events");
    });

    it("should use custom calendar ID", async () => {
      const futureExpiry = new Date(Date.now() + 3600000).toISOString();
      mockFindFirst.mockResolvedValue({
        id: "int-1",
        teamId: "team-1",
        provider: "google_calendar",
        enabled: true,
        config: JSON.stringify({
          accessToken: "valid-token",
          refreshToken: "refresh-token",
          expiresAt: futureExpiry,
        }),
      });

      let calledUrl = "";
      mockFetch.mockImplementation((url: string) => {
        calledUrl = url;
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [] }),
        });
      });

      const service = new CalendarService("team-1");
      await service.listEvents("custom-calendar@group.calendar.google.com");

      expect(calledUrl).toContain("custom-calendar%40group.calendar.google.com");
    });
  });
});
