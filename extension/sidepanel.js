/* Gauge - Side panel (Part 3B).
 *
 * - Auto-detects Clerk session & plan tier (Free vs Pro).
 * - Optional manual key paste (cn_live_ / cn_test_) in session storage.
 * - Record / Stop / Send buttons drive service worker -> offscreen audio pipeline
 *   and caption capture.
 * - Status list loads GET /api/v1/calls, deep-linking to /app/calls/{id}.
 */
import {
  API_KEY_SESSION_KEY,
  APP_ORIGIN,
  MESSAGE_TYPES,
  buildCallDetailUrl,
  buildCallsEndpoint,
  buildConnectUrl,
  buildKeysExchangeDocsUrl,
  buildManualUploadInstructions,
  buildPricingUrl,
  buildRecapMarkdown,
  escapeHtml,
  formatDuration,
  getApiKeyFromSession,
  getPlanLimits,
  isValidApiKeyFormat,
  setApiKeyInSession,
} from "./shared.js";

const el = (id) => document.getElementById(id);

function hasChrome() {
  return typeof chrome !== "undefined" && !!chrome.runtime;
}

function setDot(id, cls) {
  const node = el(id);
  if (node) node.className = `dot ${cls}`;
}

function setText(id, value) {
  const node = el(id);
  if (node) node.textContent = value;
}

