/* Gauge - Meeting Content Script (Part 3B).
 *
 * Defensive caption scrape: reads ONLY aria-live regions + document.title.
 * No CSS-class selectors anywhere in this file - Meet/Teams/Zoom rotate
 * hashed class names on every deploy, so classes must never be a dependency.
 * The DOM_ADAPTER object below is version-pinned and mirrors
 * DOM_ADAPTER in shared.js (content scripts cannot import ES modules).
 * Keep DOM_ADAPTER_VERSION identical in both files.
 *
 * Message contract (unchanged): posts { type: CAPTIONS_UPDATE | MEETING_END,
 * captions: [{ text, timestamp }], meetingTitle } to the service worker.
 */
(function () {
  "use strict";

  var DOM_ADAPTER = {
    version: "2026-09-27-p3b",
    captionSelectors: [
      '[aria-live="polite"]',
      '[aria-live="assertive"]',
      '[role="log"]',
      "[aria-live]"
    ],
    titleSources: ["document.title"]
  };

  var BANNER_ID = "gauge-consent-banner";
  var FLUSH_INTERVAL_MS = 5000;
  var CAPTIONS_UPDATE = "CAPTIONS_UPDATE";
  var MEETING_END = "MEETING_END";
  var START_RECORDING = "START_RECORDING";
  var STOP_RECORDING = "STOP_RECORDING";
  var RECORDING_STATUS = "RECORDING_STATUS";

  var captions = [];
  var recording = false;
  var meetingTitle = "";
  var lastSeenByRoot = [];
  var flushTimer = null;

  function hasChromeRuntime() {
    return (
      typeof chrome !== "undefined" &&
      !!chrome.runtime &&
      typeof chrome.runtime.sendMessage === "function"
    );
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getMeetingTitle() {
    try {
      // document.title only - heading / data-* hooks differ per provider.
      var title = document.title;
      if (typeof title === "string" && title.trim()) {
        return title.trim().slice(0, 200);
      }
    } catch (err) {
      void err;
    }
    return meetingTitle || "";
  }

  function findCaptionRoots() {
    var seen = [];
    var out = [];
    for (var i = 0; i < DOM_ADAPTER.captionSelectors.length; i += 1) {
      var nodes = [];
      try {
        nodes = document.querySelectorAll(DOM_ADAPTER.captionSelectors[i]);
      } catch (err) {
        void err;
        continue;
      }
      for (var j = 0; j < nodes.length; j += 1) {
        if (seen.indexOf(nodes[j]) === -1) {
          seen.push(nodes[j]);
          out.push(nodes[j]);
        }
      }
    }
    return out;
  }

  function readRootText(root) {
    try {
      var raw =
        typeof root.innerText === "string" && root.innerText
          ? root.innerText
          : root.textContent || "";
      return String(raw).replace(/\s+/g, " ").trim().slice(0, 4000);
    } catch (err) {
      void err;
      return "";
    }
  }

  function scrapeOnce() {
    meetingTitle = getMeetingTitle();
    var roots = findCaptionRoots();
    var fresh = [];
    for (var i = 0; i < roots.length; i += 1) {
      var text = readRootText(roots[i]);
      if (!text) continue;
      if (lastSeenByRoot[i] === text) continue;
      lastSeenByRoot[i] = text;
      fresh.push(text);
    }
    // De-dupe overlapping aria-live regions echoing the same line.
    var combined = fresh.join(" ").replace(/\s+/g, " ").trim();
    if (combined) {
      var prev = captions.length ? captions[captions.length - 1].text : "";
      if (combined !== prev && combined.indexOf(prev) !== 0) {
        captions.push({ text: combined.slice(0, 4000), timestamp: Date.now() });
      } else if (combined.length > prev.length) {
        captions[captions.length - 1] = {
          text: combined.slice(0, 4000),
          timestamp: Date.now()
        };
      }
    }
  }

  function takeBatch() {
    var batch = captions;
    captions = [];
    return batch;
  }

  function post(type, batch) {
    if (!hasChromeRuntime()) return;
    try {
      chrome.runtime.sendMessage({
        type: type,
        captions: batch,
        meetingTitle: meetingTitle
      });
    } catch (err) {
      void err;
    }
  }

  function flush() {
    scrapeOnce();
    var batch = takeBatch();
    if (batch.length > 0) post(CAPTIONS_UPDATE, batch);
  }

  function ensureBanner() {
    try {
      if (document.getElementById(BANNER_ID)) return;
      var bar = document.createElement("div");
      bar.id = BANNER_ID;
      bar.setAttribute("role", "alert");
      bar.setAttribute(
        "style",
        "position:fixed;top:0;left:0;right:0;z-index:2147483647;" +
          "background:#dc2626;color:#ffffff;font-size:13px;font-weight:500;" +
          "font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;" +
          "padding:8px 16px;text-align:center;letter-spacing:0.01em;"
      );
      // Title is user-controlled -> escaped before interpolation.
      bar.innerHTML =
        '<span style="font-weight:700;margin-right:8px;">&#9679; REC</span>' +
        "<span>Gauge is recording " +
        escapeHtml(meetingTitle || "this meeting") +
        ". Captions + audio are captured for AI notes.</span>";
      document.documentElement.appendChild(bar);
    } catch (err) {
      void err;
    }
  }

  function removeBanner() {
    try {
      var bar = document.getElementById(BANNER_ID);
      if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
    } catch (err) {
      void err;
    }
  }

  function startRecording() {
    if (recording) return;
    recording = true;
    meetingTitle = getMeetingTitle();
    ensureBanner();
    scrapeOnce();
    if (flushTimer == null) {
      flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);
    }
  }

  function stopRecording(final) {
    if (!recording && captions.length === 0) {
      removeBanner();
      return;
    }
    recording = false;
    removeBanner();
    scrapeOnce();
    var batch = takeBatch();
    if (batch.length > 0 || final) post(MEETING_END, batch);
    if (flushTimer != null) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
  }

  // Passive caption watch: even before Record is pressed we track titles so
  // the side panel can show the meeting name. Network posts only happen on
  // the 5s flush while recording, or as MEETING_END on unload.
  function watch() {
    meetingTitle = getMeetingTitle();
    if (recording) ensureBanner();
  }

  if (hasChromeRuntime() && chrome.runtime.onMessage) {
    try {
      chrome.runtime.onMessage.addListener(function (message) {
        if (!message || typeof message.type !== "string") return;
        if (message.type === START_RECORDING) startRecording();
        else if (message.type === STOP_RECORDING) stopRecording(false);
        else if (message.type === RECORDING_STATUS) {
          // Side panel polls capture state; answer without side effects.
          return Promise.resolve({ type: RECORDING_STATUS, recording: recording });
        }
      });
    } catch (err) {
      void err;
    }
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopRecording(true);
  });
  window.addEventListener("beforeunload", function () {
    scrapeOnce();
    var batch = takeBatch();
    if (batch.length > 0) post(MEETING_END, batch);
  });

  setInterval(watch, FLUSH_INTERVAL_MS);
  watch();
})();
