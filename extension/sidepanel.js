/* Gauge - Side panel (Part 3B).
 *
 * - Pastes a Bearer key (`cn_live_` / `cn_test_`, minted via
 *   POST /api/v1/keys/exchange - docs-only reference, the extension never
 *   calls that endpoint) and keeps it in chrome.storage.session only.
 * - Record / Stop / Send buttons drive the service worker -> offscreen
 *   audio pipeline and the content-script caption scrape.
 * - Status list loads GET /api/v1/calls with the Bearer key; each row
 *   deep-links to APP_ORIGIN/app/calls/{id} for the summary.
 * - If the backend is not merged yet, every network failure degrades to
 *   manual-upload instructions instead of a dead button.
 */
import {
  API_KEY_SESSION_KEY,
  APP_ORIGIN,
  MESSAGE_TYPES,
  buildCallDetailUrl,
  buildCallsEndpoint,
  buildKeysExchangeDocsUrl,
  buildManualUploadInstructions,
  escapeHtml,
  getApiKeyFromSession,
  isValidApiKeyFormat,
  setApiKeyInSession,
} from "./shared.js";

const el = (id) => document.getElementById(id);

function hasChrome() {
  return typeof chrome !== "undefined" && !!chrome.runtime;
}

function sendMessage(message) {
  return new Promise((resolve) => {
    if (!hasChrome() || !chrome.runtime?.sendMessage) {
      resolve(null);
      return;
    }
    try {
      chrome.runtime.sendMessage(message, (response) => resolve(response ?? null));
    } catch {
      resolve(null);
    }
  });
}

function setRecState(state, text) {
  const dot = el("recDot");
  const label = el("recText");
  if (dot) dot.className = `dot ${state}`;
  if (label) label.textContent = text;
  el("recordBtn").disabled = state === "dot-rec";
  el("stopBtn").disabled = state !== "dot-rec";
}

function setStatus(text) {
  const node = el("recStatus");
  if (node) node.textContent = text;
}

function setKeyStatus(text) {
  const node = el("keyStatus");
  if (node) node.textContent = text;
}

function formatCallMeta(call) {
  const parts = [];
  if (call?.createdAt) {
    const date = new Date(call.createdAt);
    if (!Number.isNaN(date.getTime())) parts.push(date.toLocaleString());
  }
  if (typeof call?.healthScore === "number") parts.push(`score ${call.healthScore}`);
  if (call?.source) parts.push(String(call.source));
  return parts.join(" · ");
}

function renderCalls(calls) {
  const list = el("callsList");
  if (!list) return;
  if (!Array.isArray(calls) || calls.length === 0) {
    list.innerHTML = '<li class="sub">No calls yet. Record your first meeting above.</li>';
    return;
  }
  list.innerHTML = "";
  for (const call of calls.slice(0, 20)) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    const id = call?.id == null ? "" : String(call.id);
    link.href = id ? buildCallDetailUrl(id) : `${APP_ORIGIN}/app/calls`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const title = document.createElement("div");
    // textContent (never innerHTML) so call filenames cannot inject markup.
    title.textContent = call?.filename || `Call ${id.slice(0, 8) || "untitled"}`;
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = formatCallMeta(call);
    link.appendChild(title);
    link.appendChild(meta);
    li.appendChild(link);
    list.appendChild(li);
  }
  void escapeHtml;
}

