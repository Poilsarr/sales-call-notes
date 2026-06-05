import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

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
  const sessionId = searchParams.get("sessionId") || "default";

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

    const { text, sessionId, isFinal } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    const resolvedSessionId = sessionId || "default";
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
