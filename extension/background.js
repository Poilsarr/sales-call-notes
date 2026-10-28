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
  exchangeSessionTokenForKey,
  fetchSessionStatus,
  formatMomentTag,
  getApiKeyFromSession,
  getClerkSessionToken,
  nextBackoffDelay,
  normalizeCaptionBatch,
  recordUploadError,
  setApiKeyInSession,
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
  recording: false,
  pendingBookmarks: [],
  lastAnalyzedCall: null,
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
  const stored = await getStored({ authStatus: { state: "unknown" } });
  let apiKey = await getApiKeyFromSession();

  // 1. If we have an apiKey, verify it and ensure plan/email are fresh
  if (apiKey) {
    try {
      const session = await fetchSessionStatus(apiKey);
      if (session && session.authenticated) {
        const plan = (session.plan || stored.authStatus?.plan || "free").toLowerCase();
        const email = session.user?.email || stored.authStatus?.email || "";
        if (stored.authStatus?.plan !== plan || stored.authStatus?.email !== email || stored.authStatus?.state !== "signed_in") {
          const status = { state: "signed_in", plan, email, at: Date.now() };
          await setStored({ authStatus: status });
          return status;
        }
        return stored.authStatus;
      }
    } catch {
      // network failure — preserve existing signed-in status
      if (stored.authStatus?.state === "signed_in") {
        return stored.authStatus;
      }
    }
  }

  // 2. If no apiKey (or key verification failed), attempt auto-exchange using Clerk cookie
  const clerkToken = await getClerkSessionToken();
  if (clerkToken) {
    try {
      const exchange = await exchangeSessionTokenForKey(clerkToken);
      if (exchange && (exchange.raw || exchange.user)) {
        apiKey = exchange.raw || clerkToken;
        if (apiKey) {
          await setApiKeyInSession(apiKey);
        }
        const plan = (exchange.plan || stored.authStatus?.plan || "free").toLowerCase();
        const email = exchange.user?.email || stored.authStatus?.email || "";
        const status = { state: "signed_in", plan, email, at: Date.now() };
        await setStored({ authStatus: status });
        return status;
      }
    } catch (err) {
      console.warn("[Gauge] Cookie key exchange failed", err);
    }
  }

  // 3. If stored auth status was signed in and network is offline, keep it
  if (stored.authStatus?.state === "signed_in" && stored.authStatus?.email) {
    return stored.authStatus;
  }

  // 4. Truly no session, key, or cookie found
  const status = { state: "needs_sign_in", plan: "free", email: "", at: Date.now() };
  await setStored({ authStatus: status });
  return status;
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

    const result = await response.json().catch(() => null);
    const callId = result?.id || result?.callId || sessionId;
    const callUrl = result?.callUrl || (callId ? `${APP_BASE_URL}/app/calls/${callId}` : "");
    const lastAnalyzedCall = {
      id: callId,
      callUrl,
      meetingTitle: meetingTitle || "Sales Call",
      summary: result?.summary || "Meeting summary processed.",
      actionItems: result?.actionItems || [],
      healthScore: result?.healthScore ?? null,
      at: Date.now(),
    };

    await setStored({
      [PENDING_FLUSH_KEY]: null,
      finalizeAttempts: 0,
      lastMeetingCaptions: [],
      uploadStatus: { state: "finalized", sessionId, at: Date.now() },
      lastUploadAt: Date.now(),
      lastUploadError: null,
      lastAnalyzedCall,
    });

    if (chrome.notifications?.create) {
      chrome.notifications.create(`gauge-call-${callId}`, {
        type: "basic",
        iconUrl: "icon128.png",
        title: "Gauge — Call Analysis Ready! ⚡",
        message: `${meetingTitle || "Sales Call"} notes are ready to view. Click to open summary.`,
        priority: 2,
      });
    }

    const storedTab = await getStored({ lastMeetingTabId: null });
    if (storedTab.lastMeetingTabId && chrome.tabs?.sendMessage) {
      try {
        chrome.tabs.sendMessage(
          storedTab.lastMeetingTabId,
          { type: "MEETING_FINALIZE_SUCCESS", call: lastAnalyzedCall },
          () => { void chrome.runtime?.lastError; }
        );
      } catch {}
    }
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

  if (isFinal) {
    await setStored({ recording: false });
    try {
      chrome.runtime?.sendMessage?.({ type: MESSAGE_TYPES.OFFSCREEN_STOP_AUDIO });
      chrome.runtime?.sendMessage?.({ type: MESSAGE_TYPES.RECORDING_STATUS, recording: false, finalizing: true });
    } catch {}
  }

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

    if (message.type === MESSAGE_TYPES.AUTH_SYNC) {
      (async () => {
        if (message.apiKey) {
          await setApiKeyInSession(message.apiKey);
        } else {
          const clerkToken = await getClerkSessionToken();
          if (clerkToken) {
            try {
              const exchange = await exchangeSessionTokenForKey(clerkToken);
              if (exchange?.raw) {
                await setApiKeyInSession(exchange.raw);
              }
            } catch {}
          }
        }
        const stored = await getStored({ authStatus: {} });
        const existingAuth = stored.authStatus || {};
        const plan = (message.plan || existingAuth.plan || "free").toLowerCase();
        const email = message.user?.email || existingAuth.email || "";
        const status = { state: "signed_in", plan, email, at: Date.now() };
        await setStored({ authStatus: status });
        sendResponse?.({ ok: true, status });
      })().catch((err) => {
        sendResponse?.({ ok: false, error: err?.message });
      });
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

    if (message.type === "ENSURE_API_KEY") {
      (async () => {
        let key = await getApiKeyFromSession();
        if (!key) {
          const clerkToken = await getClerkSessionToken();
          if (clerkToken) {
            try {
              const exchange = await exchangeSessionTokenForKey(clerkToken);
              key = exchange?.raw || clerkToken;
              if (key) await setApiKeyInSession(key);
            } catch {
              key = clerkToken;
              await setApiKeyInSession(key);
            }
          }
        }
        sendResponse?.({ apiKey: key || null });
      })().catch(() => sendResponse?.({ apiKey: null }));
      return true;
    }

    if (message.type === MESSAGE_TYPES.OPEN_PERMISSION_PAGE || message.type === "OPEN_PERMISSION_PAGE") {
      if (chrome.tabs?.create) {
        chrome.tabs.create({ url: chrome.runtime.getURL("permission.html") });
      }
      sendResponse?.({ ok: true });
      return false;
    }

    if (message.type === MESSAGE_TYPES.MIC_PERMISSION_GRANTED || message.type === "MIC_PERMISSION_GRANTED") {
      setStored({ micPermissionGranted: true }).catch(() => {});
      sendResponse?.({ ok: true });
      return false;
    }

    if (message.type === MESSAGE_TYPES.START_RECORDING) {
      (async () => {
        const ready = await ensureOffscreenDocument();
        if (!ready) {
          sendResponse?.({ ok: false, error: "offscreen unavailable" });
          return;
        }
        const stored = await getStored({ lastMeetingTabId: null, liveMeetingTitle: "" });
        // Prioritize explicit target tab ID from sender (e.g. content script in Google Meet)
        let targetTabId = (sender?.tab && sender.tab.id) || message.targetTabId || stored.lastMeetingTabId;
        if (!targetTabId && chrome.tabs?.query) {
          try {
            // Find active meeting tabs first
            const meetingTabs = await new Promise((res) =>
              chrome.tabs.query({ url: ["*://meet.google.com/*", "*://teams.microsoft.com/*", "*://*.zoom.us/*"] }, res)
            );
            if (meetingTabs?.[0]?.id) {
              targetTabId = meetingTabs[0].id;
            } else {
              const activeTabs = await new Promise((res) => chrome.tabs.query({ active: true, currentWindow: true }, res));
              if (activeTabs?.[0]?.id) targetTabId = activeTabs[0].id;
            }
            if (targetTabId) await setStored({ lastMeetingTabId: targetTabId });
          } catch {}
        }
        const streamId = await getTabStreamId(targetTabId);
        const title = message.meetingTitle || stored.liveMeetingTitle || "";

        // Send to offscreen and AWAIT the response so errors propagate
        const offscreenResult = await new Promise((resolve) => {
          try {
            chrome.runtime.sendMessage(
              {
                type: MESSAGE_TYPES.OFFSCREEN_START_AUDIO,
                streamId,
                meetingTitle: title,
              },
              (response) => {
                if (chrome.runtime?.lastError) {
                  resolve({ ok: false, error: chrome.runtime.lastError.message || "offscreen unreachable" });
                } else {
                  resolve(response || { ok: false, error: "no response from offscreen" });
                }
              },
            );
          } catch (err) {
            resolve({ ok: false, error: err?.message || "sendMessage failed" });
          }
        });

        if (!offscreenResult?.ok) {
          // If microphone permission is missing, open permission gateway tab automatically!
          if (offscreenResult?.needsMicPermission || String(offscreenResult?.error).includes("microphone permissions")) {
            if (chrome.tabs?.create) {
              chrome.tabs.create({ url: chrome.runtime.getURL("permission.html") });
            }
          }
          sendResponse?.({
            ok: false,
            error: offscreenResult?.error || "capture failed in offscreen",
            needsMicPermission: Boolean(offscreenResult?.needsMicPermission),
          });
          return;
        }

        await setStored({ recording: true });

        // Broadcast START_RECORDING to all meeting tabs so floating HUDs and scrapers sync immediately
        if (chrome.tabs?.query) {
          try {
            const meetingTabs = await new Promise((res) =>
              chrome.tabs.query({ url: ["*://meet.google.com/*", "*://teams.microsoft.com/*", "*://*.zoom.us/*"] }, res)
            );
            for (const t of (meetingTabs || [])) {
              if (t.id) {
                chrome.tabs.sendMessage(t.id, { type: MESSAGE_TYPES.START_RECORDING, meetingTitle: title }, () => {
                  void chrome.runtime?.lastError;
                });
              }
            }
          } catch {}
        }

        sendResponse?.({ ok: true, relayed: true });
      })().catch((error) => {
        console.warn("[Gauge] Record relay failed", error);
        sendResponse?.({ ok: false, error: error?.message || "relay failed" });
      });
      return true;
    }

    if (message.type === MESSAGE_TYPES.RECORDING_STATUS) {
      setStored({ recording: Boolean(message.recording) }).catch(() => {});
      return false;
    }

    if (message.type === MESSAGE_TYPES.BOOKMARK_MOMENT) {
      (async () => {
        const stored = await getStored({ pendingBookmarks: [], lastMeetingCaptions: [] });
        const bookmarks = stored.pendingBookmarks || [];
        const bookmark = {
          type: message.momentType || "decision",
          elapsedSec: message.elapsedSec || 0,
          timestamp: Date.now(),
        };
        bookmarks.push(bookmark);
        const tagText = formatMomentTag(bookmark.type, bookmark.elapsedSec);
        const markerCaption = {
          text: tagText,
          timestamp: Date.now(),
          isMarker: true,
        };
        const updatedCaptions = (stored.lastMeetingCaptions || []).concat([markerCaption]);
        await setStored({
          pendingBookmarks: bookmarks,
          lastMeetingCaptions: updatedCaptions,
        });
      })().catch(() => {});
      return false;
    }

    if (message.type === MESSAGE_TYPES.OFFSCREEN_DONE) {
      (async () => {
        await setStored({ recording: false });
        if (message.id) {
          const lastAnalyzedCall = {
            id: message.id,
            callUrl: message.callUrl,
            meetingTitle: message.meetingTitle,
            summary: message.summary || "",
            actionItems: message.actionItems || [],
            healthScore: message.healthScore ?? null,
            at: Date.now(),
          };
          await setStored({ lastAnalyzedCall });
          if (chrome.notifications?.create) {
            chrome.notifications.create(`gauge-call-${message.id}`, {
              type: "basic",
              iconUrl: "icon128.png",
              title: "Gauge — Call Analysis Ready! ⚡",
              message: `${message.meetingTitle || "Sales Call"} notes are ready to view. Click to open summary.`,
              priority: 2,
            });
          }
          const storedTab = await getStored({ lastMeetingTabId: null });
          if (storedTab.lastMeetingTabId && chrome.tabs?.sendMessage) {
            try {
              chrome.tabs.sendMessage(
                storedTab.lastMeetingTabId,
                { type: "MEETING_FINALIZE_SUCCESS", call: lastAnalyzedCall },
                () => { void chrome.runtime?.lastError; }
              );
            } catch {}
          }
        }
      })().catch((err) => console.warn("[Gauge] Failed to handle OFFSCREEN_DONE", err));
      return false;
    }

    if (message.type === MESSAGE_TYPES.STOP_RECORDING) {
      chrome.runtime?.sendMessage?.({ type: MESSAGE_TYPES.OFFSCREEN_STOP_AUDIO });
      (async () => {
        await setStored({ recording: false });
        // Broadcast STOP_RECORDING to all meeting tabs so in-meeting HUDs update immediately
        if (chrome.tabs?.query) {
          try {
            const meetingTabs = await new Promise((res) =>
              chrome.tabs.query({ url: ["*://meet.google.com/*", "*://teams.microsoft.com/*", "*://*.zoom.us/*"] }, res)
            );
            for (const t of (meetingTabs || [])) {
              if (t.id) {
                chrome.tabs.sendMessage(t.id, { type: MESSAGE_TYPES.STOP_RECORDING }, () => {
                  void chrome.runtime?.lastError;
                });
              }
            }
          } catch {}
        }
      })().catch(() => {});
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

  if (hasChrome() && chrome.storage?.session?.setAccessLevel) {
    chrome.storage.session
      .setAccessLevel({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" })
      .catch(() => {});
  }

  chrome.runtime.onInstalled?.addListener(() => {
    refreshAuthStatus().catch(() => {});
  });
  chrome.runtime.onStartup?.addListener(() => {
    refreshAuthStatus().catch(() => {});
  });

  if (hasChrome() && chrome.cookies?.onChanged) {
    let cookieDebounceTimer = null;
    chrome.cookies.onChanged.addListener((changeInfo) => {
      const domain = changeInfo?.cookie?.domain || "";
      const name = changeInfo?.cookie?.name || "";
      if (name === "__session" || domain.includes("usegauge.vercel.app")) {
        if (cookieDebounceTimer) clearTimeout(cookieDebounceTimer);
        cookieDebounceTimer = setTimeout(() => {
          refreshAuthStatus().catch(() => {});
        }, 1500);
      }
    });
  }

  if (hasChrome() && chrome.commands?.onCommand) {
    chrome.commands.onCommand.addListener(async (command) => {
      if (command === "toggle-recording") {
        const stored = await getStored({ recording: false });
        if (stored.recording) {
          chrome.runtime.sendMessage({ type: MESSAGE_TYPES.STOP_RECORDING });
        } else {
          chrome.runtime.sendMessage({ type: MESSAGE_TYPES.START_RECORDING });
        }
      } else if (command === "bookmark-moment") {
        const stored = await getStored({ lastMeetingTabId: null });
        if (stored.lastMeetingTabId && chrome.tabs?.sendMessage) {
          chrome.tabs.sendMessage(
            stored.lastMeetingTabId,
            { type: MESSAGE_TYPES.BOOKMARK_MOMENT, momentType: "decision" },
            () => {
              void chrome.runtime?.lastError;
            },
          );
        }
      }
    });
  }

  if (hasChrome() && chrome.notifications?.onClicked) {
    chrome.notifications.onClicked.addListener(async () => {
      const stored = await getStored({ lastAnalyzedCall: null });
      if (stored.lastAnalyzedCall?.callUrl && chrome.tabs?.create) {
        chrome.tabs.create({ url: stored.lastAnalyzedCall.callUrl });
      }
    });
  }
}

