export const APP_BASE_URL = "https://usegauge.vercel.app";
// Part 3B: canonical app origin. APP_BASE_URL is kept as an alias so the
// pre-3B caption pipeline keeps working; new code should use APP_ORIGIN.
export const APP_ORIGIN = APP_BASE_URL;
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

function getChrome() {
  // typeof-guard: this module is also imported by vitest (Node) where the
  // `chrome` global does not exist. A bare `chrome?.` reference would throw
  // ReferenceError there, so every chrome touch goes through here.
  return typeof chrome !== "undefined" ? chrome : undefined;
}

export async function getClerkSessionToken() {
  const c = getChrome();
  if (!c?.cookies?.get) return null;
  try {
    const cookie = await c.cookies.get({
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
  const c = getChrome();
  if (!c?.storage?.local) return;
  await new Promise((resolve) => {
    c.storage.local.set(
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
  const c = getChrome();
  if (!c?.storage?.local) return;
  await new Promise((resolve) => {
    c.storage.local.set(
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
  const c = getChrome();
  if (!c?.storage?.local) return;
  await new Promise((resolve) => {
    c.storage.local.set(
      {
        [UPLOAD_STATUS_KEY]: { state: "uploading", attempts, at: Date.now() },
        [PENDING_RETRY_KEY]: attempts,
      },
      resolve,
    );
  });
  void storage;
}

// ---------------------------------------------------------------------------
// Part 3B: Bearer-key + meeting-audio capture protocol.
//
// Contract with Executor A (backend, NOT created here): a Bearer key shaped
// `cn_live_…` / `cn_test_…` in the Authorization header is accepted on
// /api/upload-url, /api/analyze and /api/v1/calls. Until that backend lands,
// every network path below degrades to manual-upload instructions instead of
// failing silently (see buildManualUploadInstructions).
// Key provenance (docs-only reference): users mint the key via
// POST /api/v1/keys/exchange. The extension never calls that endpoint — the
// user pastes the key into the side panel, which keeps it in
// chrome.storage.session (memory-only, never chrome.storage.local).
// ---------------------------------------------------------------------------

// Runtime message contract shared by content.js / background.js /
// offscreen.js / sidepanel.js. content.js keeps a mirrored copy (it cannot
// use ES modules); keep the string values in sync.
export const MESSAGE_TYPES = {
  CAPTIONS_UPDATE: "CAPTIONS_UPDATE",
  MEETING_END: "MEETING_END",
  START_RECORDING: "START_RECORDING",
  STOP_RECORDING: "STOP_RECORDING",
  RECORDING_STATUS: "RECORDING_STATUS",
  OFFSCREEN_START_AUDIO: "OFFSCREEN_START_AUDIO",
  OFFSCREEN_STOP_AUDIO: "OFFSCREEN_STOP_AUDIO",
  OFFSCREEN_CHUNK: "OFFSCREEN_CHUNK",
  OFFSCREEN_DONE: "OFFSCREEN_DONE",
  OFFSCREEN_ERROR: "OFFSCREEN_ERROR",
  CHECK_AUTH: "CHECK_AUTH",
  AUTH_STATUS: "AUTH_STATUS",
};

// --- Endpoints (Bearer `cn_live_` / `cn_test_`) ---
export function buildUploadUrlEndpoint() {
  // POST { filename, fileSize, contentType } -> { presignedUrl, blobUrl, pathname, contentType }
  return `${APP_ORIGIN}/api/upload-url`;
}

export function buildAnalyzeEndpoint() {
  // POST { blobUrl, filename, ... } -> { id, summary, actionItems, ... } (incl. id)
  return `${APP_ORIGIN}/api/analyze`;
}

export function buildCallsEndpoint() {
  // GET Bearer -> { calls: [{ id, filename, createdAt, healthScore, duration, source }] }
  return `${APP_ORIGIN}/api/v1/calls`;
}

export function buildCallDetailUrl(callId) {
  return `${APP_ORIGIN}/app/calls/${encodeURIComponent(String(callId))}`;
}

export function buildKeysExchangeDocsUrl() {
  // Docs-only reference. Executor A owns POST /api/v1/keys/exchange; the
  // extension must NOT call it — users paste a minted key into the panel.
  return `${APP_ORIGIN}/api-docs/v1#post-api-v1-keys-exchange`;
}

// --- Bearer API key (session storage only, never local) ---
export const API_KEY_SESSION_KEY = "gaugeApiKey";
export const API_KEY_PREFIXES = ["cn_live_", "cn_test_"];

export function isValidApiKeyFormat(key) {
  return (
    typeof key === "string" &&
    API_KEY_PREFIXES.some((prefix) => key.startsWith(prefix) && key.length > prefix.length + 8)
  );
}

export function buildBearerHeaders(apiKey, extra = {}) {
  return {
    "Content-Type": "application/json",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    ...extra,
  };
}

export async function getApiKeyFromSession() {
  const c = getChrome();
  if (!c?.storage?.session?.get) return null;
  try {
    const data = await c.storage.session.get({ [API_KEY_SESSION_KEY]: null });
    const key = data?.[API_KEY_SESSION_KEY];
    return typeof key === "string" && key ? key : null;
  } catch (error) {
    console.warn("[Gauge] Failed to read session API key", error);
    return null;
  }
}

export async function setApiKeyInSession(apiKey) {
  const c = getChrome();
  if (!c?.storage?.session?.set) return false;
  try {
    if (!apiKey) {
      await c.storage.session.remove(API_KEY_SESSION_KEY);
      return true;
    }
    // Session storage only — the key lives in memory and never hits disk.
    await c.storage.session.set({ [API_KEY_SESSION_KEY]: apiKey });
    return true;
  } catch (error) {
    console.warn("[Gauge] Failed to write session API key", error);
    return false;
  }
}

// --- Audio capture constants (32kbps Opus, chunked) ---
export const AUDIO_BITRATE_BPS = 32000;
export const AUDIO_MIME_TYPE = "audio/webm;codecs=opus";
export const AUDIO_CONTENT_TYPE = "audio/webm";
export const CHUNK_TIMESLICE_MS = 10000;
export const CHUNK_SIZE_BYTES = 256 * 1024;

// --- Pure chunk-index math (no chrome/DOM access; unit-tested) ---
export function chunkIndexForByteOffset(offset, chunkSize = CHUNK_SIZE_BYTES) {
  if (!Number.isFinite(offset) || offset < 0) return 0;
  if (!Number.isFinite(chunkSize) || chunkSize <= 0) return 0;
  return Math.floor(offset / chunkSize);
}

export function byteOffsetForChunk(index, chunkSize = CHUNK_SIZE_BYTES) {
  if (!Number.isFinite(index) || index < 0) return 0;
  if (!Number.isFinite(chunkSize) || chunkSize <= 0) return 0;
  return Math.floor(index) * chunkSize;
}

export function totalChunks(totalBytes, chunkSize = CHUNK_SIZE_BYTES) {
  if (!Number.isFinite(totalBytes) || totalBytes <= 0) return 0;
  if (!Number.isFinite(chunkSize) || chunkSize <= 0) return 0;
  return Math.ceil(totalBytes / chunkSize);
}

export function getChunkPlan(totalBytes, chunkSize = CHUNK_SIZE_BYTES) {
  const count = totalChunks(totalBytes, chunkSize);
  const plan = [];
  for (let index = 0; index < count; index += 1) {
    const start = byteOffsetForChunk(index, chunkSize);
    plan.push({ index, start, end: Math.min(start + chunkSize, totalBytes) });
  }
  return plan;
}

// --- Banner HTML (pure; always escape user-controlled meeting titles) ---
export const CONSENT_BANNER_ID = "gauge-consent-banner";

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildConsentBannerHtml(meetingTitle = "") {
  const safeTitle = escapeHtml(meetingTitle || "this meeting");
  return (
    `<span style="font-weight:700;margin-right:8px;">&#9679; REC</span>` +
    `<span>Gauge is recording ${safeTitle}. Captions + audio are captured for AI notes.</span>`
  );
}

// --- Defensive caption DOM adapter (version-pinned) ---
// Only aria-live regions + document.title are read. No CSS-class selectors:
// Meet's hashed class names rotate on every deploy and must never be a
// dependency. content.js mirrors this object (content scripts cannot import
// ES modules) — keep DOM_ADAPTER_VERSION identical in both files.
export const DOM_ADAPTER_VERSION = "2026-09-27-p3b";
export const DOM_ADAPTER = {
  version: DOM_ADAPTER_VERSION,
  captionSelectors: [
    '[aria-live="polite"]',
    '[aria-live="assertive"]',
    '[role="log"]',
    "[aria-live]",
  ],
  titleSources: ["document.title"],
};

export function findCaptionRoots(doc) {
  const root =
    doc || (typeof document !== "undefined" ? document : undefined);
  if (!root || typeof root.querySelectorAll !== "function") return [];
  const seen = new Set();
  const matches = [];
  for (const selector of DOM_ADAPTER.captionSelectors) {
    let nodes = [];
    try {
      nodes = root.querySelectorAll(selector);
    } catch {
      continue;
    }
    for (const node of nodes) {
      if (node && !seen.has(node)) {
        seen.add(node);
        matches.push(node);
      }
    }
  }
  return matches;
}

export function extractCaptionText(root) {
  if (!root) return "";
  const text = typeof root.innerText === "string" ? root.innerText : root.textContent || "";
  return String(text).replace(/\s+/g, " ").trim().slice(0, MAX_CAPTION_CHARS);
}

export function getMeetingTitle(doc) {
  const rootDoc = doc || (typeof document !== "undefined" ? document : undefined);
  try {
    const title = rootDoc?.title;
    if (typeof title === "string" && title.trim()) return title.trim().slice(0, 200);
  } catch {
    // cross-origin / detached document — fall through
  }
  return "";
}

// --- Retry helper with injectable fetch (pure apart from the fetch impl) ---
export async function fetchWithBackoff(url, options = {}, config = {}) {
  const {
    attempts = MAX_RETRY_ATTEMPTS,
    delayFor = nextBackoffDelay,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    fetchImpl = typeof fetch !== "undefined" ? fetch : undefined,
  } = config;
  if (!fetchImpl) throw new Error("fetch is not available");
  let lastError = null;
  const maxAttempts = Math.max(1, Math.min(attempts, MAX_RETRY_ATTEMPTS));
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, options);
      if (response && typeof response.status === "number") {
        const kind = classifyUploadStatus(response.status);
        if (kind === "ok") return response;
        if (kind === "needs_reauth" || kind === "client_error") return response;
        lastError = new Error(`upload failed with status ${response.status}`);
      } else {
        return response;
      }
    } catch (error) {
      lastError = error;
    }
    if (attempt < maxAttempts - 1) {
      await sleep(delayFor(attempt));
    }
  }
  throw lastError || new Error("upload failed");
}

// --- Degradation path: backend not yet merged -> manual upload steps ---
export function buildManualUploadInstructions(callUrl = "") {
  const where = callUrl ? ` at ${callUrl}` : " in the Gauge dashboard";
  return (
    "Automatic upload is unavailable (the API-key backend is not enabled yet). " +
    "Manual fallback: 1) stop the recording, 2) download the captured audio, " +
    `3) upload it by hand${where}. Your captions are still saved locally by the extension.`
  );
}
