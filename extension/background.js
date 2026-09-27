/* Gauge - Service worker (Part 3B, slim).
 *
 * The worker NEVER holds audio state: recording lives in the offscreen
 * document (MV3 kills workers after ~30s; MediaStream cannot survive that),
 * and captions live in chrome.storage.local. This file only:
 *   1. relays START/STOP_RECORDING (side panel) -> offscreen document,
 *   2. persists CAPTIONS_UPDATE / MEETING_END batches from content.js,
 *   3. runs the captions finalize POST with alarms for retry (alarms survive
 *      worker death; no setTimeout chains anywhere).
 * Finalize logic keeps the pre-3B shape (queueFinalize / retryPendingFinalize
 * with UPLOAD_BACKOFF_MS backoff), but authenticates with the pasted Bearer
 * key from chrome.storage.session instead of the Clerk cookie.
 */
import {
  MAX_PENDING_CAPTIONS,
  MAX_RETRY_ATTEMPTS,
  MESSAGE_TYPES,
  buildFinalizeEndpoint,
  buildFinalizeTranscriptText,
  classifyUploadStatus,
  createLiveSessionId,
  getApiKeyFromSession,
  nextBackoffDelay,
  normalizeCaptionBatch,
  recordUploadError,
} from "./shared.js";

const STORAGE_DEFAULTS = {
  pendingCaptions: [],
  liveSessionId: null,
  liveMeetingTitle: "",
  lastMeetingSessionId: null,
  lastMeetingCaptions: [],
  lastMeetingTabId: null,
  uploadStatus: { state: "idle", at: 0 },
  authStatus: { state: "unknown", at: 0 },
  pendingRetries: 0,
  lastUploadAt: null,
  lastUploadError: null,
};

const PENDING_FLUSH_KEY = "pendingFinalize";
const FINALIZE_RETRY_DELAY_KEY = "finalizeRetryAt";
const OFFSCREEN_URL = "offscreen.html";

let inFlightFinalize = false;

function hasChrome() {
  return typeof chrome !== "undefined" && !!chrome.runtime;
}

async function getStored(keys) {
  if (!hasChrome() || !chrome.storage?.local) return { ...STORAGE_DEFAULTS };
  return new Promise((resolve) => {
    chrome.storage.local.get({ ...STORAGE_DEFAULTS, ...keys }, (data) => resolve(data));
  });
}

async function setStored(values) {
  if (!hasChrome() || !chrome.storage?.local) return;
  return new Promise((resolve) => {
    chrome.storage.local.set(values, resolve);
  });
}

async function refreshAuthStatus() {
  // Bearer world: "signed in" == a key is present in session storage.
  // The key itself is never copied into local storage or messages.
  const apiKey = await getApiKeyFromSession();
  const state = apiKey ? "signed_in" : "needs_sign_in";
  await setStored({ authStatus: { state, at: Date.now() } });
  return { state };
}

// --- Offscreen lifecycle (lazy: only on the user's Record click) ---
async function ensureOffscreenDocument() {
  if (!hasChrome() || !chrome.offscreen) return false;
  try {
    if (typeof chrome.offscreen.hasDocument === "function") {
      if (await chrome.offscreen.hasDocument()) return true;
    }
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      // USER_MEDIA covers the tab-stream getUserMedia; DISPLAY_MEDIA covers
      // the getDisplayMedia fallback when no tab stream id is available.
      reasons: ["USER_MEDIA", "DISPLAY_MEDIA"],
      justification:
        "Record meeting-tab audio at 32kbps Opus after the user clicks Record. No capture runs otherwise.",
    });
    return true;
  } catch (error) {
    console.warn("[Gauge] offscreen setup failed", error);
    return false;
  }
}

async function getTabStreamId(tabId) {
  // Opportunistic: needs a known meeting tab id (remembered from caption
  // batches). Any failure -> undefined -> offscreen uses getDisplayMedia.
  try {
    if (!hasChrome() || !chrome.tabCapture?.getMediaStreamId) return undefined;
    if (!Number.isInteger(tabId)) return undefined;
    return await new Promise((resolve) => {
      chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => {
        if (chrome.runtime?.lastError) resolve(undefined);
        else resolve(streamId || undefined);
      });
    });
  } catch {
    return undefined;
  }
}

