import { refreshIntegrationToken } from "@/lib/integrations/token-refresh";

export interface CalendarEvent {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  hangoutLink?: string;
  conferenceData?: {
    conferenceId: string;
    type: "googleMeet" | "zoom" | "microsoftTeams";
    url: string;
  };
  attendees?: string[];
}

interface GoogleEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType: string; uri: string; id?: string }>;
  };
  attendees?: Array<{ email: string }>;
}

const DAY_MS = 86400000;
const WEEK_MS = 7 * DAY_MS;

export class CalendarService {
  private baseUrl = "https://www.googleapis.com/calendar/v3";
  private teamId: string;
  private token: string | null = null;

  constructor(teamId: string) {
    this.teamId = teamId;
  }

  private async getToken(): Promise<string> {
    if (this.token) return this.token;
    const token = await refreshIntegrationToken(this.teamId, "google_calendar");
    if (!token) throw new Error("Google Calendar not connected");
    this.token = token;
    return token;
  }

  private normalizeEvent(event: GoogleEvent): CalendarEvent {
    const conference = event.conferenceData?.entryPoints?.[0];
    let conferenceType: "googleMeet" | "zoom" | "microsoftTeams" | undefined;
    const conferenceUrl = conference?.uri || event.hangoutLink || "";

    if (conferenceUrl.includes("meet.google.com")) conferenceType = "googleMeet";
    else if (conferenceUrl.includes("zoom.us")) conferenceType = "zoom";
    else if (conferenceUrl.includes("teams.microsoft.com")) conferenceType = "microsoftTeams";

    return {
      id: event.id,
      summary: event.summary || "Untitled Meeting",
      start: new Date(event.start?.dateTime || event.start?.date || new Date().toISOString()),
      end: new Date(event.end?.dateTime || event.end?.date || new Date().toISOString()),
      hangoutLink: event.hangoutLink,
      conferenceData: conferenceUrl
        ? { conferenceId: conference?.id || "", type: conferenceType!, url: conferenceUrl }
        : undefined,
      attendees: (event.attendees || []).map((a) => a.email),
    };
  }

  async listEvents(calendarId = "primary"): Promise<CalendarEvent[]> {
    const token = await this.getToken();
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + WEEK_MS).toISOString();

    const res = await fetch(
      `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=10`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) throw new Error("Failed to list calendar events");

    const data = (await res.json()) as { items?: GoogleEvent[] };
    return (data.items || []).map((e) => this.normalizeEvent(e));
  }

  async createEvent(
    summary: string,
    startTime: string,
    endTime: string,
    description?: string,
    attendees?: string[],
  ): Promise<CalendarEvent> {
    const token = await this.getToken();

    const body: Record<string, unknown> = {
      summary,
      start: { dateTime: startTime, timeZone: "UTC" },
      end: { dateTime: endTime, timeZone: "UTC" },
    };

    if (description) body.description = description;
    if (attendees && attendees.length > 0) {
      body.attendees = attendees.map((email) => ({ email }));
    }

    const res = await fetch(`${this.baseUrl}/calendars/primary/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error("Failed to create calendar event");

    const data = (await res.json()) as GoogleEvent;
    return this.normalizeEvent(data);
  }

  detectUpcomingMeetings(transcript: string): Array<{
    summary: string;
    startTime: string;
    endTime: string;
    description: string;
  }> {
    const meetings: Array<{
      summary: string;
      startTime: string;
      endTime: string;
      description: string;
    }> = [];

    const meetingPhrases = [
      /schedule\s+(?:a\s+)?(?:meeting|call|demo)/i,
      /let'?s?\s+(?:schedule|plan|set\s+up)\s+(?:a\s+)?(?:meeting|call|demo)/i,
      /(?:meeting|call|demo)\s+(?:next\s+)?(?:week|month)/i,
      /(?:meeting|call)\s+(?:on\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    ];

    const now = new Date();
    const lines = transcript.split(/[.!?\n]+/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      for (const pattern of meetingPhrases) {
        if (!pattern.test(trimmed)) continue;

        const startTime = new Date(now.getTime() + DAY_MS);
        startTime.setHours(10, 0, 0, 0);
        const endTime = new Date(startTime.getTime() + 3600000);

        const topic = trimmed.length > 80 ? trimmed.slice(0, 77) + "..." : trimmed;

        meetings.push({
          summary: "Follow-up: " + topic.replace(pattern, "").trim().slice(0, 60) || "Follow-up Meeting",
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          description: `Detected from transcript: ${trimmed}`,
        });

        break;
      }
    }

    return meetings;
  }
}
