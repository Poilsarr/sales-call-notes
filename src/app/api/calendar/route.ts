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
    return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 500 });
  }
}
