import {
  APP_BASE_URL,
  MAX_PENDING_CAPTIONS,
  MAX_RETRY_ATTEMPTS,
  buildAuthHeaders,
  buildFinalizeEndpoint,
  buildFinalizeFormData,
  buildFinalizeTranscriptText,
  buildLiveCaptionPayload,
  buildLiveTranscriptionEndpoint,
  classifyUploadStatus,
  createLiveSessionId,
  getClerkSessionToken,
  nextBackoffDelay,
  normalizeCaptionBatch,
  recordUploadError,
  recordUploadPending,
  recordUploadSuccess,
} from "./shared.js";

const STORAGE_DEFAULTS = {
  pendingCaptions: [],
  liveSessionId: null,
  liveMeetingTitle: "",
  lastMeetingSessionId: null,
  lastMeetingCaptions: [],
  uploadStatus: { state: "idle", at: 0 },
  authStatus: { state: "unknown", at: 0 },
  pendingRetries: 0,
  lastUploadAt: null,
  lastUploadError: null,
};

const PENDING_FLUSH_KEY = "pendingFinalize";
const FINALIZE_RETRY_DELAY_KEY = "finalizeRetryAt";

let inFlightAuthCheck = null;
let inFlightFinalize = false;

async function getStored(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get({ ...STORAGE_DEFAULTS, ...keys }, (data) => resolve(data));
  });
}

async function setStored(values) {
  return new Promise((resolve) => {
    chrome.storage.local.set(values, resolve);
  });
}

async function refreshAuthStatus(force = false) {
  if (!force && inFlightAuthCheck) return inFlightAuthCheck;
  inFlightAuthCheck = (async () => {
    const token = await getClerkSessionToken();
    const state = token ? "signed_in" : "needs_sign_in";
    await setStored({ authStatus: { state, at: Date.now() } });
    return { state, token };
  })();
  try {
    return await inFlightAuthCheck;
  } finally {
    inFlightAuthCheck = null;
  }
}

