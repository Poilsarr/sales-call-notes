// CallNote Pro - Background Service Worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender || !sender.id) {
    console.warn("[CallNote Pro] Ignoring message from unknown sender");
    return;
  }
  if (message.type === "CAPTIONS_UPDATE" || message.type === "MEETING_END") {
    chrome.storage.local.get({ pendingCaptions: [] }, (data) => {
      const captions = data.pendingCaptions.concat(
        (message.captions || []).map(c => ({
          ...c,
          meetingTitle: message.meetingTitle,
          timestamp: new Date(c.timestamp).toISOString(),
        }))
      );
      chrome.storage.local.set({ pendingCaptions: captions.slice(-500) });
    });
  }
});
