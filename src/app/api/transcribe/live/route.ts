import { NextRequest } from "next/server";

import {
  publishLiveTranscriptionEvent,
  subscribeToLiveTranscriptionSession,
} from "@/lib/live-transcription-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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
    const { text, sessionId, isFinal } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "text required" }), { status: 400 });
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

    return new Response(JSON.stringify({
      success: true,
      sessionId: resolvedSessionId,
      words: text.split(" ").length,
      isFinal: Boolean(isFinal),
    }));
  } catch (error) {
    return new Response(JSON.stringify({ error: "Live transcription failed" }), { status: 500 });
  }
}
