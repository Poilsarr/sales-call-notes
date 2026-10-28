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

let panelMicStream = null;
let panelAudioCtx = null;
let panelAnalyser = null;
let panelAnimFrame = null;
let liveSpeechRecognizer = null;

async function ensurePanelMicPermission() {
  if (panelMicStream && panelMicStream.active) return panelMicStream;
  try {
    if (navigator.mediaDevices?.getUserMedia) {
      panelMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setupPanelAudioVisualizer(panelMicStream);
      return panelMicStream;
    }
  } catch (err) {
    console.debug("[Gauge:sidepanel] mic permission error:", err);
    if (hasChrome() && chrome.tabs?.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL("permission.html") });
    }
  }
  return null;
}

function setupPanelAudioVisualizer(stream) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx || !stream) return;
    if (!panelAudioCtx || panelAudioCtx.state === "closed") {
      panelAudioCtx = new AudioCtx();
    }
    const source = panelAudioCtx.createMediaStreamSource(stream);
    panelAnalyser = panelAudioCtx.createAnalyser();
    panelAnalyser.fftSize = 64;
    source.connect(panelAnalyser);

    const dataArray = new Uint8Array(panelAnalyser.frequencyBinCount);
    function tick() {
      if (!panelAnalyser) return;
      panelAnalyser.getByteFrequencyData(dataArray);
      updateWaveformBars(Array.from(dataArray));
      panelAnimFrame = requestAnimationFrame(tick);
    }
    if (panelAnimFrame) cancelAnimationFrame(panelAnimFrame);
    tick();
  } catch (err) {
    console.debug("[Gauge:sidepanel] visualizer setup error:", err);
  }
}

function teardownPanelAudio() {
  if (panelAnimFrame) {
    cancelAnimationFrame(panelAnimFrame);
    panelAnimFrame = null;
  }
  if (panelMicStream) {
    try {
      panelMicStream.getTracks().forEach((t) => t.stop());
    } catch {}
    panelMicStream = null;
  }
  if (panelAudioCtx && panelAudioCtx.state !== "closed") {
    try {
      panelAudioCtx.close();
    } catch {}
    panelAudioCtx = null;
  }
  panelAnalyser = null;
  resetWaveformBars();
}

function resetWaveformBars() {
  const bars = document.querySelectorAll(".wave-bar");
  bars.forEach((bar) => {
    bar.style.height = "4px";
  });
}

function startLiveSpeechRecognition() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return;
  try {
    liveSpeechRecognizer = new SpeechRec();
    liveSpeechRecognizer.continuous = true;
    liveSpeechRecognizer.interimResults = true;
    liveSpeechRecognizer.lang = "en-US";
    liveSpeechRecognizer.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const res = event.results[i];
        const transcript = res[0]?.transcript?.trim();
        if (!transcript) continue;
        if (res.isFinal) {
          appendLiveTranscriptTurn("You", transcript);
          sendMessage({
            type: MESSAGE_TYPES.CAPTIONS_UPDATE,
            captions: [{ speaker: "You", text: transcript, timestamp: Date.now() }],
          }).catch(() => {});
        }
      }
    };
    liveSpeechRecognizer.onerror = (e) => {
      console.debug("[Gauge:speechRecognition] notice:", e);
    };
    liveSpeechRecognizer.start();
  } catch (err) {
    console.debug("[Gauge:speechRecognition] start failed:", err);
  }
}

