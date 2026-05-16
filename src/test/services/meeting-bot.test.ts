import { describe, it, expect } from "vitest";
import { detectUpcomingMeetings, formatMeetingReminder, getMeetingPlatform } from "@/services/meeting-bot";
import type { CalendarEvent } from "@/services/calendar";

describe("Meeting Bot", () => {
  it("should detect active meetings", () => {
    const now = new Date();
    const events = [
      {
        id: "1",
        summary: "Test Meeting",
        start: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        end: new Date(now.getTime() + 25 * 60 * 1000).toISOString(),
        attendees: ["alice@test.com"],
      },
    ] as CalendarEvent[];

    const result = detectUpcomingMeetings(events, 30);
    expect(result.activeMeetings).toHaveLength(1);
    expect(result.activeMeetings[0].title).toBe("Test Meeting");
  });

  it("should detect upcoming meetings within window", () => {
    const now = new Date();
    const events = [
      {
        id: "2",
        summary: "Upcoming Standup",
        start: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
        end: new Date(now.getTime() + 40 * 60 * 1000).toISOString(),
        attendees: ["bob@test.com"],
      },
    ] as CalendarEvent[];

    const result = detectUpcomingMeetings(events, 30);
    expect(result.upcomingMeetings).toHaveLength(1);
  });

  it("should detect Zoom meeting links", () => {
    const platform = getMeetingPlatform("https://zoom.us/j/123456789");
    expect(platform).toBe("zoom");
  });

  it("should detect Google Meet links", () => {
    const platform = getMeetingPlatform("https://meet.google.com/abc-defg-hij");
    expect(platform).toBe("google-meet");
  });

  it("should return unknown for unrecognized links", () => {
    const platform = getMeetingPlatform("https://example.com/call");
    expect(platform).toBe("unknown");
  });

  it("should format meeting reminder with correct info", () => {
    const meeting = {
      eventId: "1",
      title: "Sprint Review",
      startTime: new Date(Date.now() + 5 * 60 * 1000),
      endTime: new Date(Date.now() + 35 * 60 * 1000),
      participants: ["team@test.com"],
      meetingLink: "https://meet.google.com/abc-defg-hij",
    };

    const reminder = formatMeetingReminder(meeting);
    expect(reminder).toContain("Sprint Review");
  });
});
