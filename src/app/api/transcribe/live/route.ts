import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { checkRateLimit } from "@/lib/rate-limit";
import {
  publishLiveTranscriptionEvent,
  subscribeToLiveTranscriptionSession,
} from "@/lib/live-transcription-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const { searchParams } = new URL(req.url);
  const requestedSession = searchParams.get("sessionId") || "default";
  // Namespace sessions per user — otherwise any authenticated user could
  // subscribe to (or publish into) another user's live session.
  const sessionId = `${userId}:${requestedSession}`;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const subscription = subscribeToLiveTranscriptionSession(sessionId, sendEvent);
      sendEvent({ type: "connected", sessionId, message: "Live transcription ready" });
      subscription.backlog.forEach(sendEvent);

      const keepAlive = setInterval(() => {
        sendEvent({ type: "keepalive", timestamp: Date.now() });
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        subscription.unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Middleware skips this route (SSE publish sink fires per speech event),
    // so enforce a per-user bucket here: 120 POSTs/min. Fail-open on Redis
    // outage (checkRateLimit returns success), so live transcription never
    // hard-blocks the call.
    const { success } = await checkRateLimit(`live:${userId}`, "live");
    if (!success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { text, sessionId, isFinal } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    const resolvedSessionId = `${userId}:${sessionId || "default"}`;
    const event = {
      type: "transcript" as const,
      sessionId: resolvedSessionId,
      text,
      isFinal: Boolean(isFinal),
      timestamp: Date.now(),
    };

    publishLiveTranscriptionEvent(resolvedSessionId, event);

    return NextResponse.json({
      success: true,
      sessionId: resolvedSessionId,
      words: text.split(" ").length,
      isFinal: Boolean(isFinal),
    });
  } catch (error) {
    return NextResponse.json({ error: "Live transcription failed" }, { status: 500 });
  }
}
