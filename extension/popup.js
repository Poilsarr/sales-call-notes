import {
  APP_BASE_URL,
  buildLiveRecordUrl,
  buildSignInUrl,
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
  if (state === "signed_in") {
    setDot("authDot", "dot-success");
    setText("authText", "Signed in");
    setText("authSub", "Captions will upload to your CallNote Pro account");
    setHidden("signInBtn", true);
  } else if (state === "needs_sign_in") {
    setDot("authDot", "dot-needs");
    setText("authText", "Sign-in required");
    setText("authSub", "Captions are saved locally. Sign in to sync them to CallNote Pro.");
    setHidden("signInBtn", false);
  } else {
    setDot("authDot", "dot-idle");
    setText("authText", "Checking sign-in...");
    setText("authSub", "");
    setHidden("signInBtn", true);
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
  const liveTitle = data.liveMeetingTitle || data.lastMeetingTitle || "";
  if (isMeet) {
    setDot("statusDot", "dot-active");
    setText("statusText", "Capturing Meeting");
    if (liveTitle) {
      info.textContent = `${liveTitle} is streaming to CallNote Pro`;
    } else {
      info.textContent = "Google Meet detected - captions will be streamed live";
    }
  } else if (data.lastMeetingSessionId) {
    info.textContent = "Open CallNote Pro to follow the latest live session";
  } else {
    info.textContent = "Open Google Meet to start capturing";
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
      },
      resolve,
    );
  });
  renderAuth(data.authStatus);
  renderMeetingContext(tab, data);
  renderUploadStatus(data.uploadStatus, data.lastUploadAt, data.lastUploadError);
}

el("openApp").addEventListener("click", () => {
  chrome.storage.local.get(
    { liveSessionId: null, lastMeetingSessionId: null, authStatus: { state: "unknown" } },
    (data) => {
      const sessionId = data.liveSessionId || data.lastMeetingSessionId;
      if (data.authStatus?.state !== "signed_in") {
        chrome.tabs.create({ url: buildSignInUrl(sessionId ? `?liveSessionId=${sessionId}` : "/app/record") });
        return;
      }
      chrome.tabs.create({
        url: sessionId ? buildLiveRecordUrl(sessionId) : `${APP_BASE_URL}/app/record?source=extension`,
      });
    },
  );
});

el("viewHistory").addEventListener("click", () => {
  chrome.tabs.create({ url: `${APP_BASE_URL}/app/calls` });
});

el("signInBtn").addEventListener("click", () => {
  chrome.tabs.create({ url: buildSignInUrl("/app/record?source=extension") });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.uploadStatus || changes.authStatus || changes.liveMeetingTitle || changes.lastUploadError) {
    refresh();
  }
});

refresh();
