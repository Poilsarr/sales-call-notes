import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { CalendarService } from "@/services/calendar";
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

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "check-meetings") {
      const authHeader = req.headers.get("authorization");
      const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (!accessToken) {
        return NextResponse.json({ error: "Access token required (Authorization: Bearer <token>)" }, { status: 400 });
      }

      const calendar = new CalendarService();
      const events = await calendar.fetchUpcomingEvents(accessToken);
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

    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!accessToken) {
      return NextResponse.json({ error: "Access token required (Authorization: Bearer <token>)" }, { status: 400 });
    }

    const calendar = new CalendarService();
    const events = await calendar.fetchUpcomingEvents(accessToken);

    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Authorization code required" }, { status: 400 });
    }

    const calendar = new CalendarService();
    const tokens = await calendar.exchangeCode(code);

    return NextResponse.json(tokens);
  } catch (error) {
    return NextResponse.json({ error: "Failed to exchange auth code" }, { status: 500 });
  }
}
