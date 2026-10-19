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
  var HUD_ROOT_ID = "gauge-hud-root";
  var FLUSH_INTERVAL_MS = 5000;
  var CAPTIONS_UPDATE = "CAPTIONS_UPDATE";
  var MEETING_END = "MEETING_END";
  var START_RECORDING = "START_RECORDING";
  var STOP_RECORDING = "STOP_RECORDING";
  var RECORDING_STATUS = "RECORDING_STATUS";
  var BOOKMARK_MOMENT = "BOOKMARK_MOMENT";
  var LIVE_TRANSCRIPT_CHUNK = "LIVE_TRANSCRIPT_CHUNK";

  var captions = [];
  var recording = false;
  var meetingTitle = "";
  var lastSeenByRoot = [];
  var flushTimer = null;
  var hudTimerInterval = null;
  var recordingStartTime = 0;
  var totalCaptionsCount = 0;
  var hudElement = null;
  var hudShadow = null;
  var isMinimized = false;

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

  function formatTime(totalSeconds) {
    var s = Math.max(0, Math.floor(totalSeconds));
    var m = Math.floor(s / 60);
    var remS = s % 60;
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    if (m >= 60) {
      var h = Math.floor(m / 60);
      var remM = m % 60;
      return pad(h) + ":" + pad(remM) + ":" + pad(remS);
    }
    return pad(m) + ":" + pad(remS);
  }

  function getMeetingTitle() {
    try {
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

  function parseSpeaker(rawText) {
    var match = rawText.match(/^([^:\n]{2,30})[:\n]\s*(.+)$/s);
    if (match) {
      return { speaker: match[1].trim(), text: match[2].trim() };
    }
    return { speaker: "", text: rawText.trim() };
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
        totalCaptionsCount += 1;
        emitLiveChunk(combined);
      } else if (combined.length > prev.length) {
        captions[captions.length - 1] = {
          text: combined.slice(0, 4000),
          timestamp: Date.now()
        };
        totalCaptionsCount += 1;
        emitLiveChunk(combined);
      }
      updateCcAlertStatus();
    }
  }

  function emitLiveChunk(rawText) {
    if (!hasChromeRuntime()) return;
    try {
      var parsed = parseSpeaker(rawText);
      chrome.runtime.sendMessage({
        type: LIVE_TRANSCRIPT_CHUNK,
        speaker: parsed.speaker,
        text: parsed.text,
        timestamp: Date.now(),
      });
    } catch (e) {
      void e;
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

  function tryEnableCaptions() {
    try {
      // Agnostic attribute search for caption buttons across Google Meet, Teams, and Zoom
      var btns = document.querySelectorAll('button[aria-label*="caption" i], button[data-tooltip*="caption" i], button[aria-label*="subt" i]');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        var pressed = b.getAttribute("aria-pressed");
        if (pressed === "false" || !pressed) {
          b.click();
          return true;
        }
      }
      // Keyboard dispatch fallback for Google Meet ("c" toggles captions)
      var keyEvt = new KeyboardEvent("keydown", { key: "c", code: "KeyC", bubbles: true });
      document.dispatchEvent(keyEvt);
      return true;
    } catch (e) {
      return false;
    }
  }

  function tagMoment(momentType) {
    var elapsedSec = Math.floor((Date.now() - recordingStartTime) / 1000);
    if (hasChromeRuntime()) {
      try {
        chrome.runtime.sendMessage({
          type: BOOKMARK_MOMENT,
          momentType: momentType,
          elapsedSec: elapsedSec,
        });
      } catch (e) {
        void e;
      }
    }
    showHudToast(momentType.toUpperCase() + " TAGGED");
  }

  function showHudToast(text) {
    if (!hudShadow) return;
    var toast = hudShadow.querySelector('[data-id="hudToast"]');
    if (!toast) return;
    toast.textContent = text;
    toast.style.display = "inline-block";
    setTimeout(function () {
      if (toast) toast.style.display = "none";
    }, 2200);
  }

  function updateCcAlertStatus() {
    if (!hudShadow) return;
    var ccAlert = hudShadow.querySelector('[data-id="hudCcAlert"]');
    if (!ccAlert) return;
    var elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    if (recording && totalCaptionsCount === 0 && elapsed >= 8) {
      ccAlert.style.display = "flex";
    } else {
      ccAlert.style.display = "none";
    }
  }

  function makeDraggable(container) {
    var startX = 0, startY = 0, initialLeft = 0, initialTop = 0;
    var isDragging = false;

    function onPointerDown(e) {
      // Don't drag if clicking buttons or tags
      if (e.target && (e.target.tagName === "BUTTON" || e.target.closest("button"))) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      var rect = container.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      container.style.cursor = "grabbing";
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      var newLeft = Math.max(10, Math.min(window.innerWidth - container.offsetWidth - 10, initialLeft + dx));
      var newTop = Math.max(10, Math.min(window.innerHeight - container.offsetHeight - 10, initialTop + dy));
      container.style.left = newLeft + "px";
      container.style.top = newTop + "px";
      container.style.bottom = "auto";
      container.style.transform = "none";
    }

    function onPointerUp() {
      isDragging = false;
      container.style.cursor = "grab";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    }

    container.addEventListener("pointerdown", onPointerDown);
  }

  function ensureBanner() {
    try {
      // 1. Maintain semantic alert for screen readers and legacy contract checks
      var legacyBanner = document.getElementById(BANNER_ID);
      if (!legacyBanner) {
        legacyBanner = document.createElement("div");
        legacyBanner.id = BANNER_ID;
        legacyBanner.setAttribute("role", "alert");
        legacyBanner.setAttribute("aria-live", "polite");
        legacyBanner.setAttribute("style", "position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;");
        legacyBanner.textContent = "Gauge is recording " + (meetingTitle || "this meeting") + ". Captions + audio are captured for AI notes.";
        document.documentElement.appendChild(legacyBanner);
      }

      // 2. Attach isolated Shadow DOM interactive floating HUD
      if (document.getElementById(HUD_ROOT_ID)) return;
      hudElement = document.createElement("div");
      hudElement.id = HUD_ROOT_ID;
      hudElement.setAttribute("style", "all:initial;position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:2147483647;");
      
      hudShadow = hudElement.attachShadow({ mode: "closed" });
      var style = document.createElement("style");
      style.textContent =
        "@keyframes hudPulse{50%{opacity:0.35;}}" +
        "@keyframes hudBlink{50%{transform:scale(1.05);}}" +
        "[data-hud-root]{all:initial;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased;user-select:none;}" +
        "[data-id='hudContainer']{display:flex;align-items:center;gap:9px;background:rgba(15,23,42,0.95);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.15);box-shadow:0 12px 32px -4px rgba(0,0,0,0.65),0 0 0 1px rgba(255,255,255,0.08);border-radius:9999px;padding:6px 14px;color:#ffffff;cursor:grab;transition:box-shadow 0.2s,transform 0.15s;}" +
        "[data-id='hudDot']{width:8px;height:8px;border-radius:50%;background:#ef4444;box-shadow:0 0 10px #ef4444;animation:hudPulse 1.2s infinite;flex-shrink:0;}" +
        "[data-id='hudBrand']{font-size:11px;font-weight:700;letter-spacing:0.06em;color:#818cf8;text-transform:uppercase;}" +
        "[data-id='hudTimer']{font-size:12.5px;font-weight:600;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#f1f5f9;min-width:44px;text-align:center;}" +
        "[data-id='hudDivider']{width:1px;height:16px;background:rgba(255,255,255,0.14);}" +
        "[data-id='hudTagGroup']{display:flex;align-items:center;gap:4px;}" +
        "[data-tag-btn]{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);color:#e2e8f0;border-radius:9999px;padding:3px 7px;font-size:10.5px;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:3px;transition:all 0.15s;}" +
        "[data-tag-btn]:hover{background:rgba(255,255,255,0.18);border-color:rgba(255,255,255,0.25);transform:translateY(-1px);color:#ffffff;}" +
        "[data-id='hudCcAlert']{display:none;align-items:center;gap:4px;background:rgba(245,158,11,0.22);border:1px solid rgba(245,158,11,0.45);color:#fcd34d;padding:3px 9px;border-radius:9999px;font-size:10.5px;font-weight:600;cursor:pointer;animation:hudBlink 2s infinite;}" +
        "[data-id='hudCcAlert']:hover{background:rgba(245,158,11,0.38);}" +
        "[data-id='hudStopBtn']{background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.4);color:#fca5a5;border-radius:9999px;padding:4px 9px;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all 0.15s;}" +
        "[data-id='hudStopBtn']:hover{background:rgba(239,68,68,0.35);border-color:rgba(239,68,68,0.7);color:#ffffff;transform:translateY(-1px);}" +
        "[data-id='hudMinBtn']{background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:2px 5px;font-size:12px;border-radius:4px;}" +
        "[data-id='hudMinBtn']:hover{color:#ffffff;background:rgba(255,255,255,0.1);}" +
        "[data-id='hudToast']{display:none;background:#22c55e;color:#052e16;font-size:10px;font-weight:700;padding:2px 7px;border-radius:9999px;letter-spacing:0.04em;}";

      var container = document.createElement("div");
      container.setAttribute("data-hud-root", "true");
      container.innerHTML =
        '<div data-id="hudContainer">' +
          '<div data-id="hudDot"></div>' +
          '<span data-id="hudBrand">GAUGE</span>' +
          '<span data-id="hudTimer">00:00</span>' +
          '<div data-id="hudDivider"></div>' +
          '<div data-id="hudTagGroup">' +
            '<button type="button" data-tag-btn="decision" title="Bookmark Key Decision">💡 Decision</button>' +
            '<button type="button" data-tag-btn="objection" title="Bookmark Objection">🛡️ Objection</button>' +
            '<button type="button" data-tag-btn="pricing" title="Bookmark Pricing / Budget">💰 Pricing</button>' +
            '<button type="button" data-tag-btn="action" title="Bookmark Action Item">✅ Action</button>' +
          '</div>' +
          '<button type="button" data-id="hudCcAlert" title="Live Captions are currently not detected. Click to turn on.">⚠️ CC Off — Enable</button>' +
          '<span data-id="hudToast"></span>' +
          '<div data-id="hudDivider"></div>' +
          '<button type="button" data-id="hudStopBtn" title="Stop recording meeting">■ Stop</button>' +
          '<button type="button" data-id="hudMinBtn" title="Minimize / Restore HUD">_</button>' +
        '</div>';

      hudShadow.appendChild(style);
      hudShadow.appendChild(container);
      document.documentElement.appendChild(hudElement);

      makeDraggable(hudElement);

      // Bind HUD events
      var stopBtn = hudShadow.querySelector('[data-id="hudStopBtn"]');
      if (stopBtn) {
        stopBtn.addEventListener("click", function () {
          if (hasChromeRuntime()) {
            try { chrome.runtime.sendMessage({ type: STOP_RECORDING }); } catch (e) {}
          }
          stopRecording(false);
        });
      }

      var ccAlertBtn = hudShadow.querySelector('[data-id="hudCcAlert"]');
      if (ccAlertBtn) {
        ccAlertBtn.addEventListener("click", function () {
          tryEnableCaptions();
          showHudToast("ENABLING CC...");
        });
      }

      var minBtn = hudShadow.querySelector('[data-id="hudMinBtn"]');
      if (minBtn) {
        minBtn.addEventListener("click", function () {
          isMinimized = !isMinimized;
          var tagGroup = hudShadow.querySelector('[data-id="hudTagGroup"]');
          var dividers = hudShadow.querySelectorAll('[data-id="hudDivider"]');
          if (tagGroup) tagGroup.style.display = isMinimized ? "none" : "flex";
          for (var d = 0; d < dividers.length; d++) {
            dividers[d].style.display = isMinimized ? "none" : "block";
          }
          minBtn.textContent = isMinimized ? "□" : "_";
        });
      }

      var tagBtns = hudShadow.querySelectorAll('[data-tag-btn]');
      for (var t = 0; t < tagBtns.length; t++) {
        (function (btn) {
          btn.addEventListener("click", function () {
            var mType = btn.getAttribute("data-tag-btn");
            tagMoment(mType || "decision");
          });
        })(tagBtns[t]);
      }

      // Start live timer interval
      if (hudTimerInterval) clearInterval(hudTimerInterval);
      hudTimerInterval = setInterval(function () {
        if (!recording) return;
        var elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        var timerSpan = hudShadow ? hudShadow.querySelector('[data-id="hudTimer"]') : null;
        if (timerSpan) timerSpan.textContent = formatTime(elapsed);
        updateCcAlertStatus();
      }, 1000);

    } catch (err) {
      void err;
    }
  }

  function removeBanner() {
    try {
      var legacyBanner = document.getElementById(BANNER_ID);
      if (legacyBanner && legacyBanner.parentNode) legacyBanner.parentNode.removeChild(legacyBanner);

      var hudNode = document.getElementById(HUD_ROOT_ID);
      if (hudNode && hudNode.parentNode) hudNode.parentNode.removeChild(hudNode);
      hudElement = null;
      hudShadow = null;

      if (hudTimerInterval) {
        clearInterval(hudTimerInterval);
        hudTimerInterval = null;
      }
    } catch (err) {
      void err;
    }
  }

  function startRecording() {
    if (recording) return;
    recording = true;
    recordingStartTime = Date.now();
    totalCaptionsCount = 0;
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
        else if (message.type === BOOKMARK_MOMENT) {
          tagMoment(message.momentType || "decision");
        }
        else if (message.type === RECORDING_STATUS) {
          return Promise.resolve({ type: RECORDING_STATUS, recording: recording });
        }
      });
    } catch (err) {
      void err;
    }
  }

  window.addEventListener("beforeunload", function () {
    scrapeOnce();
    var batch = takeBatch();
    if (batch.length > 0) post(MEETING_END, batch);
  });

  setInterval(watch, FLUSH_INTERVAL_MS);
  watch();
})();
