import { NextRequest } from "next/server";

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

      sendEvent({ type: "connected", sessionId, message: "Live transcription ready" });

      const keepAlive = setInterval(() => {
        sendEvent({ type: "keepalive", timestamp: Date.now() });
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
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

    return new Response(JSON.stringify({
      success: true,
      sessionId,
      words: text.split(" ").length,
      isFinal: isFinal || false,
    }));
  } catch (error) {
    return new Response(JSON.stringify({ error: "Live transcription failed" }), { status: 500 });
  }
}
