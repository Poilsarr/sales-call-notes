import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { CalendarService } from "@/services/calendar";
import { getUserByClerkId } from "@/lib/get-user";
import {
  detectUpcomingMeetings,
  formatMeetingReminder,
  hasJoinableLink,
  getMeetingPlatform,
} from "@/services/meeting-bot";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(userId);
    if (!user.teamId) {
      return NextResponse.json({ error: "No team found" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    const calendar = new CalendarService(user.teamId);

    if (action === "check-meetings") {
      const events = await calendar.listEvents();
      const result = detectUpcomingMeetings(events);

      return NextResponse.json({
        upcoming: result.upcomingMeetings.map((m) => ({
          title: m.title,
          startTime: m.startTime.toISOString(),
          endTime: m.endTime.toISOString(),
          participants: m.participants,
          hasLink: hasJoinableLink(m),
          platform: m.meetingLink ? getMeetingPlatform(m.meetingLink) : null,
          reminder: formatMeetingReminder(m),
        })),
        active: result.activeMeetings.map((m) => ({
          title: m.title,
          endTime: m.endTime.toISOString(),
          platform: m.meetingLink ? getMeetingPlatform(m.meetingLink) : null,
          reminder: formatMeetingReminder(m),
        })),
      });
    }

    const events = await calendar.listEvents();

    return NextResponse.json({ events });
  } catch (error) {
    const err = error as Error & { code?: string; status?: number };
    if (err.code === "NOT_CONNECTED" || err.status === 401) {
      return NextResponse.json(
        { error: err.message || "Google Calendar not connected", code: "NOT_CONNECTED" },
        { status: 401 },
      );
    }
    if (err.code === "NEEDS_RECONNECT") {
      return NextResponse.json(
        { error: err.message || "Google Calendar needs reconnect", code: "NEEDS_RECONNECT" },
        { status: 401 },
      );
    }
    if (err.code === "GONE" || err.status === 410) {
      return NextResponse.json(
        { error: err.message || "Google Calendar sync expired", code: "GONE" },
        { status: 410 },
      );
    }
    console.error("[calendar] fetch failed", error);
    return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 500 });
  }
}
