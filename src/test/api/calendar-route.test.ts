import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockGetUserByClerkId,
  mockListEvents,
  mockDetectUpcomingMeetings,
  mockFormatMeetingReminder,
  mockHasJoinableLink,
  mockGetMeetingPlatform,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetUserByClerkId: vi.fn(),
  mockListEvents: vi.fn(),
  mockDetectUpcomingMeetings: vi.fn(),
  mockFormatMeetingReminder: vi.fn(),
  mockHasJoinableLink: vi.fn(),
  mockGetMeetingPlatform: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/get-user", () => ({
  getUserByClerkId: mockGetUserByClerkId,
}));

vi.mock("@/services/calendar", () => ({
  CalendarService: class {
    listEvents = mockListEvents;
  },
}));

vi.mock("@/services/meeting-bot", () => ({
  detectUpcomingMeetings: mockDetectUpcomingMeetings,
  formatMeetingReminder: mockFormatMeetingReminder,
  hasJoinableLink: mockHasJoinableLink,
  getMeetingPlatform: mockGetMeetingPlatform,
}));

import { GET } from "@/app/api/calendar/route";

describe("GET /api/calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no userId", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await GET(new NextRequest("http://localhost/api/calendar"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockGetUserByClerkId).not.toHaveBeenCalled();
  });

  it("returns 200 + NO_TEAM with empty events for a teamless user", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123" });
    mockGetUserByClerkId.mockResolvedValue({ id: "u1", clerkId: "user_123", teamId: null });

    const res = await GET(new NextRequest("http://localhost/api/calendar"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.code).toBe("NO_TEAM");
    expect(body.events).toEqual([]);
    expect(mockListEvents).not.toHaveBeenCalled();
  });

  it("returns 200 + NO_TEAM with empty upcoming/active for teamless check-meetings", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123" });
    mockGetUserByClerkId.mockResolvedValue({ id: "u1", clerkId: "user_123", teamId: null });

    const res = await GET(new NextRequest("http://localhost/api/calendar?action=check-meetings"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.code).toBe("NO_TEAM");
    expect(body.upcoming).toEqual([]);
    expect(body.active).toEqual([]);
    expect(mockListEvents).not.toHaveBeenCalled();
  });

  it("passes through listEvents for a teamed user with no NO_TEAM code", async () => {
    const events = [{ id: "evt_1", summary: "Call with Acme" }];
    mockAuth.mockResolvedValue({ userId: "user_123" });
    mockGetUserByClerkId.mockResolvedValue({ id: "u1", clerkId: "user_123", teamId: "team_1" });
    mockListEvents.mockResolvedValue(events);

    const res = await GET(new NextRequest("http://localhost/api/calendar"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.events).toEqual(events);
    expect(body.code).toBeUndefined();
    expect(mockListEvents).toHaveBeenCalled();
  });
});