function stopLiveSpeechRecognition() {
  if (liveSpeechRecognizer) {
    try {
      liveSpeechRecognizer.stop();
    } catch {}
    liveSpeechRecognizer = null;
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

let favoriteCallIds = new Set();
let customCallTitles = {};

if (hasChrome() && chrome.storage?.local) {
  chrome.storage.local.get({ favCalls: {}, customCallTitles: {} }, (res) => {
    if (res.favCalls && typeof res.favCalls === "object") {
      favoriteCallIds = new Set(Object.keys(res.favCalls).filter((k) => res.favCalls[k]));
    }
    if (res.customCallTitles && typeof res.customCallTitles === "object") {
      customCallTitles = res.customCallTitles;
    }
  });
}

function renderCalls(calls) {
  const list = el("callsList");
  if (!list) return;
  if (!Array.isArray(calls) || calls.length === 0) {
    list.innerHTML = '<li class="sub">No calls yet. Record your first meeting above.</li>';
    return;
  }
  list.innerHTML = "";

  const sortedCalls = [...calls].sort((a, b) => {
    const aFav = favoriteCallIds.has(String(a.id));
    const bFav = favoriteCallIds.has(String(b.id));
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  for (const call of sortedCalls.slice(0, 20)) {
    const id = call?.id == null ? "" : String(call.id);
    const isFav = favoriteCallIds.has(id);
    const displayTitle = customCallTitles[id] || call?.title || call?.filename || `Call ${id.slice(0, 8) || "untitled"}`;
    const callUrl = id ? buildCallDetailUrl(id) : `${APP_ORIGIN}/app/calls`;

    const li = document.createElement("li");
    li.className = "call-item";
    li.dataset.id = id;

    const row = document.createElement("div");
    row.className = "call-row";

    // 1. Star button
    const starBtn = document.createElement("button");
    starBtn.className = `btn-star ${isFav ? "starred" : ""}`;
    starBtn.title = isFav ? "Marked Important (click to unstar)" : "Mark as Important";
    starBtn.setAttribute("aria-label", "Mark Important");
    starBtn.textContent = isFav ? "★" : "☆";
    starBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      const nowFav = !favoriteCallIds.has(id);
      if (nowFav) favoriteCallIds.add(id);
      else favoriteCallIds.delete(id);
      if (hasChrome() && chrome.storage?.local) {
        const obj = {};
        favoriteCallIds.forEach((favId) => { obj[favId] = true; });
        chrome.storage.local.set({ favCalls: obj });
      }
      renderCalls(calls);
    });

    // 2. Info link
    const link = document.createElement("a");
    link.href = callUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "call-link";

    const info = document.createElement("div");
    info.className = "call-info";

    const titleRow = document.createElement("div");
    titleRow.className = "call-title-row";

    const titleEl = document.createElement("span");
    titleEl.className = "call-title";
    titleEl.textContent = displayTitle;
    titleRow.appendChild(titleEl);

    if (isFav) {
      const vipBadge = document.createElement("span");
      vipBadge.className = "badge-important";
      vipBadge.textContent = "VIP";
      titleRow.appendChild(vipBadge);
    }

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = formatCallMeta(call);

    info.appendChild(titleRow);
    info.appendChild(meta);
    link.appendChild(info);

    // 3. Actions (Rename + Open link)
    const actions = document.createElement("div");
    actions.className = "call-actions";

    const renameBtn = document.createElement("button");
    renameBtn.className = "btn-icon btn-rename";
    renameBtn.title = "Rename call";
    renameBtn.setAttribute("aria-label", "Rename call");
    renameBtn.textContent = "✎";

    const openLink = document.createElement("a");
    openLink.href = callUrl;
    openLink.target = "_blank";
    openLink.rel = "noopener noreferrer";
    openLink.className = "btn-icon";
    openLink.title = "Open in Gauge";
    openLink.textContent = "→";

    actions.appendChild(renameBtn);
    actions.appendChild(openLink);

    row.appendChild(starBtn);
    row.appendChild(link);
    row.appendChild(actions);
    li.appendChild(row);

    // 4. Inline rename row
    const renameRow = document.createElement("div");
    renameRow.className = "call-rename-row hidden";

    const renameInput = document.createElement("input");
    renameInput.type = "text";
    renameInput.className = "rename-input";
    renameInput.value = displayTitle;
    renameInput.maxLength = 120;

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn-xs btn-save-rename";
    saveBtn.textContent = "Save";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn-xs";
    cancelBtn.textContent = "✕";

    renameBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      renameRow.classList.toggle("hidden");
      if (!renameRow.classList.contains("hidden")) {
        renameInput.focus();
        renameInput.select();
      }
    });

    cancelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      renameRow.classList.add("hidden");
      renameInput.value = displayTitle;
    });

    const doSave = async () => {
      const newTitle = renameInput.value.trim();
      if (!newTitle || newTitle === displayTitle) {
        renameRow.classList.add("hidden");
        return;
      }
      customCallTitles[id] = newTitle;
      titleEl.textContent = newTitle;
      renameRow.classList.add("hidden");

      if (hasChrome() && chrome.storage?.local) {
        chrome.storage.local.set({ customCallTitles });
      }

      // Sync to backend if possible
      const apiKey = await getApiKeyFromSession();
      if (apiKey && id) {
        try {
          await fetch(`${APP_ORIGIN}/api/calls/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ title: newTitle }),
          });
        } catch {}
      }
    };

    saveBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      doSave();
    });

    renameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doSave();
      } else if (e.key === "Escape") {
        renameRow.classList.add("hidden");
      }
    });

    renameRow.appendChild(renameInput);
    renameRow.appendChild(saveBtn);
    renameRow.appendChild(cancelBtn);
    li.appendChild(renameRow);

    list.appendChild(li);
  }
  void escapeHtml;
}

let inFlightLoadCalls = null;
let lastLoadCallsAt = 0;
let callsRateLimitedUntil = 0;

async function loadCalls(options = {}) {
  const force = options?.force === true;
  const now = Date.now();

  // If rate-limited, skip network fetch until backoff window elapses
  if (now < callsRateLimitedUntil) {
    return;
  }

  // Cooldown: skip if fetched within last 20 seconds unless forced (e.g. call completed)
  if (!force && now - lastLoadCallsAt < 20000) {
    return;
  }

  // De-duplicate concurrent in-flight requests
  if (inFlightLoadCalls) {
    return inFlightLoadCalls;
  }

  inFlightLoadCalls = (async () => {
    let apiKey = await getApiKeyFromSession();
    if (!apiKey) {
      try {
        const authRes = await sendMessage({ type: "ENSURE_API_KEY" });
        if (authRes?.apiKey) {
          apiKey = authRes.apiKey;
          await setApiKeyInSession(apiKey);
        }
      } catch {}
    }
    const list = el("callsList");
    if (!apiKey) {
      if (list && list.children.length === 0) {
        list.innerHTML = '<li class="sub">Connect your account or save a key to view recent calls.</li>';
      }
      return;
    }
    try {
      const response = await fetch(buildCallsEndpoint(), {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (response.status === 429) {
        const retrySec = parseInt(response.headers?.get?.("Retry-After") || "30", 10) || 30;
        callsRateLimitedUntil = Date.now() + retrySec * 1000;
        if (list && list.children.length === 0) {
          list.innerHTML = `<li class="sub">Recent calls sync paused (rate limit). Retrying in ${retrySec}s…</li>`;
        }
        return;
      }

      if (response.status === 403) {
        if (list && list.children.length === 0) {
          list.innerHTML = '<li class="sub">No calls found or plan restricted.</li>';
        }
        return;
      }

      if (response.status === 401) {
        if (list && list.children.length === 0) {
          list.innerHTML = '<li class="sub">Key rejected (401). Connect your account again.</li>';
        }
        return;
      }

      if (!response.ok) {
        console.debug("[Gauge:panel] calls fetch returned status", response.status);
        return;
      }

      const data = await response.json();
      const calls = data?.calls || [];
      renderCalls(calls);
      lastLoadCallsAt = Date.now();

      if (hasChrome() && chrome.storage?.local) {
        chrome.storage.local.set({ cachedCalls: calls });
      }
    } catch (error) {
      console.debug("[Gauge:panel] calls load failed quietly", error);
      if (list && list.children.length === 0) {
        list.innerHTML = "";
        const li = document.createElement("li");
        li.className = "sub";
        li.textContent = buildManualUploadInstructions(`${APP_ORIGIN}/app/calls`);
        list.appendChild(li);
      }
    } finally {
      inFlightLoadCalls = null;
    }
  })();

  return inFlightLoadCalls;
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
    chrome.storage.local.get(
      { authStatus: { state: "unknown" }, lastAnalyzedCall: null, cachedCalls: null },
      (res) => {
        renderAccountStatus(res.authStatus);
        if (res.lastAnalyzedCall) {
          renderPostCallCard(res.lastAnalyzedCall);
        }
        if (Array.isArray(res.cachedCalls) && res.cachedCalls.length > 0) {
          renderCalls(res.cachedCalls);
        }
      },
    );
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
    try {
      const authRes = await sendMessage({ type: "ENSURE_API_KEY" });
      if (authRes?.apiKey) {
        apiKey = authRes.apiKey;
        await setApiKeyInSession(apiKey);
      }
    } catch {}
    if (!apiKey) {
      await sendMessage({ type: MESSAGE_TYPES.CHECK_AUTH });
      apiKey = await getApiKeyFromSession();
      if (!apiKey) {
        setStatus("Please connect your Gauge account first to record.");
        if (hasChrome() && chrome.tabs?.create) {
          chrome.tabs.create({ url: buildConnectUrl() });
        }
        return;
      }
    }
  }
  const downloadRow = el("downloadRow");
  if (downloadRow) downloadRow.style.display = "none";
  setRecState("dot-rec", "Recording…");
  setStatus("Recording meeting audio + live speech recognition active. Press Stop when done.");
  setHidden("durationTracker", false);

  // Request mic permission on interactive user gesture and start speech recognition
  await ensurePanelMicPermission();
  startLiveSpeechRecognition();

  const res = await sendMessage({ type: MESSAGE_TYPES.START_RECORDING });
  if (res && res.ok === false) {
    stopLiveSpeechRecognition();
    teardownPanelAudio();
    if (res.needsMicPermission || String(res.error).includes("microphone")) {
      setRecState("dot-err", "Permission required");
      setStatus("Microphone permission needed. Opening setup tab… Click Allow to start recording.");
      if (hasChrome() && chrome.tabs?.create) {
        chrome.tabs.create({ url: chrome.runtime.getURL("permission.html") });
      }
    } else {
      setRecState("dot-err", "Record failed");
      setStatus(`Could not start capture: ${res.error || "unknown"}. ${buildManualUploadInstructions()}`);
    }
  }
});

el("stopBtn")?.addEventListener("click", async () => {
  stopLiveSpeechRecognition();
  teardownPanelAudio();
  await sendMessage({ type: MESSAGE_TYPES.STOP_RECORDING });
  setRecState("dot-ok", "Processing…");
  setStatus("Stopped. Uploading audio + generating AI notes…");
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
      stopLiveSpeechRecognition();
      teardownPanelAudio();
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

        // Optimistically prepend to cachedCalls in chrome.storage.local
        const optimisticCall = {
          id: message.id,
          filename: message.meetingTitle || `Call ${String(message.id).slice(0, 8)}`,
          title: message.meetingTitle || `Call ${String(message.id).slice(0, 8)}`,
          createdAt: new Date().toISOString(),
          healthScore: message.healthScore,
          source: "extension",
          summary: message.summary,
        };
        if (hasChrome() && chrome.storage?.local) {
          chrome.storage.local.get({ cachedCalls: [] }, (stored) => {
            const existing = Array.isArray(stored.cachedCalls) ? stored.cachedCalls : [];
            const updated = [optimisticCall, ...existing.filter((c) => String(c.id) !== String(message.id))];
            chrome.storage.local.set({ cachedCalls: updated }, () => {
              renderCalls(updated);
            });
          });
        }
      } else {
        setStatus("Done - nothing audible was captured.");
      }
      el("sendBtn").disabled = true;
      loadCalls({ force: true });
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
      if (message.recording) {
        setRecState("dot-rec", "Recording…");
        setHidden("durationTracker", false);
      } else if (message.finalizing) {
        setRecState("dot-ok", "Finalizing…");
        setStatus("Meeting ended. Finalizing audio & generating AI meeting notes…");
        setHidden("durationTracker", true);
        setHidden("micSilentBanner", true);
      } else {
        setRecState("dot-idle", "Ready");
        setHidden("durationTracker", true);
      }
    } else if (message.type === "MEETING_FINALIZE_SUCCESS") {
      if (message.call) {
        renderPostCallCard(message.call);
      }
      loadCalls({ force: true });
    }
  });
}

if (hasChrome() && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.authStatus) {
      const oldState = changes.authStatus.oldValue?.state;
      const newState = changes.authStatus.newValue?.state;
      renderAccountStatus(changes.authStatus.newValue);
      if (oldState !== "signed_in" && newState === "signed_in") {
        loadCalls();
      }
    }
    if (area === "local" && changes.lastAnalyzedCall?.newValue) {
      renderPostCallCard(changes.lastAnalyzedCall.newValue);
      loadCalls({ force: true });
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