async function uploadLiveCaption(caption, token) {
  const payload = buildLiveCaptionPayload(caption);
  if (!payload) return { ok: true, skipped: true };
  const response = await fetch(buildLiveTranscriptionEndpoint(), {
    method: "POST",
    headers: buildAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const status = classifyUploadStatus(response.status);
    return { ok: false, status, code: response.status };
  }
  return { ok: true, code: response.status };
}

async function uploadLiveBatch(captions, token) {
  if (captions.length === 0) return;
  const results = await Promise.all(
    captions.map((caption) => uploadLiveCaption(caption, token).catch((error) => {
      console.warn("[Gauge] Caption upload failed", error);
      return { ok: false, status: "network_error", message: error?.message || "network" };
    })),
  );

  const hasReauth = results.some((r) => r.status === "needs_reauth");
  const hasRateLimit = results.some((r) => r.status === "rate_limited");
  const hasServerError = results.some((r) => r.status === "server_error");
  const successCount = results.filter((r) => r.ok).length;

  if (successCount > 0) {
    await recordUploadSuccess(null, successCount);
  }

  if (hasReauth) {
    await recordUploadError(null, "needs_reauth", "Sign in to Gauge to resume uploads");
    await refreshAuthStatus(true);
    return;
  }

  if (hasRateLimit || hasServerError) {
    const stored = await getStored({ pendingRetries: 0 });
    const attempts = (stored.pendingRetries || 0) + 1;
    if (attempts >= MAX_RETRY_ATTEMPTS) {
      await recordUploadError(null, hasRateLimit ? "rate_limited" : "server_error", "Giving up after max retries");
      await setStored({ pendingRetries: 0 });
      return;
    }
    await recordUploadPending(null, attempts);
    scheduleLiveRetry(attempts);
  }
}

function scheduleLiveRetry(attempts) {
  const delay = nextBackoffDelay(attempts);
  chrome.alarms.create("callnote_live_retry", { delayInMinutes: Math.max(delay / 60000, 1 / 60) });
}

function clearLiveRetry() {
  chrome.alarms.clear("callnote_live_retry").catch(() => {});
}

async function retryPendingLiveCaptions() {
  const { authStatus, pendingCaptions } = await getStored({});
  if (authStatus?.state !== "signed_in") {
    clearLiveRetry();
    return;
  }
  if (!pendingCaptions || pendingCaptions.length === 0) {
    clearLiveRetry();
    return;
  }
  const token = await getClerkSessionToken();
  if (!token) {
    await refreshAuthStatus(true);
    clearLiveRetry();
    return;
  }
  const batch = pendingCaptions.slice(0, 25);
  await uploadLiveBatch(batch, token);
  const remaining = pendingCaptions.slice(batch.length);
  await setStored({ pendingCaptions: remaining.slice(-MAX_PENDING_CAPTIONS) });
}

async function queueFinalize({ sessionId, meetingTitle, captions }) {
  if (inFlightFinalize) return;
  inFlightFinalize = true;
  try {
    const transcript = buildFinalizeTranscriptText(captions);
    if (!transcript) {
      await setStored({ [PENDING_FLUSH_KEY]: null });
      return;
    }
    const token = await getClerkSessionToken();
    if (!token) {
      await setStored({
        [PENDING_FLUSH_KEY]: { sessionId, meetingTitle, captions, attempts: 0, queuedAt: Date.now() },
      });
      await refreshAuthStatus(true);
      return;
    }

    await setStored({
      uploadStatus: { state: "finalizing", at: Date.now() },
    });

    const form = buildFinalizeFormData({ sessionId, meetingTitle, transcript, captions });
    const response = await fetch(buildFinalizeEndpoint(), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (!response.ok) {
      const status = classifyUploadStatus(response.status);
      if (status === "needs_reauth") {
        await recordUploadError(null, "needs_reauth", "Sign in required to finalize transcript");
        await refreshAuthStatus(true);
        return;
      }
      const stored = await getStored({});
      const attempts = (stored.finalizeAttempts || 0) + 1;
      if (attempts >= MAX_RETRY_ATTEMPTS) {
        await recordUploadError(null, status, "Finalize failed after max retries");
        await setStored({
          [PENDING_FLUSH_KEY]: null,
          finalizeAttempts: 0,
        });
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

chrome.runtime.onMessage.addListener((message, sender) => {
  if (!sender || !sender.id) {
    console.warn("[Gauge] Ignoring message from unknown sender");
    return false;
  }

  if (message?.type === "CHECK_AUTH") {
    refreshAuthStatus(true).then((status) => {
      sendResponseSafe(sender, { type: "AUTH_STATUS", status });
    });
    return true;
  }

  if (message?.type === "CAPTIONS_UPDATE" || message?.type === "MEETING_END") {
    handleCaptionsMessage(message).catch((error) => {
      console.warn("[Gauge] Failed to handle captions message", error);
    });
    return false;
  }

  return false;
});

function sendResponseSafe(_sender, _payload) {
  void _sender;
  void _payload;
}

async function handleCaptionsMessage(message) {
  const data = await getStored({});
  const meetingTitle = message.meetingTitle || data.liveMeetingTitle || "";
  const sessionId =
    data.liveSessionId ||
    createLiveSessionId(meetingTitle || "google-meet");
  const normalizedBatch = normalizeCaptionBatch(
    message.captions || [],
    meetingTitle,
    sessionId,
  );

  const isFinal = message.type === "MEETING_END";
  const lastCaptions = isFinal
    ? (data.lastMeetingCaptions || []).concat(normalizedBatch).slice(-MAX_PENDING_CAPTIONS)
    : data.lastMeetingCaptions;

  const pending = isFinal
    ? []
    : data.pendingCaptions.concat(normalizedBatch).slice(-MAX_PENDING_CAPTIONS);

  await setStored({
    pendingCaptions: pending,
    liveSessionId: isFinal ? null : sessionId,
    liveMeetingTitle: isFinal ? "" : meetingTitle,
    lastMeetingSessionId: sessionId,
    lastMeetingCaptions: lastCaptions,
  });

  const auth = await refreshAuthStatus(false);
  if (auth.state !== "signed_in") {
    if (isFinal) {
      await queueFinalize({ sessionId, meetingTitle, captions: lastCaptions });
    }
    return;
  }

  if (normalizedBatch.length > 0) {
    await uploadLiveBatch(normalizedBatch, auth.token);
  }

  if (isFinal && lastCaptions.length > 0) {
    await queueFinalize({ sessionId, meetingTitle, captions: lastCaptions });
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "callnote_live_retry") {
    retryPendingLiveCaptions().catch((error) => {
      console.warn("[Gauge] Live retry failed", error);
    });
    return;
  }
  if (alarm.name === "callnote_finalize_retry") {
    retryPendingFinalize().catch((error) => {
      console.warn("[Gauge] Finalize retry failed", error);
    });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  refreshAuthStatus(true).catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  refreshAuthStatus(true).catch(() => {});
});