// --- Captions finalize (pre-3B shape, Bearer auth) ---
async function queueFinalize({ sessionId, meetingTitle, captions }) {
  if (inFlightFinalize) return;
  inFlightFinalize = true;
  try {
    const transcript = buildFinalizeTranscriptText(captions);
    if (!transcript) {
      await setStored({ [PENDING_FLUSH_KEY]: null });
      return;
    }
    const apiKey = await getApiKeyFromSession();
    if (!apiKey) {
      await setStored({
        [PENDING_FLUSH_KEY]: { sessionId, meetingTitle, captions, attempts: 0, queuedAt: Date.now() },
      });
      await refreshAuthStatus();
      return;
    }

    await setStored({ uploadStatus: { state: "finalizing", at: Date.now() } });

    const form = new FormData();
    form.set("source", "extension");
    if (sessionId) form.set("sessionId", String(sessionId).slice(0, 120));
    if (meetingTitle) form.set("meetingTitle", String(meetingTitle).slice(0, 200));
    form.set("transcript", transcript);
    form.set("captionsCount", String(captions.length));

    const response = await fetch(buildFinalizeEndpoint(), {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!response.ok) {
      const status = classifyUploadStatus(response.status);
      if (status === "needs_reauth") {
        await recordUploadError(null, "needs_reauth", "API key rejected - paste a fresh key in the side panel");
        await setStored({
          [PENDING_FLUSH_KEY]: { sessionId, meetingTitle, captions, attempts: 0, queuedAt: Date.now() },
        });
        await refreshAuthStatus();
        return;
      }
      const stored = await getStored({});
      const attempts = (stored.finalizeAttempts || 0) + 1;
      if (attempts >= MAX_RETRY_ATTEMPTS) {
        await recordUploadError(null, status, "Finalize failed after max retries");
        await setStored({ [PENDING_FLUSH_KEY]: null, finalizeAttempts: 0 });
        return;
      }
      const delay = nextBackoffDelay(attempts);
      await setStored({
        [PENDING_FLUSH_KEY]: { sessionId, meetingTitle, captions, attempts, queuedAt: Date.now() },
        [FINALIZE_RETRY_DELAY_KEY]: Date.now() + delay,
      });
      chrome.alarms.create("callnote_finalize_retry", { delayInMinutes: Math.max(delay / 60000, 1 / 60) });
      return;
    }

    await setStored({
      [PENDING_FLUSH_KEY]: null,
      finalizeAttempts: 0,
      lastMeetingCaptions: [],
      uploadStatus: { state: "finalized", sessionId, at: Date.now() },
      lastUploadAt: Date.now(),
      lastUploadError: null,
    });
  } catch (error) {
    console.warn("[Gauge] Finalize failed", error);
    await recordUploadError(null, "network_error", error?.message || "network error");
  } finally {
    inFlightFinalize = false;
  }
}

async function retryPendingFinalize() {
  const stored = await getStored({ [PENDING_FLUSH_KEY]: null });
  const pending = stored[PENDING_FLUSH_KEY];
  if (!pending) return;
  await queueFinalize({
    sessionId: pending.sessionId,
    meetingTitle: pending.meetingTitle,
    captions: pending.captions,
  });
}

async function handleCaptionsMessage(message, sender) {
  const data = await getStored({});
  const meetingTitle = message.meetingTitle || data.liveMeetingTitle || "";
  const sessionId = data.liveSessionId || createLiveSessionId(meetingTitle || "meeting");
  const normalizedBatch = normalizeCaptionBatch(message.captions || [], meetingTitle, sessionId);

  const isFinal = message.type === MESSAGE_TYPES.MEETING_END;
  const lastCaptions = isFinal
    ? (data.lastMeetingCaptions || []).concat(normalizedBatch).slice(-MAX_PENDING_CAPTIONS)
    : data.lastMeetingCaptions;
  const pending = isFinal ? [] : data.pendingCaptions.concat(normalizedBatch).slice(-MAX_PENDING_CAPTIONS);

  await setStored({
    pendingCaptions: pending,
    liveSessionId: isFinal ? null : sessionId,
    liveMeetingTitle: isFinal ? "" : meetingTitle,
    lastMeetingSessionId: sessionId,
    lastMeetingCaptions: lastCaptions,
    // Remember the meeting tab so Record can mint a tab stream id later.
    lastMeetingTabId: sender?.tab?.id ?? data.lastMeetingTabId ?? null,
  });

  if (isFinal && lastCaptions.length > 0) {
    await queueFinalize({ sessionId, meetingTitle, captions: lastCaptions });
  }
}

if (hasChrome() && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || typeof message.type !== "string") return false;

    if (message.type === MESSAGE_TYPES.CHECK_AUTH) {
      refreshAuthStatus()
        .then((status) => sendResponse?.({ type: MESSAGE_TYPES.AUTH_STATUS, status }))
        .catch(() => sendResponse?.({ type: MESSAGE_TYPES.AUTH_STATUS, status: { state: "unknown" } }));
      return true;
    }

    if (
      message.type === MESSAGE_TYPES.CAPTIONS_UPDATE ||
      message.type === MESSAGE_TYPES.MEETING_END
    ) {
      handleCaptionsMessage(message, sender).catch((error) => {
        console.warn("[Gauge] Failed to handle captions message", error);
      });
      return false;
    }

    if (message.type === MESSAGE_TYPES.START_RECORDING) {
      (async () => {
        const ready = await ensureOffscreenDocument();
        if (!ready) {
          sendResponse?.({ ok: false, error: "offscreen unavailable" });
          return;
        }
        const stored = await getStored({ lastMeetingTabId: null });
        const streamId = await getTabStreamId(stored.lastMeetingTabId);
        chrome.runtime.sendMessage({
          type: MESSAGE_TYPES.OFFSCREEN_START_AUDIO,
          streamId,
          meetingTitle: message.meetingTitle || stored.liveMeetingTitle || "",
        });
        sendResponse?.({ ok: true, relayed: true });
      })().catch((error) => {
        console.warn("[Gauge] Record relay failed", error);
        sendResponse?.({ ok: false, error: error?.message || "relay failed" });
      });
      return true;
    }

    if (message.type === MESSAGE_TYPES.STOP_RECORDING) {
      chrome.runtime?.sendMessage?.({ type: MESSAGE_TYPES.OFFSCREEN_STOP_AUDIO });
      sendResponse?.({ ok: true, relayed: true });
      return false;
    }

    return false;
  });

  chrome.alarms?.onAlarm?.addListener((alarm) => {
    if (alarm.name === "callnote_finalize_retry") {
      retryPendingFinalize().catch((error) => {
        console.warn("[Gauge] Finalize retry failed", error);
      });
    }
  });

  chrome.runtime.onInstalled?.addListener(() => {
    refreshAuthStatus().catch(() => {});
  });
  chrome.runtime.onStartup?.addListener(() => {
    refreshAuthStatus().catch(() => {});
  });
}
