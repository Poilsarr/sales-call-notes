"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";

interface TranscriptLine {
  text: string;
  speaker: string;
  isFinal: boolean;
}

export default function LivePage() {
  const { isLoaded } = useAuth();
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<TranscriptLine[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string>(
    typeof crypto !== "undefined" ? crypto.randomUUID() : "default",
  );
  const expiresAtRef = useRef<number>(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ponytail: stopAll first — openDeepgram references it
  const stopAll = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "CloseStream" }));
      wsRef.current.close();
    }
    wsRef.current = null;
    setListening(false);
  }, []);

  const openDeepgram = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/transcribe/token");
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        (body as { error?: string }).error ?? `Token fetch ${res.status}`,
      );
    }
    const { token, expiresAt } = (await res.json()) as {
      token: string;
      expiresAt: number;
    };
    expiresAtRef.current = expiresAt;

    const ws = new WebSocket(
      `wss://api.deepgram.com/v1/listen?token=${token}`,
    );
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "Start",
          model: "nova-2",
          diarize: true,
          smart_format: true,
          interim_results: true,
          encoding: "linear16",
          sample_rate: 16000,
          channels: 1,
          punctuate: true,
        }),
      );
    };

    ws.onmessage = (evt) => {
      const msg = JSON.parse(
        typeof evt.data === "string" ? evt.data : new TextDecoder().decode(evt.data),
      ) as {
        type?: string;
        channel?: {
          alternatives?: Array<{
            transcript?: string;
            words?: Array<{ speaker?: number }>;
          }>;
        };
        is_final?: boolean;
      };

      if (msg.type !== "Results") return;
      const alt = msg.channel?.alternatives?.[0];
      const text = alt?.transcript?.trim();
      if (!text) return;

      const speakerId = alt?.words?.[0]?.speaker;
      const speaker =
        typeof speakerId === "number"
          ? `Speaker ${String.fromCharCode(65 + speakerId)}`
          : "Speaker";

      const isFinal = Boolean(msg.is_final);

      setLines((prev) => {
        // ponytail: replace last interim with final, or append new final
        if (!isFinal) {
          const last = prev[prev.length - 1];
          if (last && !last.isFinal) {
            return [...prev.slice(0, -1), { text, speaker, isFinal: false }];
          }
          return [...prev, { text, speaker, isFinal: false }];
        }
        const last = prev[prev.length - 1];
        const base = last && !last.isFinal ? prev.slice(0, -1) : prev;
        return [...base, { text, speaker, isFinal: true }];
      });

      if (isFinal) {
        fetch("/api/transcribe/live", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            sessionId: sessionIdRef.current,
            isFinal: true,
          }),
        }).catch(() => {
          /* ponytail: fire-and-forget; SSE subscribers tolerate misses */
        });
      }
    };

    ws.onerror = () => setError("WebSocket error");
    ws.onclose = () => {
      if (streamRef.current && streamRef.current.active) {
        const ttl = expiresAtRef.current - Date.now();
        if (ttl < 30_000) {
          reconnectTimerRef.current = setTimeout(() => {
            openDeepgram().catch((e: Error) => setError(e.message));
          }, 500);
        } else {
          setError("WebSocket closed unexpectedly");
          stopAll();
        }
      }
    };

    wsRef.current = ws;
  }, [stopAll]);

  const startMic = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const ctx = new AudioContext({ sampleRate: 16000 });
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    // ponytail: ScriptProcessor 4096 — simple, works everywhere; AudioWorklet is the upgrade
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    proc.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const pcm16 = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      wsRef.current?.send(pcm16.buffer);
    };
    source.connect(proc);
    proc.connect(ctx.destination);
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  const toggle = async () => {
    if (listening) {
      stopAll();
      return;
    }
    try {
      await openDeepgram();
      await startMic();
      setListening(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p className="text-zinc-400">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-900 text-white p-6 md:p-12 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Live Transcription</h1>

      <button
        type="button"
        onClick={toggle}
        className={`px-6 py-3 rounded-md font-medium transition ${
          listening
            ? "bg-red-600 hover:bg-red-500"
            : "bg-emerald-600 hover:bg-emerald-500"
        }`}
      >
        {listening ? "Stop" : "Start"}
      </button>

      {error && (
        <p className="mt-4 text-red-400 text-sm">{error}</p>
      )}

      <div className="mt-8 border border-zinc-700 rounded-md p-4 min-h-[40vh] bg-zinc-800/50 overflow-y-auto">
        {lines.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            {listening ? "Listening…" : "Transcript will appear here."}
          </p>
        ) : (
          lines.map((line, i) => (
            <p
              key={i}
              className={`text-sm mb-1 ${
                line.isFinal ? "text-white" : "text-zinc-400 italic"
              }`}
            >
              <span className="text-zinc-500 mr-2">{line.speaker}</span>
              {line.text}
            </p>
          ))
        )}
      </div>
    </main>
  );
}
