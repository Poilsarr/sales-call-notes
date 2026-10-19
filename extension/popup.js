import {
  APP_BASE_URL,
  MESSAGE_TYPES,
  buildConnectUrl,
  buildLiveRecordUrl,
  buildPricingUrl,
  buildSignInUrl,
  getPlanLimits,
} from "./shared.js";

const el = (id) => document.getElementById(id);

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

function formatRelativeTime(epochMs) {
  if (!epochMs) return null;
  const delta = Date.now() - epochMs;
  if (delta < 5_000) return "just now";
  if (delta < 60_000) return `${Math.round(delta / 1000)}s ago`;
  if (delta < 3_600_000) return `${Math.round(delta / 60_000)}m ago`;
  if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)}h ago`;
  return `${Math.round(delta / 86_400_000)}d ago`;
}

function renderAuth(authStatus) {
  const state = authStatus?.state || "unknown";
  const planTier = (authStatus?.plan || "free").toLowerCase();
  const limits = getPlanLimits(planTier);
  const email = authStatus?.email || "";
  const isPro = planTier === "pro" || planTier === "business" || planTier === "enterprise";

  // Update brand header badge
  const badge = el("planBadge");
  if (badge) {
    badge.textContent = limits.badgeText;
    badge.className = `badge-tier ${
      state === "signed_in" ? (isPro ? "badge-pro" : "badge-free") : "badge-guest"
    }`;
  }

  if (state === "signed_in") {
    setDot("authDot", "dot-success");
    setText("authText", email ? `Signed in as ${email}` : "Signed in");
    if (isPro) {
      setText("authSub", "Pro Plan · Unlimited calls, CRM sync active");
      setHidden("upgradeCard", true);
    } else {
      setText("authSub", "Free Plan · 30-min call limit (30MB)");
      setHidden("upgradeCard", false);
    }
    setHidden("signInBtn", true);
  } else if (state === "needs_sign_in") {
    setDot("authDot", "dot-needs");
    setText("authText", "Sign-in required");
    setText("authSub", "Connect your Gauge account to sync recordings and AI notes.");
    setHidden("signInBtn", false);
    setHidden("upgradeCard", true);
  } else {
    setDot("authDot", "dot-idle");
    setText("authText", "Checking sign-in...");
    setText("authSub", "");
    setHidden("signInBtn", true);
    setHidden("upgradeCard", true);
  }
}

function renderUploadStatus(uploadStatus, lastUploadAt, lastError) {
  const state = uploadStatus?.state || "idle";
  if (state === "uploading") {
    setDot("statusDot", "dot-uploading");
    setText("statusText", "Uploading captions...");
  } else if (state === "finalizing") {
    setDot("statusDot", "dot-uploading");
    setText("statusText", "Finalizing transcript...");
  } else if (state === "success") {
    setDot("statusDot", "dot-success");
    setText("statusText", `Uploaded ${uploadStatus.count || 0} captions`);
  } else if (state === "finalized") {
    setDot("statusDot", "dot-success");
    setText("statusText", "Transcript uploaded");
  } else if (state === "error") {
    setDot("statusDot", "dot-error");
    setText("statusText", "Upload error");
  } else {
    setDot("statusDot", "dot-idle");
    setText("statusText", "Idle");
  }

  if (state === "error" && lastError?.message) {
    setText("meetingInfo", lastError.message);
  } else if (state === "success" && lastUploadAt) {
    setText("meetingInfo", `Last upload ${formatRelativeTime(lastUploadAt) || "just now"}`);
  } else if (state === "finalized" && lastUploadAt) {
    setText("meetingInfo", `Transcript finalized ${formatRelativeTime(lastUploadAt) || "just now"}`);
  }
}

function renderMeetingContext(tab, data) {
  const info = el("meetingInfo");
  if (!info) return;
  const isMeet = tab?.url && tab.url.includes("meet.google.com");
  const isTeams = tab?.url && tab.url.includes("teams.");
  const isZoom = tab?.url && tab.url.includes("zoom.us");
  const liveTitle = data.liveMeetingTitle || data.lastMeetingTitle || "";

  if (isMeet || isTeams || isZoom) {
    setDot("statusDot", "dot-active");
    setText("statusText", "Meeting Detected");
    const appName = isMeet ? "Google Meet" : isTeams ? "Microsoft Teams" : "Zoom";
    if (liveTitle) {
      info.textContent = `${liveTitle} (${appName}) ready to record`;
    } else {
      info.textContent = `${appName} active — click Open Recorder Panel to start`;
    }
  } else if (data.lastMeetingSessionId) {
    info.textContent = "Open Gauge to view the latest meeting summary";
  } else {
    info.textContent = "Open Google Meet, Teams, or Zoom to record notes";
  }
}

function renderRecap(lastCall) {
  if (!lastCall) {
    setHidden("popupRecapCard", true);
    return;
  }
  setHidden("popupRecapCard", false);
  setText("popupRecapTitle", `⚡ ${lastCall.meetingTitle || "Recent Meeting"}`);
  setText(
    "popupRecapDesc",
    lastCall.summary
      ? lastCall.summary.slice(0, 95) + (lastCall.summary.length > 95 ? "..." : "")
      : "Summary and action items ready to review.",
  );
  const recapBtn = el("popupRecapBtn");
  if (recapBtn) {
    recapBtn.onclick = () => {
      const url = lastCall.callUrl || `${APP_BASE_URL}/app/calls/${lastCall.id}`;
      chrome.tabs.create({ url });
    };
  }
}

async function refresh() {
  const tabs = await new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, resolve);
  });
  const tab = tabs?.[0];
  const data = await new Promise((resolve) => {
    chrome.storage.local.get(
      {
        liveSessionId: null,
        liveMeetingTitle: "",
        lastMeetingSessionId: null,
        uploadStatus: { state: "idle", at: 0 },
        authStatus: { state: "unknown", at: 0 },
        lastUploadAt: null,
        lastUploadError: null,
        lastAnalyzedCall: null,
      },
      resolve,
    );
  });

  renderAuth(data.authStatus);
  renderMeetingContext(tab, data);
  renderUploadStatus(data.uploadStatus, data.lastUploadAt, data.lastUploadError);
  renderRecap(data.lastAnalyzedCall);

  // Proactively ping background to re-validate auth via session / cookies
  try {
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.CHECK_AUTH }, (response) => {
      if (response?.status) {
        renderAuth(response.status);
      }
    });
  } catch {}
}

el("openApp").addEventListener("click", () => {
  chrome.storage.local.get(
    { liveSessionId: null, lastMeetingSessionId: null, authStatus: { state: "unknown" } },
    (data) => {
      const sessionId = data.liveSessionId || data.lastMeetingSessionId;
      if (data.authStatus?.state !== "signed_in") {
        chrome.tabs.create({ url: buildConnectUrl() });
        return;
      }
      chrome.tabs.create({
        url: sessionId ? buildLiveRecordUrl(sessionId) : `${APP_BASE_URL}/app`,
      });
    },
  );
});

el("viewHistory").addEventListener("click", () => {
  chrome.tabs.create({ url: `${APP_BASE_URL}/app/calls` });
});

el("openPanel").addEventListener("click", async () => {
  try {
    if (chrome.sidePanel?.open) {
      const currentWindow = await chrome.windows.getCurrent();
      await chrome.sidePanel.open({ windowId: currentWindow.id });
      window.close();
      return;
    }
  } catch (error) {
    console.warn("[Gauge] sidePanel.open failed, falling back to tab", error);
  }
  chrome.tabs.create({ url: chrome.runtime.getURL("sidepanel.html") });
});

el("signInBtn").addEventListener("click", () => {
  chrome.tabs.create({ url: buildConnectUrl() });
});

el("upgradeBtn")?.addEventListener("click", () => {
  chrome.tabs.create({ url: buildPricingUrl() });
});

el("headerSettings")?.addEventListener("click", () => {
  chrome.tabs.create({ url: `${APP_BASE_URL}/app` });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.uploadStatus || changes.authStatus || changes.liveMeetingTitle || changes.lastUploadError) {
    refresh();
  }
});

refresh();
