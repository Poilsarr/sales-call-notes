import {
  buildLiveTranscriptionEndpoint,
  createLiveSessionId,
  normalizeCaptionBatch,
} from "./shared.js";

const STORAGE_DEFAULTS = {
  pendingCaptions: [],
  liveSessionId: null,
  liveMeetingTitle: "",
  lastMeetingSessionId: null,
};

async function uploadCaptionBatch(captions, sessionId, isFinal) {
  if (captions.length === 0) return;

  await Promise.all(
    captions.map((caption) =>
      fetch(buildLiveTranscriptionEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          text: caption.text,
          isFinal,
        }),
      }).catch((error) => {
        console.warn("[CallNote Pro] Failed to upload caption", error);
      }),
    ),
  );
}

// CallNote Pro - Background Service Worker
chrome.runtime.onMessage.addListener((message, sender) => {
  if (!sender || !sender.id) {
    console.warn("[CallNote Pro] Ignoring message from unknown sender");
    return;
  }

  if (message.type === "CAPTIONS_UPDATE" || message.type === "MEETING_END") {
    chrome.storage.local.get(STORAGE_DEFAULTS, (data) => {
      const sessionId =
        data.liveSessionId ||
        createLiveSessionId(message.meetingTitle || data.liveMeetingTitle || "google-meet");
      const normalizedBatch = normalizeCaptionBatch(
        message.captions || [],
        message.meetingTitle || data.liveMeetingTitle || "",
        sessionId,
      );
      const captions = data.pendingCaptions.concat(normalizedBatch).slice(-500);

      chrome.storage.local.set({
        pendingCaptions: captions,
        liveSessionId: message.type === "MEETING_END" ? null : sessionId,
        liveMeetingTitle: message.type === "MEETING_END" ? "" : (message.meetingTitle || data.liveMeetingTitle || ""),
        lastMeetingSessionId: sessionId,
      });

      void uploadCaptionBatch(normalizedBatch, sessionId, message.type === "MEETING_END");
    });
  }
});
