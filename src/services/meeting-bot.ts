import { CalendarEvent } from "./calendar";

interface MeetingReminder {
  eventId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  participants: string[];
  meetingLink?: string;
}

interface MeetingDetectionResult {
  upcomingMeetings: MeetingReminder[];
  activeMeetings: MeetingReminder[];
}

export function detectUpcomingMeetings(
  events: CalendarEvent[],
  windowMinutes: number = 30
): MeetingDetectionResult {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowMinutes * 60 * 1000);

  const upcomingMeetings: MeetingReminder[] = [];
  const activeMeetings: MeetingReminder[] = [];

  for (const event of events) {
    const start = new Date(event.start);
    const end = new Date(event.end);

    if (start <= now && end >= now) {
      activeMeetings.push({
        eventId: event.id,
        title: event.summary,
        startTime: start,
        endTime: end,
        participants: event.attendees || [],
        meetingLink: extractMeetingLink(event),
      });
    }

    if (start > now && start <= windowEnd) {
      upcomingMeetings.push({
        eventId: event.id,
        title: event.summary,
        startTime: start,
        endTime: end,
        participants: event.attendees || [],
        meetingLink: extractMeetingLink(event),
      });
    }
  }

  return { upcomingMeetings, activeMeetings };
}

function extractMeetingLink(event: CalendarEvent): string | undefined {
  if (event.conferenceData?.url) return event.conferenceData.url;
  if (event.hangoutLink) return event.hangoutLink;
  return undefined;
}

export function formatMeetingReminder(meeting: MeetingReminder): string {
  const minutesUntil = Math.round(
    (meeting.startTime.getTime() - Date.now()) / 60000
  );

  const parts: string[] = [];

  if (minutesUntil <= 0) {
    parts.push(`Meeting in progress: ${meeting.title}`);
  } else if (minutesUntil < 2) {
    parts.push(`Meeting starting now: ${meeting.title}`);
  } else {
    parts.push(`Upcoming: ${meeting.title} in ${minutesUntil} minutes`);
  }

  if (meeting.participants.length > 0) {
    parts.push(`With: ${meeting.participants.slice(0, 3).join(", ")}${meeting.participants.length > 3 ? "..." : ""}`);
  }

  if (meeting.meetingLink) {
    parts.push(`Link: ${meeting.meetingLink}`);
  }

  parts.push("Remember to start recording when the call begins!");

  return parts.join("\n");
}

export function sendBrowserNotification(
  title: string,
  body: string
): void {
  if (typeof window === "undefined") return;

  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/icon.png" });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, { body, icon: "/icon.png" });
      }
    });
  }
}

export function hasJoinableLink(meeting: MeetingReminder): boolean {
  return !!meeting.meetingLink;
}

export function getMeetingPlatform(link: string): "zoom" | "google-meet" | "microsoft-teams" | "unknown" {
  if (/zoom\.us/i.test(link)) return "zoom";
  if (/meet\.google\.com/i.test(link)) return "google-meet";
  if (/teams\.microsoft\.com/i.test(link)) return "microsoft-teams";
  return "unknown";
}
