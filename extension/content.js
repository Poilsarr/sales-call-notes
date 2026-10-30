/* Gauge - Meeting Content Script (Part 3B + Ambient Background HUD).
 *
 * Defensive caption scrape: reads ONLY aria-live regions + document.title.
 * No CSS-class selectors anywhere in this file - Meet/Teams/Zoom rotate
 * hashed class names on every deploy, so classes must never be a dependency.
 * The DOM_ADAPTER object below is version-pinned and mirrors
 * DOM_ADAPTER in shared.js (content scripts cannot import ES modules).
 * Keep DOM_ADAPTER_VERSION identical in both files.
 *
 * Message contract: posts { type: CAPTIONS_UPDATE | MEETING_END,
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
  var MEETING_FINALIZE_SUCCESS = "MEETING_FINALIZE_SUCCESS";

  var captions = [];
  var recording = false;
  var meetingTitle = "";
  var lastSeenByRoot = [];
  var flushTimer = null;
  var hudTimerInterval = null;
  var subtitleFadeTimer = null;
  var recordingStartTime = 0;
  var totalCaptionsCount = 0;
  var hudElement = null;
  var hudShadow = null;
  var isMinimized = false;
  var currentHudMode = "idle"; // "idle" | "recording" | "finalizing" | "completed"
  var lastCompletedCall = null;

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

  function isMeetingPage() {
    try {
      var url = window.location.href || "";
      if (url.indexOf("meet.google.com") !== -1) {
        var path = window.location.pathname.replace(/^\/+|\/+$/g, "");
        return path.length > 0 && path !== "landing" && path !== "about";
      }
      if (url.indexOf("teams.") !== -1) return true;
      if (url.indexOf("zoom.us/wc") !== -1 || url.indexOf("zoom.us/j") !== -1) return true;
    } catch (e) {}
    return true; // default true in injected contexts
  }

  function isMeetingLobby() {
    try {
      // 1. If in-call leave/hangup button is present, we are DEFINITELY inside an active call!
      var inCallLeaveBtn = document.querySelector(
        'button[aria-label*="Leave call" i], button[aria-label*="hang up" i], button[data-tooltip*="Leave call" i], button[aria-label*="End call" i], button[aria-label*="Leave meeting" i], button[aria-label*="End meeting" i]'
      );
      if (inCallLeaveBtn) return false;

      // 2. Check for explicit lobby/join buttons (case-insensitive search)
      var lobbyJoinBtn = document.querySelector(
        'button[aria-label*="Join now" i], button[aria-label*="Ask to join" i], button[aria-label*="Join meeting" i]'
      );
      if (lobbyJoinBtn) return true;

      // 3. Check for Google Meet / Teams pre-join headings or prompt text
      var bodyText = document.body ? (document.body.innerText || "") : "";
      if (
        bodyText.indexOf("Ready to join?") !== -1 ||
        bodyText.indexOf("No one else is here") !== -1 ||
        bodyText.indexOf("Choose your audio and video") !== -1 ||
        bodyText.indexOf("Waiting for host") !== -1
      ) {
        return true;
      }

      // 4. Scan button text
      var buttons = document.querySelectorAll("button");
      for (var i = 0; i < buttons.length; i++) {
        var t = (buttons[i].textContent || "").trim().toLowerCase();
        if (t === "join now" || t === "ask to join" || t === "join meeting") {
          return true;
        }
      }
    } catch (e) {
      void e;
    }
    return false;
  }

  function findCaptionRoots() {
    var seen = [];
    var out = [];
    var selectors = DOM_ADAPTER.captionSelectors.concat([
      '[aria-label*="caption" i]',
      '[aria-label*="subtitles" i]',
      'div[role="region"][aria-label*="caption" i]',
      'div[role="region"][aria-label*="subtitles" i]',
      '[data-sender-name]'
    ]);
    for (var i = 0; i < selectors.length; i += 1) {
      var nodes = [];
      try {
        nodes = document.querySelectorAll(selectors[i]);
      } catch (err) {
        void err;
        continue;
      }
      for (var j = 0; j < nodes.length; j += 1) {
        var n = nodes[j];
        if (!n) continue;
        // Don't scrape our own banner or HUD elements as captions!
        if (n.id === BANNER_ID || n.id === HUD_ROOT_ID) continue;
        if (n.closest && (n.closest("#" + BANNER_ID) || n.closest("#" + HUD_ROOT_ID))) continue;

        if (seen.indexOf(n) === -1) {
          seen.push(n);
          out.push(n);
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
      // Preserve line breaks between block elements (speaker name vs text)
      return String(raw)
        .replace(/[ \t\r\f\v]+/g, " ")
        .replace(/\n\s+/g, "\n")
        .trim()
        .slice(0, 4000);
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

  function updateLiveSubtitle(rawText) {
    if (!hudShadow) return;
    var pill = hudShadow.querySelector('[data-id="hudSubtitlePill"]');
    var spk = hudShadow.querySelector('[data-id="hudSubtitleSpeaker"]');
    var txt = hudShadow.querySelector('[data-id="hudSubtitleText"]');
    if (!pill || !txt || !rawText) return;

    var parsed = parseSpeaker(rawText);
    if (spk) {
      spk.textContent = parsed.speaker ? parsed.speaker + ":" : "You:";
      spk.style.display = parsed.speaker || rawText ? "inline" : "none";
    }
    txt.textContent = parsed.text || rawText;

    pill.style.opacity = "1";
    pill.style.transform = "translateY(0)";

    if (subtitleFadeTimer) clearTimeout(subtitleFadeTimer);
    subtitleFadeTimer = setTimeout(function () {
      if (pill) {
        pill.style.opacity = "0";
        pill.style.transform = "translateY(6px)";
      }
    }, 3800);
  }

  function scrapeOnce() {
    meetingTitle = getMeetingTitle();
    var roots = findCaptionRoots();
    var fresh = [];
    for (var i = 0; i < roots.length; i += 1) {
      var node = roots[i];
      var text = readRootText(node);
      if (!text) continue;
      // Skip text from Gauge's own banners or setup notices
      if (text.indexOf("Gauge is recording") !== -1) continue;

      if (node._gaugeLastSeenText === text) continue;
      node._gaugeLastSeenText = text;
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
        updateLiveSubtitle(combined);
      } else if (combined.length > prev.length) {
        captions[captions.length - 1] = {
          text: combined.slice(0, 4000),
          timestamp: Date.now()
        };
        totalCaptionsCount += 1;
        emitLiveChunk(combined);
        updateLiveSubtitle(combined);
      }
    }
  }

  var captionObserver = null;
  function startCaptionObserver() {
    if (captionObserver) return;
    try {
      var MutationObs = window.MutationObserver || window.WebKitMutationObserver;
      if (!MutationObs) return;
      captionObserver = new MutationObs(function () {
        if (!recording) return;
        scrapeOnce();
      });
      captionObserver.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    } catch (e) {}
  }

  function stopCaptionObserver() {
    if (captionObserver) {
      try { captionObserver.disconnect(); } catch (e) {}
      captionObserver = null;
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

  function makeDraggable(container) {
    var startX = 0, startY = 0, initialLeft = 0, initialTop = 0;
    var isDragging = false;

    function onPointerDown(e) {
      // Don't drag if clicking buttons, links or inputs
      if (e.target && (e.target.tagName === "BUTTON" || e.target.closest("button") || e.target.tagName === "A")) return;
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

  function setHudMode(mode, meta) {
    currentHudMode = mode;
    if (mode === "idle" && !recording) {
      removeBanner();
      return;
    }
    if (!hudShadow) return;

    var idleGroup = hudShadow.querySelector('[data-id="hudIdleGroup"]');
    var recGroup = hudShadow.querySelector('[data-id="hudRecGroup"]');
    var finalGroup = hudShadow.querySelector('[data-id="hudFinalizingGroup"]');
    var doneGroup = hudShadow.querySelector('[data-id="hudDoneGroup"]');
    var subPill = hudShadow.querySelector('[data-id="hudSubtitlePill"]');

    if (idleGroup) idleGroup.style.display = mode === "idle" ? "flex" : "none";
    if (recGroup) recGroup.style.display = mode === "recording" ? "flex" : "none";
    if (finalGroup) finalGroup.style.display = mode === "finalizing" ? "flex" : "none";
    if (doneGroup) doneGroup.style.display = mode === "completed" ? "flex" : "none";

    if (mode === "completed" && meta) {
      lastCompletedCall = meta;
    }

    if (mode !== "recording" && subPill) {
      subPill.style.opacity = "0";
    }
  }

  function ensureBanner() {
    try {
      // Only display the floating HUD if actively recording or finalizing/completed.
      // Never display the HUD when idle or in the pre-meeting lobby.
      if (!recording && currentHudMode !== "finalizing" && currentHudMode !== "completed") {
        removeBanner();
        return;
      }
      if (isMeetingLobby() && !recording) {
        removeBanner();
        return;
      }

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
      if (document.getElementById(HUD_ROOT_ID)) {
        setHudMode(recording ? "recording" : currentHudMode);
        return;
      }

      hudElement = document.createElement("div");
      hudElement.id = HUD_ROOT_ID;
      hudElement.setAttribute("style", "all:initial;position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:2147483647;");
      
      hudShadow = hudElement.attachShadow({ mode: "closed" });
      var style = document.createElement("style");
      style.textContent =
        "@keyframes hudPulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(0.9);}}" +
        "@keyframes hudWave{0%,100%{transform:scaleY(0.35);}50%{transform:scaleY(1);}}" +
        "@keyframes hudSpin{to{transform:rotate(360deg);}}" +
        "[data-hud-root]{all:initial;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased;user-select:none;display:flex;flex-direction:column;align-items:center;}" +
        "[data-id='hudSubtitlePill']{" +
          "display:flex;align-items:center;gap:8px;background:rgba(9,10,15,0.72);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);" +
          "border:1px solid rgba(255,255,255,0.12);box-shadow:0 12px 28px -4px rgba(0,0,0,0.65),0 0 0 1px rgba(255,255,255,0.05);" +
          "border-radius:9999px;padding:6px 14px;color:#ffffff;margin-bottom:8px;opacity:0;transform:translateY(6px);" +
          "transition:opacity 0.25s cubic-bezier(0.16,1,0.3,1),transform 0.25s cubic-bezier(0.16,1,0.3,1);pointer-events:none;max-width:540px;" +
        "}" +
        "[data-id='hudSubtitleDot']{width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;flex-shrink:0;animation:hudPulse 1.4s ease-in-out infinite;}" +
        "[data-id='hudSubtitleSpeaker']{font-size:11px;font-weight:700;color:#a5b4fc;text-transform:uppercase;letter-spacing:0.04em;flex-shrink:0;}" +
        "[data-id='hudSubtitleText']{font-size:12.5px;font-weight:500;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:420px;}" +
        "[data-id='hudContainer']{" +
          "display:flex;align-items:center;gap:10px;background:rgba(9,10,15,0.85);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);" +
          "border:1px solid rgba(255,255,255,0.13);box-shadow:0 18px 40px -4px rgba(0,0,0,0.75),0 0 0 1px rgba(255,255,255,0.06);" +
          "border-radius:9999px;padding:6px 14px;color:#ffffff;cursor:grab;transition:all 0.2s cubic-bezier(0.16,1,0.3,1);" +
        "}" +
        "[data-id='hudContainer']:hover{background:rgba(9,10,15,0.92);border-color:rgba(255,255,255,0.2);}" +
        "[data-id='hudDot']{width:8px;height:8px;border-radius:50%;background:#ef4444;box-shadow:0 0 10px rgba(239,68,68,0.8);animation:hudPulse 1.4s ease-in-out infinite;flex-shrink:0;}" +
        "[data-id='hudBrand']{font-size:11px;font-weight:700;letter-spacing:0.08em;color:#f8fafc;text-transform:uppercase;display:inline-flex;align-items:center;gap:5px;}" +
        "[data-id='hudTimer']{font-size:12px;font-weight:600;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#e2e8f0;min-width:42px;text-align:center;}" +
        "[data-id='hudDivider']{width:1px;height:14px;background:rgba(255,255,255,0.14);}" +
        "[data-id='hudWave']{display:flex;align-items:center;gap:2.5px;height:12px;padding:0 2px;}" +
        "[data-bar]{width:2.5px;background:#6366f1;border-radius:1px;animation:hudWave 1.1s ease-in-out infinite;}" +
        "[data-bar='1']{height:5px;animation-delay:0s;}" +
        "[data-bar='2']{height:11px;animation-delay:0.2s;background:#818cf8;}" +
        "[data-bar='3']{height:7px;animation-delay:0.4s;}" +
        ".rec-dot-icon{width:7px;height:7px;border-radius:50%;background:#ef4444;box-shadow:0 0 8px rgba(239,68,68,0.7);}" +
        ".hud-rec-btn{background:rgba(239,68,68,0.14);border:1px solid rgba(239,68,68,0.35);color:#fca5a5;border-radius:9999px;padding:4px 11px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all 0.15s;}" +
        ".hud-rec-btn:hover{background:rgba(239,68,68,0.28);border-color:rgba(239,68,68,0.6);color:#ffffff;transform:translateY(-1px);}" +
        "[data-id='hudBookmarkBtn']{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#e2e8f0;border-radius:9999px;padding:3px 9px;font-size:10.5px;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:all 0.15s;}" +
        "[data-id='hudBookmarkBtn']:hover{background:rgba(255,255,255,0.14);border-color:rgba(255,255,255,0.22);color:#ffffff;transform:translateY(-1px);}" +
        "[data-id='hudStopBtn']{background:rgba(239,68,68,0.18);border:1px solid rgba(239,68,68,0.4);color:#fca5a5;border-radius:9999px;padding:3px 10px;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all 0.15s;}" +
        "[data-id='hudStopBtn']:hover{background:rgba(239,68,68,0.32);border-color:rgba(239,68,68,0.65);color:#ffffff;transform:translateY(-1px);}" +
        "[data-id='hudMinBtn']{background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:2px 5px;font-size:12px;border-radius:4px;}" +
        "[data-id='hudMinBtn']:hover{color:#ffffff;background:rgba(255,255,255,0.1);}" +
        "[data-id='hudToast']{display:none;background:#22c55e;color:#052e16;font-size:10px;font-weight:700;padding:2px 8px;border-radius:9999px;letter-spacing:0.04em;}" +
        ".hud-spin-ring{width:12px;height:12px;border:2px solid rgba(99,102,241,0.25);border-top-color:#818cf8;border-radius:50%;animation:hudSpin 0.8s linear infinite;}";

      var container = document.createElement("div");
      container.setAttribute("data-hud-root", "true");
      container.innerHTML =
        '<div data-id="hudSubtitlePill">' +
          '<span data-id="hudSubtitleDot"></span>' +
          '<span data-id="hudSubtitleSpeaker">You:</span>' +
          '<span data-id="hudSubtitleText">Listening…</span>' +
        '</div>' +
        '<div data-id="hudContainer">' +
          // 1. Idle state (in call, ready to record with 1-click in the meeting)
          '<div data-id="hudIdleGroup" style="display:flex;align-items:center;gap:8px;">' +
            '<svg width="17" height="17" viewBox="0 0 100 100" fill="none">' +
              '<path d="M50 8 L86 29 L86 71 L50 92 L14 71 L14 29 Z" stroke="#6366f1" stroke-width="6" fill="none"/>' +
              '<path d="M50 24 L74 38 L74 62 L50 76 L26 62 L26 38 Z" stroke="#818cf8" stroke-width="6" fill="none"/>' +
              '<circle cx="50" cy="50" r="7" fill="#ffffff"/>' +
            '</svg>' +
            '<span data-id="hudBrand">GAUGE</span>' +
            '<div data-id="hudDivider"></div>' +
            '<button type="button" data-id="hudRecordBtn" class="hud-rec-btn" title="Start recording call (Alt+Shift+R)">' +
              '<span class="rec-dot-icon"></span>' +
              '<span>Record Call</span>' +
            '</button>' +
          '</div>' +
          // 2. Active recording state
          '<div data-id="hudRecGroup" style="display:none;align-items:center;gap:10px;">' +
            '<div data-id="hudDot"></div>' +
            '<span data-id="hudBrand">GAUGE</span>' +
            '<span data-id="hudTimer">00:00</span>' +
            '<div data-id="hudDivider"></div>' +
            '<div data-id="hudWave">' +
              '<span data-bar="1"></span>' +
              '<span data-bar="2"></span>' +
              '<span data-bar="3"></span>' +
            '</div>' +
            '<div data-id="hudDivider"></div>' +
            '<button type="button" data-id="hudBookmarkBtn" title="Bookmark critical moment (Alt+Shift+B)">★ Bookmark</button>' +
            '<span data-id="hudToast"></span>' +
            '<button type="button" data-id="hudStopBtn" title="Finish call and generate AI notes">■ Finish</button>' +
            '<button type="button" data-id="hudMinBtn" title="Minimize / Restore HUD">_</button>' +
          '</div>' +
          // 3. Finalizing state
          '<div data-id="hudFinalizingGroup" style="display:none;align-items:center;gap:8px;">' +
            '<span class="hud-spin-ring"></span>' +
            '<span style="font-size:12px;font-weight:600;color:#c7d2fe;">Generating AI Sales Notes…</span>' +
          '</div>' +
          // 4. Completed state
          '<div data-id="hudDoneGroup" style="display:none;align-items:center;gap:10px;">' +
            '<span style="font-size:12px;font-weight:700;color:#34d399;">✨ AI Notes Ready!</span>' +
            '<button type="button" data-id="hudViewNotesBtn" style="background:linear-gradient(135deg,#6366f1,#4f46e5);border:none;color:#ffffff;border-radius:9999px;padding:3px 12px;font-size:11px;font-weight:600;cursor:pointer;">View Summary →</button>' +
            '<button type="button" data-id="hudCloseDoneBtn" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;font-size:12px;padding:2px 6px;">✕</button>' +
          '</div>' +
        '</div>';

      hudShadow.appendChild(style);
      hudShadow.appendChild(container);
      document.documentElement.appendChild(hudElement);

      makeDraggable(hudElement);

      // Bind HUD interactive events
      var recordBtn = hudShadow.querySelector('[data-id="hudRecordBtn"]');
      if (recordBtn) {
        recordBtn.addEventListener("click", function () {
          if (hasChromeRuntime()) {
            recordBtn.disabled = true;
            recordBtn.innerHTML = '<span class="hud-spin-ring"></span><span>Starting…</span>';
            chrome.runtime.sendMessage({
              type: START_RECORDING,
              meetingTitle: getMeetingTitle(),
            }, function (res) {
              recordBtn.disabled = false;
              recordBtn.innerHTML = '<span class="rec-dot-icon"></span><span>Record Call</span>';
              if (res && res.ok === false) {
                if (res.needsMicPermission || String(res.error).includes("microphone")) {
                  showHudToast("MICROPHONE PERMISSION NEEDED");
                } else {
                  showHudToast("CAPTURE FAILED");
                }
              } else {
                startRecording();
              }
            });
          } else {
            startRecording();
          }
        });
      }

      var stopBtn = hudShadow.querySelector('[data-id="hudStopBtn"]');
      if (stopBtn) {
        stopBtn.addEventListener("click", function () {
          setHudMode("finalizing");
          if (hasChromeRuntime()) {
            try { chrome.runtime.sendMessage({ type: STOP_RECORDING }); } catch (e) {}
          }
          stopRecording(true);
        });
      }

      var bookmarkBtn = hudShadow.querySelector('[data-id="hudBookmarkBtn"]');
      if (bookmarkBtn) {
        bookmarkBtn.addEventListener("click", function () {
          tagMoment("bookmark");
        });
      }

      var minBtn = hudShadow.querySelector('[data-id="hudMinBtn"]');
      if (minBtn) {
        minBtn.addEventListener("click", function () {
          isMinimized = !isMinimized;
          var wave = hudShadow.querySelector('[data-id="hudWave"]');
          var bookmark = hudShadow.querySelector('[data-id="hudBookmarkBtn"]');
          var dividers = hudShadow.querySelectorAll('[data-id="hudDivider"]');
          if (wave) wave.style.display = isMinimized ? "none" : "flex";
          if (bookmark) bookmark.style.display = isMinimized ? "none" : "inline-flex";
          for (var d = 0; d < dividers.length; d++) {
            dividers[d].style.display = isMinimized ? "none" : "block";
          }
          minBtn.textContent = isMinimized ? "□" : "_";
        });
      }

      var viewNotesBtn = hudShadow.querySelector('[data-id="hudViewNotesBtn"]');
      if (viewNotesBtn) {
        viewNotesBtn.addEventListener("click", function () {
          if (lastCompletedCall && lastCompletedCall.callUrl) {
            window.open(lastCompletedCall.callUrl, "_blank");
          } else {
            window.open("https://usegauge.vercel.app/app/calls", "_blank");
          }
          currentHudMode = "idle";
          removeBanner();
        });
      }

      var closeDoneBtn = hudShadow.querySelector('[data-id="hudCloseDoneBtn"]');
      if (closeDoneBtn) {
        closeDoneBtn.addEventListener("click", function () {
          currentHudMode = "idle";
          removeBanner();
        });
      }

      // Initialize mode
      setHudMode(recording ? "recording" : currentHudMode);

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
    setHudMode("recording");
    tryEnableCaptions();
    scrapeOnce();
    startCaptionObserver();

    if (hudTimerInterval) clearInterval(hudTimerInterval);
    hudTimerInterval = setInterval(function () {
      if (!recording) return;
      var elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
      var timerSpan = hudShadow ? hudShadow.querySelector('[data-id="hudTimer"]') : null;
      if (timerSpan) timerSpan.textContent = formatTime(elapsed);
    }, 1000);

    if (flushTimer == null) {
      flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);
    }
  }

  function stopRecording(final) {
    stopCaptionObserver();
    if (!recording && captions.length === 0) {
      currentHudMode = "idle";
      removeBanner();
      return;
    }
    recording = false;
    scrapeOnce();
    var batch = takeBatch();
    if (batch.length > 0 || final) post(MEETING_END, batch);
    if (flushTimer != null) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
    if (hudTimerInterval) {
      clearInterval(hudTimerInterval);
      hudTimerInterval = null;
    }
    if (final) {
      setHudMode("finalizing");
    } else {
      currentHudMode = "idle";
      removeBanner();
    }
  }

  function setupMeetingExitListeners() {
    // 1. Capture click on Leave call button in Google Meet, Teams, Zoom
    document.addEventListener("click", function (e) {
      if (!recording) return;
      var target = e.target;
      var leaveBtn = target && target.closest && target.closest(
        'button[aria-label*="Leave" i], button[data-tooltip*="Leave" i], button[aria-label*="hangup" i], button[aria-label*="end call" i]'
      );
      if (leaveBtn) {
        console.debug("[Gauge] Call leave button clicked; auto-stopping recording");
        stopRecording(true);
      }
    }, true);

    // 2. DOM MutationObserver detecting Google Meet exit screen ("You left the meeting")
    try {
      var exitObserver = new MutationObserver(function () {
        if (!recording) return;
        var text = document.body ? (document.body.innerText || "") : "";
        if (
          text.indexOf("You left the meeting") !== -1 ||
          text.indexOf("Return to home screen") !== -1 ||
          document.querySelector('[data-call-ended="true"]')
        ) {
          console.debug("[Gauge] Call ended overlay detected; auto-stopping recording");
          stopRecording(true);
        }
      });
      exitObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
    } catch (e) {}

    // 3. Tab unload / navigation
    window.addEventListener("beforeunload", function () {
      if (recording) {
        stopRecording(true);
      }
    });
    window.addEventListener("pagehide", function () {
      if (recording) {
        stopRecording(true);
      }
    });
  }

  // Passive caption watch: track titles and maintain clean HUD lifecycle.
  // Synchronizes recording state with chrome.storage.local continuously.
  function watch() {
    meetingTitle = getMeetingTitle();
    if (hasChromeRuntime() && chrome.storage && chrome.storage.local) {
      try {
        chrome.storage.local.get({ recording: false }, function (data) {
          if (data && data.recording && !recording) {
            startRecording();
          } else if (data && !data.recording && recording) {
            stopRecording(false);
          }
        });
      } catch (e) {}
    }
    if (!recording) {
      if (currentHudMode !== "completed" && currentHudMode !== "finalizing") {
        removeBanner();
      }
      return;
    }
    ensureBanner();
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
        else if (message.type === LIVE_TRANSCRIPT_CHUNK) {
          var formatted = message.speaker ? message.speaker + ": " + message.text : message.text;
          updateLiveSubtitle(formatted);
        }
        else if (message.type === MEETING_FINALIZE_SUCCESS || message.type === "MEETING_FINALIZE_SUCCESS") {
          setHudMode("completed", message.call);
          setTimeout(function () {
            if (currentHudMode === "completed") {
              currentHudMode = "idle";
              removeBanner();
            }
          }, 35000);
        }
        else if (message.type === RECORDING_STATUS) {
          return Promise.resolve({ type: RECORDING_STATUS, recording: recording, inLobby: isMeetingLobby() });
        }
      });
    } catch (err) {
      void err;
    }
  }

  setupMeetingExitListeners();
  setInterval(watch, FLUSH_INTERVAL_MS);
  watch();
})();
