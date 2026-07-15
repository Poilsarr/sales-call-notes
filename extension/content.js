// Gauge - Google Meet Content Script
// Captures meeting captions and sends to Gauge API

let captionObserver = null;
let captions = [];
let meetingStarted = false;
let meetingTitle = "";
let lastCaptionText = "";

function init() {
  // Watch for the captions button and enable them (only if user has consented)
  const autoCaptions = localStorage.getItem("callnote_auto_captions") !== "false";
  const checkCaptions = setInterval(() => {
    if (!autoCaptions) return;
    const buttons = document.querySelectorAll('[aria-label*="captions" i], [aria-label*="Turn on" i]');
    buttons.forEach(btn => {
      if (btn.getAttribute("aria-pressed") === "false" && btn.textContent.toLowerCase().includes("captions")) {
        btn.click();
      }
    });

    // Get meeting title
    const titleEl = document.querySelector('[data-meeting-title]') || document.querySelector('div[role="heading"]');
    if (titleEl && titleEl.textContent) {
      meetingTitle = titleEl.textContent;
    }

    // Detect meeting started
    if (!meetingStarted && document.querySelector('[jscontroller]')) {
      meetingStarted = true;
      clearInterval(checkCaptions);
      startCaptionCapture();
    }
  }, 2000);

  // Timeout after 30 seconds
  setTimeout(() => clearInterval(checkCaptions), 30000);
}

function startCaptionCapture() {
  console.warn("[Gauge] Meeting detected, watching captions...");

  const captionContainer = document.querySelector('[jsname="mq"]') ||
    document.querySelector('.qwt') ||
    document.querySelector('[role="region"]');

  captionObserver = new MutationObserver(() => {
    if (captionContainer) {
      const textSpans = captionContainer.querySelectorAll('span');
      const newText = Array.from(textSpans).map(s => s.textContent).join(" ").trim();
      if (newText && newText !== lastCaptionText) {
        lastCaptionText = newText;
        captions.push({ text: newText, timestamp: Date.now() });
      }
    }
  });

  if (captionContainer) {
    captionObserver.observe(captionContainer, { childList: true, subtree: true, characterData: true });
  } else {
    captionObserver.observe(document.body, { childList: true, subtree: true });
  }

  // Periodically send captions to background
  setInterval(() => {
    if (captions.length > 0) {
      chrome.runtime.sendMessage({
        type: "CAPTIONS_UPDATE",
        captions: captions.splice(0, captions.length),
        meetingTitle,
      });
    }
  }, 5000);
}

// Listen for tab visibility changes (meeting ends)
document.addEventListener("visibilitychange", () => {
  if (document.hidden && captions.length > 0) {
    chrome.runtime.sendMessage({
      type: "MEETING_END",
      captions: captions.splice(0, captions.length),
      meetingTitle,
    });
  }
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
