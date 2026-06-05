export const APP_BASE_URL = "https://sales-call-notes.vercel.app";

function slugifyMeetingTitle(meetingTitle = "") {
  return meetingTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "meeting";
}

export function createLiveSessionId(meetingTitle = "", now = Date.now()) {
  return `ext-${slugifyMeetingTitle(meetingTitle)}-${now}`;
}

export function buildLiveRecordUrl(sessionId) {
  return `${APP_BASE_URL}/app/record?liveSessionId=${encodeURIComponent(sessionId)}&source=extension`;
}

export function buildLiveTranscriptionEndpoint() {
  return `${APP_BASE_URL}/api/transcribe/live`;
}

export function normalizeCaptionBatch(captions = [], meetingTitle = "", sessionId = "ext-meeting") {
  return captions
    .filter((caption) => caption && typeof caption.text === "string" && caption.text.trim())
    .map((caption) => ({
      text: caption.text.trim(),
      meetingTitle,
      sessionId,
      timestamp: new Date(caption.timestamp).toISOString(),
    }));
}
