export const APP_BASE_URL = "https://usegauge.vercel.app";
export const AUTH_COOKIE_NAME = "__session";
export const AUTH_STATUS_KEY = "authStatus";
export const UPLOAD_STATUS_KEY = "uploadStatus";
export const UPLOAD_BACKOFF_MS = [1000, 2000, 4000, 8000, 16000, 30000];
export const MAX_PENDING_CAPTIONS = 500;
export const MAX_CAPTION_CHARS = 4000;
export const MAX_TRANSCRIPT_CHARS = 500000;
export const MAX_RETRY_ATTEMPTS = UPLOAD_BACKOFF_MS.length;

const PENDING_RETRY_KEY = "pendingRetries";
const LAST_UPLOAD_KEY = "lastUploadAt";
const LAST_ERROR_KEY = "lastUploadError";

function slugifyMeetingTitle(meetingTitle = "") {
  return meetingTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "meeting";
}

export function createLiveSessionId(meetingTitle = "", now = Date.now()) {
  return `ext-${slugifyMeetingTitle(meetingTitle)}-${now}`;
}

export function buildLiveRecordUrl(sessionId) {
  return `${APP_BASE_URL}/app/record?liveSessionId=${encodeURIComponent(sessionId)}&source=extension`;
}

export function buildLiveTranscriptionEndpoint() {
  return `${APP_BASE_URL}/api/transcribe/live`;
}

export function buildFinalizeEndpoint() {
  return `${APP_BASE_URL}/api/transcribe`;
}

export function buildSignInUrl(returnTo = "/app/record?source=extension") {
  return `${APP_BASE_URL}/sign-in?redirect_url=${encodeURIComponent(returnTo)}`;
}

export function normalizeCaptionBatch(captions = [], meetingTitle = "", sessionId = "ext-meeting") {
  return captions
    .filter((caption) => caption && typeof caption.text === "string" && caption.text.trim())
    .map((caption) => ({
      text: caption.text.trim().slice(0, MAX_CAPTION_CHARS),
      meetingTitle,
      sessionId,
      timestamp: new Date(caption.timestamp).toISOString(),
    }));
}

export function classifyUploadStatus(status) {
  if (status === 401 || status === 403) return "needs_reauth";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server_error";
  if (status >= 400) return "client_error";
  return "ok";
}

export function nextBackoffDelay(attempt) {
  if (!Number.isFinite(attempt) || attempt < 0) return UPLOAD_BACKOFF_MS[0];
  const index = Math.min(Math.floor(attempt), UPLOAD_BACKOFF_MS.length - 1);
  return UPLOAD_BACKOFF_MS[index];
}

export async function getClerkSessionToken() {
  if (!chrome?.cookies?.get) return null;
  try {
    const cookie = await chrome.cookies.get({
      url: APP_BASE_URL,
      name: AUTH_COOKIE_NAME,
    });
    if (cookie && cookie.value) return cookie.value;
  } catch (error) {
    console.warn("[Gauge] Failed to read Clerk session cookie", error);
  }
  return null;
}

export function buildAuthHeaders(token) {
  if (!token) return { "Content-Type": "application/json" };
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export function buildLiveCaptionPayload(caption) {
  if (!caption || typeof caption.text !== "string" || !caption.text.trim()) return null;
  return {
    sessionId: caption.sessionId || "ext-meeting",
    text: caption.text.trim().slice(0, MAX_CAPTION_CHARS),
    isFinal: Boolean(caption.isFinal),
  };
}

export function buildFinalizeTranscriptText(captions = []) {
  if (!Array.isArray(captions) || captions.length === 0) return "";
  const joined = captions
    .filter((c) => c && typeof c.text === "string" && c.text.trim())
    .map((c) => c.text.trim())
    .join("\n");
  return joined.slice(0, MAX_TRANSCRIPT_CHARS);
}

export function buildFinalizeFormData({ sessionId, meetingTitle, transcript, captions }) {
  const form = new FormData();
  form.set("source", "extension");
  if (sessionId) form.set("sessionId", String(sessionId).slice(0, 120));
  if (meetingTitle) form.set("meetingTitle", String(meetingTitle).slice(0, 200));
  if (transcript) form.set("transcript", String(transcript).slice(0, MAX_TRANSCRIPT_CHARS));
  if (Array.isArray(captions) && captions.length > 0) {
    form.set("captionsCount", String(captions.length));
  }
  return form;
}

export async function recordUploadSuccess(storage, count) {
  if (!chrome?.storage?.local) return;
  await new Promise((resolve) => {
    chrome.storage.local.set(
      {
        [UPLOAD_STATUS_KEY]: { state: "success", count, at: Date.now() },
        [LAST_UPLOAD_KEY]: Date.now(),
        [LAST_ERROR_KEY]: null,
        [PENDING_RETRY_KEY]: 0,
      },
      resolve,
    );
  });
  void storage;
}

export async function recordUploadError(storage, status, message) {
  if (!chrome?.storage?.local) return;
  await new Promise((resolve) => {
    chrome.storage.local.set(
      {
        [UPLOAD_STATUS_KEY]: {
          state: "error",
          status,
          message: message || null,
          at: Date.now(),
        },
        [LAST_ERROR_KEY]: { status, message: message || null, at: Date.now() },
      },
      resolve,
    );
  });
  void storage;
}

export async function recordUploadPending(storage, attempts) {
  if (!chrome?.storage?.local) return;
  await new Promise((resolve) => {
    chrome.storage.local.set(
      {
        [UPLOAD_STATUS_KEY]: { state: "uploading", attempts, at: Date.now() },
        [PENDING_RETRY_KEY]: attempts,
      },
      resolve,
    );
  });
  void storage;
}
