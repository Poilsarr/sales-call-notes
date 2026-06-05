"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Radio, Waves } from "lucide-react";

import type { LiveTranscriptionEvent } from "@/lib/live-transcription-bus";

type TranscriptEntry = Extract<LiveTranscriptionEvent, { type: "transcript" }>;

type LiveTranscriptionPanelProps = {
  active: boolean;
  sessionId: string;
};

export function LiveTranscriptionPanel({ active, sessionId }: LiveTranscriptionPanelProps) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">(
    active ? "connecting" : "idle",
  );
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);

  useEffect(() => {
    if (!active) {
      setStatus("idle");
      setEntries([]);
      return;
    }

    setStatus("connecting");
    setEntries([]);

    const eventSource = new EventSource(
      `/api/transcribe/live?sessionId=${encodeURIComponent(sessionId)}`,
    );

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as LiveTranscriptionEvent;

        if (payload.type === "connected") {
          setStatus("connected");
          return;
        }

        if (payload.type === "transcript") {
          setStatus("connected");
          setEntries((current) => [...current, payload].slice(-50));
        }
      } catch {
        setStatus("error");
      }
    };

    eventSource.onerror = () => {
      setStatus("error");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [active, sessionId]);

  const statusLabel = useMemo(() => {
    if (status === "connected") return "Connected";
    if (status === "connecting") return "Connecting";
    if (status === "error") return "Connection lost";
    return "Idle";
  }, [status]);

  return (
    <div className="doppel-outer">
      <div className="doppel-inner p-6 space-y-4 min-h-[320px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/35 mb-2">
              <Waves className="w-3.5 h-3.5" />
              Live Transcription
            </div>
            <h2 className="text-lg font-medium text-white">Caption stream</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Streaming text from the live transcription session in real time.
            </p>
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] ${
              status === "connected"
                ? "bg-emerald-500/10 text-emerald-400"
                : status === "error"
                  ? "bg-red-500/10 text-red-400"
                  : "bg-white/5 text-white/50"
            }`}
          >
            {status === "connecting" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Radio className="w-3.5 h-3.5" />
            )}
            {statusLabel}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/30 mb-2">
            Session
          </div>
          <div className="font-mono text-xs text-white/65 break-all">{sessionId}</div>
        </div>

        {!active ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-zinc-500">
            Start a live session to stream captions here.
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-zinc-500">
            Waiting for transcript segments from the active session.
          </div>
        ) : (
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {entries.map((entry, index) => (
              <div key={`${entry.timestamp}-${index}`} className="rounded-2xl bg-white/[0.03] p-4 border border-white/5">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <span
                    className={`text-[11px] uppercase tracking-[0.16em] ${
                      entry.isFinal ? "text-emerald-400" : "text-yellow-400"
                    }`}
                  >
                    {entry.isFinal ? "Final" : "Interim"}
                  </span>
                  <span className="text-[11px] text-white/30">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">{entry.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
