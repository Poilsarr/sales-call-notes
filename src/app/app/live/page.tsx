'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Mic, Square, Copy, Check, Save, Loader2, AlertCircle, Radio, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import type { LiveTranscriptionEvent } from '@/lib/live-transcription-bus';

type TranscriptEntry = Extract<LiveTranscriptionEvent, { type: 'transcript' }>;

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
    length: number;
  }>;
};

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `live-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function deriveFinalText(entries: TranscriptEntry[]): string {
  return entries
    .filter((entry) => entry.isFinal)
    .map((entry) => entry.text.trim())
    .filter((text) => text.length > 0)
    .join(' ');
}

function statusLabel(status: ConnectionStatus): string {
  if (status === 'connected') return 'Live';
  if (status === 'connecting') return 'Connecting';
  if (status === 'error') return 'Disconnected';
  return 'Idle';
}

function statusClasses(status: ConnectionStatus, isRecording: boolean): string {
  if (isRecording && status === 'connected') {
    return 'bg-[#F26522]/10 text-[#F26522]';
  }
  if (status === 'error') {
    return 'bg-red-500/10 text-red-600';
  }
  if (status === 'connecting') {
    return 'bg-amber-500/10 text-amber-700';
  }
  return 'bg-black/[0.04] text-zinc-500';
}

export default function LiveTranscriptionPage() {
  const { user } = useUser();
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [interim, setInterim] = useState('');
  const [duration, setDuration] = useState(0);
  const [savedCallId, setSavedCallId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const sessionIdRef = useRef<string>(generateSessionId());
  const isRecordingRef = useRef(false);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const recognitionActiveRef = useRef(false);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    }
  }, [entries, interim]);

  const cleanupSession = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    recognitionActiveRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      cleanupSession();
    };
  }, [cleanupSession]);

  const publishTranscript = useCallback(async (text: string, isFinal: boolean) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const sessionId = sessionIdRef.current;
    try {
      const response = await fetch('/api/transcribe/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, text: trimmed, isFinal }),
      });
      if (!response.ok) {
        throw new Error(`Live publish failed (${response.status})`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      toast.error(`Could not publish transcript: ${message}`);
    }
  }, []);

  const subscribeToStream = useCallback(() => {
    const sessionId = sessionIdRef.current;
    setStatus('connecting');

    const eventSource = new EventSource(
      `/api/transcribe/live?sessionId=${encodeURIComponent(sessionId)}`,
    );
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setStatus('connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as LiveTranscriptionEvent;
        if (payload.type === 'connected') {
          setStatus('connected');
          return;
        }
        if (payload.type === 'keepalive') {
          return;
        }
        if (payload.type === 'transcript') {
          setStatus('connected');
          setEntries((current) => {
            const next = [...current, payload];
            return next.slice(-150);
          });
          if (payload.isFinal) {
            setInterim('');
          } else {
            setInterim(payload.text);
          }
        }
      } catch {
        setStatus('error');
      }
    };

    eventSource.onerror = () => {
      setStatus('error');
      eventSource.close();
      if (eventSourceRef.current === eventSource) {
        eventSourceRef.current = null;
      }
    };
  }, []);

  const startRecognition = useCallback(() => {
    const speechWindow = window as Window & {
      SpeechRecognition?: new () => BrowserSpeechRecognition;
      webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
    };
    const RecognitionCtor =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      return false;
    }

    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim();
        if (!transcript) continue;
        void publishTranscript(transcript, result.isFinal);
      }
    };

    recognition.onerror = (event) => {
      const code = event?.error;
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        toast.error('Microphone permission denied for live captions. Recording still saves to disk.');
        return;
      }
      if (code === 'no-speech') {
        return;
      }
      if (code === 'audio-capture') {
        toast.error('No microphone available for live captions. Recording still saves to disk.');
        return;
      }
      if (code === 'network') {
        toast.error('Network error during live captions. Recording still saves to disk.');
        return;
      }
      if (code === 'aborted') {
        return;
      }
      toast.error('Live caption stream interrupted. Recording still saves to disk.');
    };

    recognition.onend = () => {
      recognitionActiveRef.current = false;
      if (isRecordingRef.current) {
        try {
          recognition.start();
          recognitionActiveRef.current = true;
        } catch {
          recognitionActiveRef.current = false;
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      recognitionActiveRef.current = true;
      return true;
    } catch {
      recognitionActiveRef.current = false;
      return false;
    }
  }, [publishTranscript]);

  const startSession = useCallback(async () => {
    if (isRecordingRef.current) return;
    setMicError(null);
    setSavedCallId(null);
    setEntries([]);
    setInterim('');
    setDuration(0);

    const newSessionId = generateSessionId();
    sessionIdRef.current = newSessionId;

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicError('This browser does not support microphone capture.');
      toast.error('Microphone API not available in this browser');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      const name = (error as { name?: string })?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setMicError('Microphone permission was denied. Enable it in browser settings to start a live session.');
        toast.error('Microphone permission denied');
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setMicError('No microphone was detected on this device.');
        toast.error('No microphone detected');
      } else {
        setMicError('Could not access the microphone. Please try again.');
        toast.error('Could not access the microphone');
      }
      return;
    }
    streamRef.current = stream;

    let recorder: MediaRecorder | null = null;
    try {
      recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.onerror = () => {
        toast.error('Recording error — please retry');
      };
      recorder.start(1000);
    } catch (error) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      const message = error instanceof Error ? error.message : 'Unknown error';
      setMicError(`MediaRecorder unavailable: ${message}`);
      toast.error('MediaRecorder is not supported in this browser');
      return;
    }

    subscribeToStream();

    const speechAvailable = startRecognition();
    if (!speechAvailable) {
      toast.message(
        'Live captioning uses your browser speech engine. The panel will still receive any captions from the extension.',
      );
    }

    setIsRecording(true);
    isRecordingRef.current = true;
    durationTimerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    toast.success('Live session started');
  }, [startRecognition, subscribeToStream]);

  const persistSession = useCallback(
    async (text: string, finalDuration: number) => {
      if (!user?.id) {
        toast.error('Sign in to save the session transcript');
        return;
      }
      if (!text) {
        return;
      }
      setIsSaving(true);
      try {
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const response = await fetch('/api/calls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: `Live session ${stamp}.txt`,
            transcript: text,
            sessionId: sessionIdRef.current,
            duration: finalDuration,
            source: 'live',
          }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to save session');
        }
        const data = await response.json();
        setSavedCallId(data.id);
        toast.success('Session saved to your calls');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save session';
        toast.error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [user?.id],
  );

  const stopSession = useCallback(() => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;
    setIsRecording(false);
    setStatus((current) => (current === 'error' ? current : 'idle'));

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    let recordedDuration = 0;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const recorder = mediaRecorderRef.current;
      try {
        recorder.stop();
      } catch {}
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    recordedDuration = duration;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const finalText = deriveFinalText(entries).trim();
    if (finalText) {
      void persistSession(finalText, recordedDuration);
    } else {
      toast.message('Session ended — no transcript text to save');
    }
    setInterim('');
    setDuration(0);
  }, [duration, entries, persistSession]);

  const handleToggle = useCallback(() => {
    if (isRecordingRef.current) {
      stopSession();
    } else {
      void startSession();
    }
  }, [startSession, stopSession]);

  const copyTranscript = useCallback(async () => {
    const text = deriveFinalText(entries);
    if (!text) {
      toast.error('No transcript to copy yet');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
      toast.success('Transcript copied to clipboard');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }, [entries]);

  const finalText = deriveFinalText(entries);
  const hasTranscript = finalText.length > 0;
  const canCopy = hasTranscript && !isRecording;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#F26522] mb-3">
            <Radio className="w-3.5 h-3.5" />
            Live transcription
          </div>
          <h1 className="text-3xl font-semibold text-white mb-2">Capture a call in real time</h1>
          <p className="text-zinc-500 max-w-2xl">
            Stream audio from your microphone and see captions appear instantly. The transcript is
            saved to your calls library when you stop.
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium ${statusClasses(status, isRecording)}`}
        >
          {status === 'connecting' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isRecording ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#F26522] opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F26522]" />
            </span>
          ) : (
            <Radio className="w-3.5 h-3.5" />
          )}
          {statusLabel(status)}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="doppel-outer-dark"
      >
        <div className="doppel-inner-dark p-10 flex flex-col items-center justify-center text-center">
          <motion.div
            animate={isRecording ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={{ repeat: isRecording ? Infinity : 0, duration: 1.4 }}
            className="mb-6"
          >
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors ${
                isRecording ? 'bg-[#F26522]/15' : 'bg-white/[0.04]'
              }`}
            >
              {isRecording ? (
                <div className="relative flex items-center justify-center">
                  <span className="absolute inline-flex h-16 w-16 rounded-full bg-[#F26522]/30 animate-ping" />
                  <Square className="relative w-9 h-9 text-[#F26522]" />
                </div>
              ) : (
                <Mic className="w-10 h-10 text-zinc-400" />
              )}
            </div>
          </motion.div>

          <p className="text-2xl font-mono text-white mb-2">{formatDuration(duration)}</p>
          <p className="text-xs text-zinc-500 mb-6 max-w-md">
            {isRecording
              ? 'Listening — speak naturally. Captions appear below as you talk.'
              : 'Click start to capture microphone audio and stream live captions.'}
          </p>

          <button
            type="button"
            onClick={handleToggle}
            className={`px-8 py-3 rounded-full font-medium text-white transition-all active:scale-[0.98] ${
              isRecording
                ? 'bg-[#F26522] hover:bg-[#e05a1a]'
                : 'bg-white/5 hover:bg-white/10 border border-white/10'
            }`}
          >
            {isRecording ? 'Stop session' : 'Start live session'}
          </button>

          {micError ? (
            <div className="mt-6 flex items-start gap-2 text-sm text-red-600 max-w-md text-left">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{micError}</span>
            </div>
          ) : null}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
        className="doppel-outer-dark"
      >
        <div className="doppel-inner-dark p-6">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-zinc-500 mb-1">
                <Radio className="w-3.5 h-3.5" />
                Live transcript
              </div>
              <h2 className="text-lg font-medium text-white">Caption stream</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Segments streamed from the active live transcription session.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void copyTranscript()}
                disabled={!canCopy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-white/10 text-white/60 hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {copyState === 'copied' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copyState === 'copied' ? 'Copied' : 'Copy transcript'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-800/20 p-1">
            <div
              ref={scrollRef}
              className="h-[420px] overflow-y-auto px-4 py-4 space-y-3"
            >
              {!isRecording && entries.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <Mic className="w-8 h-8 text-zinc-400 mb-3" />
                  <p className="text-sm text-zinc-500">
                    Start a session to begin streaming live captions.
                  </p>
                </div>
              ) : entries.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <Loader2 className="w-6 h-6 text-zinc-400 mb-3 animate-spin" />
                  <p className="text-sm text-zinc-500">
                    Listening for the first caption…
                  </p>
                </div>
              ) : (
                <>
                  {entries.map((entry, index) => (
                    <div
                      key={`${entry.timestamp}-${index}`}
                      className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span
                          className={`text-[10px] uppercase tracking-[0.18em] ${
                            entry.isFinal ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          {entry.isFinal ? 'Final' : 'Interim'}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-200 leading-relaxed">{entry.text}</p>
                    </div>
                  ))}
                  {interim ? (
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className="text-[10px] uppercase tracking-[0.18em] text-amber-600">
                          Interim
                        </span>
                      </div>
                      <p className="text-sm text-amber-300 leading-relaxed italic">{interim}</p>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap text-xs text-zinc-500">
            <span>
              Session: <span className="font-mono text-zinc-400">{sessionIdRef.current}</span>
            </span>
            <span>{entries.filter((entry) => entry.isFinal).length} final segments</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
        className="doppel-outer-dark"
      >
        <div className="doppel-inner-dark p-6">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F26522]/10 flex items-center justify-center shrink-0">
              <Save className="w-4 h-4 text-[#F26522]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-medium text-white mb-1">Session output</h2>
              {isSaving ? (
                <p className="text-sm text-zinc-500 inline-flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving transcript to your calls…
                </p>
              ) : savedCallId ? (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm text-zinc-500">
                    Saved as a new call in your library. Final length: {finalText.split(/\s+/).filter(Boolean).length} words.
                  </p>
                  <Link
                    href={`/app/calls/${savedCallId}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#F26522] hover:text-[#e05a1a] transition-colors"
                  >
                    Open call
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  Stop the session to save the transcript. The full final text is written to your
                  calls library and indexed for search.
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
