export const EXTENSION_UPLOAD_SOURCE = "extension";
export const EXTENSION_ALLOWED_SOURCES = new Set(["extension", "live", "web"]);
export const EXTENSION_MAX_TRANSCRIPT_CHARS = 500_000;
export const EXTENSION_MAX_TITLE_CHARS = 200;
export const EXTENSION_MAX_SESSION_ID_CHARS = 120;
export const EXTENSION_MAX_BATCH_CAPTIONS = 250;
export const EXTENSION_MAX_CAPTION_CHARS = 4_000;

export type UploadStatusClass = "needs_reauth" | "rate_limited" | "server_error" | "client_error" | "ok";

const UPLOAD_BACKOFF_MS: readonly number[] = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000];

export function classifyUploadStatus(status: number): UploadStatusClass {
  if (status === 401 || status === 403) return "needs_reauth";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server_error";
  if (status >= 400) return "client_error";
  return "ok";
}

export function backoffDelayMs(attempt: number): number {
  if (!Number.isFinite(attempt) || attempt < 0) return UPLOAD_BACKOFF_MS[0];
  const index = Math.min(Math.floor(attempt), UPLOAD_BACKOFF_MS.length - 1);
  return UPLOAD_BACKOFF_MS[index];
}

export function isValidExtensionSource(source: unknown): boolean {
  return typeof source === "string" && EXTENSION_ALLOWED_SOURCES.has(source);
}

export function sanitizeExtensionTitle(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/[\r\n\t]+/g, " ").trim().slice(0, EXTENSION_MAX_TITLE_CHARS);
}

export function sanitizeSessionId(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[^a-zA-Z0-9_\-:.]+/g, "-")
    .slice(0, EXTENSION_MAX_SESSION_ID_CHARS);
}

export function clampTranscriptText(text: unknown): string {
  if (typeof text !== "string") return "";
  return text
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, EXTENSION_MAX_TRANSCRIPT_CHARS);
}

export interface LiveTranscriptPayload {
  sessionId: string;
  text: string;
  isFinal: boolean;
  meetingTitle?: string;
}

export function buildLiveTranscriptPayload(input: {
  sessionId?: unknown;
  text?: unknown;
  isFinal?: unknown;
  meetingTitle?: unknown;
}): LiveTranscriptPayload | null {
  const text = typeof input.text === "string" ? input.text.trim() : "";
  if (!text) return null;
  const safeSession = sanitizeSessionId(input.sessionId) || "default";
  const title = sanitizeExtensionTitle(input.meetingTitle);
  return {
    sessionId: safeSession,
    text: text.slice(0, EXTENSION_MAX_CAPTION_CHARS),
    isFinal: Boolean(input.isFinal),
    meetingTitle: title || undefined,
  };
}

export interface FinalizeCaption {
  text: string;
  timestamp: string;
}

export interface FinalizePayload {
  sessionId: string;
  meetingTitle: string;
  source: string;
  transcript: string;
  captions: FinalizeCaption[];
}

export function buildFinalizeFormData(input: {
  sessionId?: unknown;
  meetingTitle?: unknown;
  transcript?: unknown;
  captions?: unknown;
}): FinalizePayload | null {
  const safeSession = sanitizeSessionId(input.sessionId);
  const safeTitle = sanitizeExtensionTitle(input.meetingTitle);
  const rawCaptions = Array.isArray(input.captions) ? input.captions : [];
  const normalizedCaptions: FinalizeCaption[] = rawCaptions
    .filter((c): c is { text: unknown; timestamp: unknown } => Boolean(c) && typeof c === "object")
    .slice(0, EXTENSION_MAX_BATCH_CAPTIONS)
    .map((c) => {
      const text = typeof c.text === "string" ? c.text.trim().slice(0, EXTENSION_MAX_CAPTION_CHARS) : "";
      const ts = typeof c.timestamp === "number" && Number.isFinite(c.timestamp)
        ? new Date(c.timestamp).toISOString()
        : new Date().toISOString();
      return { text, timestamp: ts };
    })
    .filter((c) => c.text);

  const finalTranscript = clampTranscriptText(input.transcript);

  if (!finalTranscript && normalizedCaptions.length === 0) return null;

  return {
    sessionId: safeSession,
    meetingTitle: safeTitle,
    source: EXTENSION_UPLOAD_SOURCE,
    transcript: finalTranscript,
    captions: normalizedCaptions,
  };
}

export const UPLOAD_RETRY_POLICY = Object.freeze({
  backoffMs: Object.freeze(UPLOAD_BACKOFF_MS.slice()),
  maxAttempts: UPLOAD_BACKOFF_MS.length,
});
