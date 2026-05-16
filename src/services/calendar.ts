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

export class CalendarService {
  private baseUrl = "https://www.googleapis.com/calendar/v3";

  async fetchUpcomingEvents(accessToken: string, daysAhead = 7): Promise<CalendarEvent[]> {
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + daysAhead * 86400000).toISOString();

    const res = await fetch(
      `${this.baseUrl}/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) throw new Error("Failed to fetch calendar events");

    const data = await res.json();
    return (data.items || []).map(this.normalizeEvent);
  }

  private normalizeEvent(event: any): CalendarEvent {
    const conference = event.conferenceData?.entryPoints?.[0];
    let conferenceType: "googleMeet" | "zoom" | "microsoftTeams" | undefined;
    let conferenceUrl = conference?.uri || event.hangoutLink || "";

    if (conferenceUrl.includes("meet.google.com")) conferenceType = "googleMeet";
    else if (conferenceUrl.includes("zoom.us")) conferenceType = "zoom";
    else if (conferenceUrl.includes("teams.microsoft.com")) conferenceType = "microsoftTeams";

    return {
      id: event.id,
      summary: event.summary || "Untitled Meeting",
      start: new Date(event.start?.dateTime || event.start?.date),
      end: new Date(event.end?.dateTime || event.end?.date),
      hangoutLink: event.hangoutLink,
      conferenceData: conferenceUrl ? { conferenceId: conference?.id || "", type: conferenceType!, url: conferenceUrl } : undefined,
      attendees: (event.attendees || []).map((a: any) => a.email),
    };
  }

  async getAuthUrl() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`;
    const scope = "https://www.googleapis.com/auth/calendar.events.readonly";
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline`;
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!res.ok) throw new Error("Failed to exchange auth code");
    const data = await res.json();
    return { accessToken: data.access_token, refreshToken: data.refresh_token };
  }
}