async function loadCalls() {
  const apiKey = await getApiKeyFromSession();
  const list = el("callsList");
  if (!apiKey) {
    if (list) list.innerHTML = '<li class="sub">Save a key to load calls.</li>';
    return;
  }
  try {
    const response = await fetch(buildCallsEndpoint(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (response.status === 401 || response.status === 403) {
      if (list) list.innerHTML = '<li class="sub">Key rejected (401/403). Paste a fresh key above.</li>';
      return;
    }
    if (!response.ok) throw new Error(`calls failed (${response.status})`);
    const data = await response.json();
    renderCalls(data?.calls);
  } catch (error) {
    console.warn("[Gauge:panel] calls load failed", error);
    if (list) {
      list.innerHTML = "";
      const li = document.createElement("li");
      li.className = "sub";
      li.textContent = buildManualUploadInstructions(`${APP_ORIGIN}/app/calls`);
      list.appendChild(li);
    }
  }
}

async function refreshKeyStatus() {
  const apiKey = await getApiKeyFromSession();
  if (apiKey) {
    const prefix = apiKey.slice(0, 8);
    setKeyStatus(`Key saved for this session (${prefix}…). Stored in session memory only.`);
  } else {
    setKeyStatus("No key saved for this session.");
  }
  return apiKey;
}

el("saveKey").addEventListener("click", async () => {
  const input = el("apiKey").value.trim();
  if (!isValidApiKeyFormat(input)) {
    setKeyStatus("That does not look like a key - expected cn_live_… or cn_test_…");
    return;
  }
  const ok = await setApiKeyInSession(input);
  if (!hasChrome()) {
    setKeyStatus("Extension APIs unavailable - cannot store the key here.");
    return;
  }
  if (!ok) {
    setKeyStatus("Could not write session storage. Reload the panel and retry.");
    return;
  }
  el("apiKey").value = "";
  await refreshKeyStatus();
  setStatus("Key saved. Press Record on a meeting tab.");
  await loadCalls();
  void API_KEY_SESSION_KEY;
});

el("recordBtn").addEventListener("click", async () => {
  const apiKey = await getApiKeyFromSession();
  if (!apiKey) {
    setStatus("Paste your Bearer key first - it is required for upload.");
    return;
  }
  setRecState("dot-rec", "Recording…");
  setStatus("Recording tab audio (32kbps Opus) + captions. Press Stop when done.");
  const res = await sendMessage({ type: MESSAGE_TYPES.START_RECORDING });
  if (res && res.ok === false) {
    setRecState("dot-err", "Record failed");
    setStatus(`Could not start capture: ${res.error || "unknown"}. ${buildManualUploadInstructions()}`);
  }
});

el("stopBtn").addEventListener("click", async () => {
  await sendMessage({ type: MESSAGE_TYPES.STOP_RECORDING });
  setRecState("dot-ok", "Processing…");
  setStatus("Stopped. Uploading audio + finalizing captions…");
  el("sendBtn").disabled = false;
});

el("sendBtn").addEventListener("click", async () => {
  // Re-trigger the captions finalize for the last meeting (the audio half
  // finalizes itself via OFFSCREEN_DONE; this covers the captions half).
  await sendMessage({ type: MESSAGE_TYPES.MEETING_END, captions: [], meetingTitle: "" });
  setStatus("Finalize requested. Watch the status dot, then open the call summary below.");
  await loadCalls();
});

if (hasChrome() && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message) => {
    if (!message || typeof message.type !== "string") return;
    if (message.type === MESSAGE_TYPES.OFFSCREEN_CHUNK) {
      setStatus(
        `Recording… ${(message.chunkCount || 0)} chunks buffered` +
          (message.totalBytes ? ` (${Math.round(message.totalBytes / 1024)} KB)` : ""),
      );
    } else if (message.type === MESSAGE_TYPES.OFFSCREEN_DONE) {
      setRecState("dot-ok", "Uploaded");
      if (message?.id) {
        setStatus(`Done - summary: ${buildCallDetailUrl(message.id)}`);
      } else {
        setStatus("Done - nothing audible was captured.");
      }
      el("sendBtn").disabled = true;
      loadCalls();
    } else if (message.type === MESSAGE_TYPES.OFFSCREEN_ERROR) {
      setRecState("dot-err", "Upload issue");
      setStatus(`${message.message || "Upload failed."} ${message.manual || buildManualUploadInstructions()}`);
      el("sendBtn").disabled = false;
    } else if (message.type === MESSAGE_TYPES.RECORDING_STATUS) {
      if (message.recording) setRecState("dot-rec", "Recording…");
    }
  });
}

el("docsLink").addEventListener("click", (event) => {
  event.preventDefault();
  const url = buildKeysExchangeDocsUrl();
  if (hasChrome() && chrome.tabs?.create) chrome.tabs.create({ url });
  else window.open(url, "_blank", "noopener");
});

refreshKeyStatus().then((apiKey) => {
  if (apiKey) loadCalls();
});