function setHidden(id, hidden) {
  const node = el(id);
  if (node) node.classList.toggle("hidden", hidden);
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
  const card = el("recCard");
  if (dot) dot.className = `dot ${state}`;
  if (label) label.textContent = text;
  if (card) card.classList.toggle("recording-active", state === "dot-rec");
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

let currentPlan = "free";
let fontSizes = ["font-xs", "font-sm", "font-md", "font-lg"];
let currentFontIdx = 1; // default font-sm
let currentLastAnalyzedCall = null;
let userHasScrolledTranscript = false;

function showToast(text = "Copied to clipboard!") {
  const toast = el("recapToast");
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function updateFontClass() {
  const feed = el("liveTranscriptFeed");
  if (!feed) return;
  for (const f of fontSizes) feed.classList.remove(f);
  feed.classList.add(fontSizes[currentFontIdx]);
}

function updateWaveformBars(freqBins) {
  const bars = document.querySelectorAll(".wave-bar");
  if (!bars.length || !Array.isArray(freqBins)) return;
  for (let i = 0; i < bars.length; i++) {
    const val = freqBins[i] ?? 0;
    const height = Math.max(4, Math.min(22, Math.round((val / 100) * 22)));
    bars[i].style.height = `${height}px`;
  }
}

function updateDurationTracker(elapsedSeconds) {
  setHidden("durationTracker", false);
  setText("elapsedTimeDisplay", formatDuration(elapsedSeconds));

  const isPro = currentPlan === "pro" || currentPlan === "business" || currentPlan === "enterprise";
  const limitSeconds = isPro ? 5400 : 1800; // 90m vs 30m
  setText("capLimitDisplay", isPro ? "/ 90:00 pro cap" : "/ 30:00 free cap");

  const pct = Math.min(100, Math.round((elapsedSeconds / limitSeconds) * 100));
  const fill = el("durationProgressBarFill");
  if (fill) {
    fill.style.width = `${pct}%`;
    fill.classList.toggle("warning", pct >= 70 && pct < 85);
    fill.classList.toggle("danger", pct >= 85);
  }

  const warningBanner = el("capWarningBanner");
  if (warningBanner) {
    setHidden("capWarningBanner", isPro || elapsedSeconds < 1500); // 25m
  }
}

function appendLiveTranscriptTurn(speaker, text) {
  setHidden("transcriptEmptyHint", true);
  const feed = el("liveTranscriptFeed");
  if (!feed) return;

  const turn = document.createElement("div");
  turn.className = "transcript-turn";

  const speakerDiv = document.createElement("div");
  speakerDiv.className = "turn-speaker";
  speakerDiv.textContent = speaker || "Speaker";

  const textDiv = document.createElement("div");
  textDiv.className = "turn-text";
  textDiv.textContent = text;

  turn.appendChild(speakerDiv);
  turn.appendChild(textDiv);
  feed.appendChild(turn);

  if (!userHasScrolledTranscript) {
    feed.scrollTop = feed.scrollHeight;
  }
}

function renderPostCallCard(callData) {
  if (!callData) return;
  currentLastAnalyzedCall = callData;
  setHidden("postCallCard", false);

  setText("postCallTitle", callData.meetingTitle || "Sales Meeting");
  setText("postCallSummaryPreview", callData.summary || "Summary generated successfully. View full details in Gauge.");

  if (typeof callData.healthScore === "number") {
    setText("postCallHealthBadge", `${callData.healthScore}% Health Score`);
  } else {
    setText("postCallHealthBadge", "Analysis Ready");
  }

  const openBtn = el("openFullCallBtn");
  if (openBtn) {
    openBtn.href = callData.callUrl || (callData.id ? buildCallDetailUrl(callData.id) : "#");
  }
}

function renderAccountStatus(authStatus) {
  const state = authStatus?.state || "unknown";
  const plan = (authStatus?.plan || "free").toLowerCase();
  currentPlan = plan;
  const limits = getPlanLimits(plan);
  const email = authStatus?.email || "";
  const isPro = plan === "pro" || plan === "business" || plan === "enterprise";

  setText("sidepanelTierBadge", limits.badgeText);

  if (state === "signed_in") {
    setDot("accountDot", "dot-active");
    setText("accountEmail", email ? `Connected · ${email}` : "Connected to Gauge");
    setText("accountPlanTag", isPro ? "PRO UNLIMITED" : "FREE (30M CAP)");
    setHidden("connectAccountBtn", true);

    const subNode = el("accountSub");
    if (subNode) {
      if (isPro) {
        subNode.textContent = "Pro plan active · Unlimited recording duration · CRM sync enabled";
      } else {
        subNode.innerHTML = `Free plan active · 30m call limit. <a href="#" id="sidepanelUpgradeLink" style="color: #a5b4fc; text-decoration: underline;">Upgrade to Pro ($9/mo) ↗</a>`;
        el("sidepanelUpgradeLink")?.addEventListener("click", (e) => {
          e.preventDefault();
          chrome.tabs?.create?.({ url: buildPricingUrl() });
        });
      }
    }
  } else {
    setDot("accountDot", "dot-needs");
    setText("accountEmail", "Not connected to Gauge");
    setText("accountPlanTag", "GUEST");
    setText("accountSub", "Sign in to Gauge to auto-sync meeting audio and AI notes.");
    setHidden("connectAccountBtn", false);
  }
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

    const infoCol = document.createElement("div");
    const title = document.createElement("div");
    title.className = "call-title";
    title.textContent = call?.filename || `Call ${id.slice(0, 8) || "untitled"}`;
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = formatCallMeta(call);
    infoCol.appendChild(title);
    infoCol.appendChild(meta);

    const arrow = document.createElement("span");
    arrow.style.cssText = "color: rgba(255,255,255,0.3); font-size: 13px; margin-left: 8px;";
    arrow.textContent = "→";

    link.appendChild(infoCol);
    link.appendChild(arrow);
    li.appendChild(link);
    list.appendChild(li);
  }
  void escapeHtml;
}

async function loadCalls() {
  const apiKey = await getApiKeyFromSession();
  const list = el("callsList");
  if (!apiKey) {
    if (list) list.innerHTML = '<li class="sub">Connect your account or save a key to view recent calls.</li>';
    return;
  }
  try {
    const response = await fetch(buildCallsEndpoint(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (response.status === 403) {
      if (list) list.innerHTML = '<li class="sub">No calls found or plan restricted.</li>';
      return;
    }
    if (response.status === 401) {
      if (list) list.innerHTML = '<li class="sub">Key rejected (401). Connect your account again.</li>';
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

async function initSession() {
  if (hasChrome() && chrome.storage?.local) {
    chrome.storage.local.get({ authStatus: { state: "unknown" }, lastAnalyzedCall: null }, (res) => {
      renderAccountStatus(res.authStatus);
      if (res.lastAnalyzedCall) {
        renderPostCallCard(res.lastAnalyzedCall);
      }
    });
  }

  // Ping background to verify or auto-exchange Clerk cookie
  const authRes = await sendMessage({ type: MESSAGE_TYPES.CHECK_AUTH });
  if (authRes?.status) {
    renderAccountStatus(authRes.status);
  }

  await refreshKeyStatus();
  await loadCalls();

  // Feed scroll listener
  const feed = el("liveTranscriptFeed");
  feed?.addEventListener("scroll", () => {
    const isAtBottom = feed.scrollHeight - feed.scrollTop <= feed.clientHeight + 15;
    userHasScrolledTranscript = !isAtBottom;
  });

  // Transcript tool buttons
  el("fontSmallerBtn")?.addEventListener("click", () => {
    if (currentFontIdx > 0) {
      currentFontIdx--;
      updateFontClass();
    }
  });
  el("fontLargerBtn")?.addEventListener("click", () => {
    if (currentFontIdx < fontSizes.length - 1) {
      currentFontIdx++;
      updateFontClass();
    }
  });
  el("contrastToggleBtn")?.addEventListener("click", () => {
    document.body.classList.toggle("oled-mode");
    el("contrastToggleBtn")?.classList.toggle("active", document.body.classList.contains("oled-mode"));
  });

  // Post-call recap copy buttons
  el("copySummaryBtn")?.addEventListener("click", async () => {
    if (!currentLastAnalyzedCall) return;
    const md = buildRecapMarkdown(currentLastAnalyzedCall);
    try {
      await navigator.clipboard.writeText(md);
      showToast("Summary copied as Markdown!");
    } catch {
      showToast("Copy failed");
    }
  });

  el("copyActionsBtn")?.addEventListener("click", async () => {
    if (!currentLastAnalyzedCall?.actionItems?.length) {
      showToast("No action items for this call");
      return;
    }
    const lines = currentLastAnalyzedCall.actionItems.map((item) => {
      const task = typeof item === "string" ? item : item.task || "";
      const owner = typeof item === "object" && item.owner ? ` (@${item.owner})` : "";
      return `- [ ] ${task}${owner}`;
    });
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      showToast("Action items checklist copied!");
    } catch {
      showToast("Copy failed");
    }
  });

  el("emailRecapBtn")?.addEventListener("click", () => {
    if (!currentLastAnalyzedCall) return;
    const title = encodeURIComponent(`Meeting Summary: ${currentLastAnalyzedCall.meetingTitle || "Sales Call"}`);
    const body = encodeURIComponent(buildRecapMarkdown(currentLastAnalyzedCall));
    window.open(`mailto:?subject=${title}&body=${body}`, "_blank");
  });

  el("capUpgradeLink")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (hasChrome() && chrome.tabs?.create) chrome.tabs.create({ url: buildPricingUrl() });
    else window.open(buildPricingUrl(), "_blank");
  });
}

el("saveKey")?.addEventListener("click", async () => {
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

el("connectAccountBtn")?.addEventListener("click", () => {
  if (hasChrome() && chrome.tabs?.create) {
    chrome.tabs.create({ url: buildConnectUrl() });
  } else {
    window.open(buildConnectUrl(), "_blank");
  }
});

el("recordBtn")?.addEventListener("click", async () => {
  let apiKey = await getApiKeyFromSession();
  if (!apiKey) {
    const authRes = await sendMessage({ type: MESSAGE_TYPES.CHECK_AUTH });
    apiKey = await getApiKeyFromSession();
    if (!apiKey) {
      setStatus("Please connect your Gauge account first to record.");
      if (hasChrome() && chrome.tabs?.create) {
        chrome.tabs.create({ url: buildConnectUrl() });
      }
      return;
    }
  }
  const downloadRow = el("downloadRow");
  if (downloadRow) downloadRow.style.display = "none";
  setRecState("dot-rec", "Recording…");
  setStatus("Recording tab audio (32kbps Opus) + captions. Press Stop when done.");
  setHidden("durationTracker", false);
  const res = await sendMessage({ type: MESSAGE_TYPES.START_RECORDING });
  if (res && res.ok === false) {
    setRecState("dot-err", "Record failed");
    setStatus(`Could not start capture: ${res.error || "unknown"}. ${buildManualUploadInstructions()}`);
  }
});

el("stopBtn")?.addEventListener("click", async () => {
  await sendMessage({ type: MESSAGE_TYPES.STOP_RECORDING });
  setRecState("dot-ok", "Processing…");
  setStatus("Stopped. Uploading audio + finalizing captions…");
  setHidden("micSilentBanner", true);
  el("sendBtn").disabled = false;
});

el("sendBtn")?.addEventListener("click", async () => {
  await sendMessage({ type: MESSAGE_TYPES.MEETING_END, captions: [], meetingTitle: "" });
  setStatus("Finalize requested. Watch the status dot, then open the call summary below.");
  await loadCalls();
});

if (hasChrome() && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message) => {
    if (!message || typeof message.type !== "string") return;

    if (message.type === MESSAGE_TYPES.AUDIO_HEALTH_UPDATE) {
      if (Array.isArray(message.frequencyData)) {
        updateWaveformBars(message.frequencyData);
      }
      setHidden("micSilentBanner", !message.isMicSilent);
      if (typeof message.elapsedSeconds === "number") {
        updateDurationTracker(message.elapsedSeconds);
      }
      return;
    }

    if (message.type === MESSAGE_TYPES.LIVE_TRANSCRIPT_CHUNK) {
      appendLiveTranscriptTurn(message.speaker, message.text);
      return;
    }

    if (message.type === MESSAGE_TYPES.OFFSCREEN_CHUNK) {
      setStatus(
        `Recording… ${(message.chunkCount || 0)} chunks buffered` +
          (message.totalBytes ? ` (${Math.round(message.totalBytes / 1024)} KB)` : ""),
      );
    } else if (message.type === MESSAGE_TYPES.OFFSCREEN_DONE) {
      setRecState("dot-ok", "Uploaded");
      setHidden("durationTracker", true);
      setHidden("micSilentBanner", true);
      const downloadRow = el("downloadRow");
      if (downloadRow) downloadRow.style.display = "none";
      if (message?.id) {
        setStatus(`Done - summary: ${buildCallDetailUrl(message.id)}`);
        renderPostCallCard({
          id: message.id,
          callUrl: message.callUrl,
          meetingTitle: message.meetingTitle,
          summary: message.summary,
          actionItems: message.actionItems,
          healthScore: message.healthScore,
        });
      } else {
        setStatus("Done - nothing audible was captured.");
      }
      el("sendBtn").disabled = true;
      loadCalls();
    } else if (message.type === MESSAGE_TYPES.OFFSCREEN_ERROR) {
      setRecState("dot-err", "Upload issue");
      setHidden("durationTracker", true);
      setStatus(`${message.message || "Upload failed."} ${message.manual || buildManualUploadInstructions()}`);
      el("sendBtn").disabled = false;
      if (message.downloadUrl) {
        const downloadRow = el("downloadRow");
        const downloadBtn = el("downloadBackupBtn");
        if (downloadRow && downloadBtn) {
          downloadBtn.href = message.downloadUrl;
          downloadBtn.download = message.filename || "meeting-recording.webm";
          downloadRow.style.display = "block";
        }
      }
    } else if (message.type === MESSAGE_TYPES.RECORDING_STATUS) {
      if (message.recording) setRecState("dot-rec", "Recording…");
    }
  });
}

if (hasChrome() && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.authStatus) {
      renderAccountStatus(changes.authStatus.newValue);
      loadCalls();
    }
    if (area === "local" && changes.lastAnalyzedCall?.newValue) {
      renderPostCallCard(changes.lastAnalyzedCall.newValue);
    }
  });
}

el("docsLink")?.addEventListener("click", (event) => {
  event.preventDefault();
  const url = buildKeysExchangeDocsUrl();
  if (hasChrome() && chrome.tabs?.create) chrome.tabs.create({ url });
  else window.open(url, "_blank", "noopener");
});

initSession();
