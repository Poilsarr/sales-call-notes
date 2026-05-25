import { APP_BASE_URL, buildLiveRecordUrl } from "./shared.js";

document.getElementById("openApp").addEventListener("click", () => {
  chrome.storage.local.get({ liveSessionId: null, lastMeetingSessionId: null }, (data) => {
    const sessionId = data.liveSessionId || data.lastMeetingSessionId;
    chrome.tabs.create({
      url: sessionId ? buildLiveRecordUrl(sessionId) : `${APP_BASE_URL}/app/record?source=extension`,
    });
  });
});

document.getElementById("viewHistory").addEventListener("click", () => {
  chrome.tabs.create({ url: `${APP_BASE_URL}/app/calls` });
});

// Check if we're on a Google Meet tab
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  chrome.storage.local.get({ liveMeetingTitle: "", liveSessionId: null }, (data) => {
    if (tab.url && tab.url.includes("meet.google.com")) {
      document.getElementById("statusDot").className = "status-dot active";
      document.getElementById("statusText").textContent = "Capturing Meeting";
      document.getElementById("meetingInfo").textContent = data.liveMeetingTitle
        ? `${data.liveMeetingTitle} is streaming to CallNote Pro`
        : "Google Meet detected - captions will be streamed live";
    } else {
      document.getElementById("statusDot").className = "status-dot inactive";
      document.getElementById("statusText").textContent = "Extension Idle";
      document.getElementById("meetingInfo").textContent = data.liveSessionId
        ? "Open CallNote Pro to follow the latest live session"
        : "Open Google Meet to start capturing";
    }
  });
});
