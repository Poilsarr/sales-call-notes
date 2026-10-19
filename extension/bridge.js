/**
 * Gauge Extension - Web Bridge Content Script
 * Runs on https://usegauge.vercel.app/*
 *
 * Facilitates zero-friction auth synchronization between the web app
 * (Clerk session) and the Chrome Extension background service worker.
 */

(function () {
  "use strict";

  // Listen for custom events dispatched by the web app (e.g. /extension/connect)
  window.addEventListener("gauge:extension-sync", function (event) {
    if (!event.detail) return;
    try {
      if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({
          type: "AUTH_SYNC",
          apiKey: event.detail.apiKey,
          plan: event.detail.plan,
          user: event.detail.user,
        });
      }
    } catch (e) {
      // Extension context invalidated or not loaded
    }
  });

  // Check stored auth token in localStorage if available
  try {
    var saved = localStorage.getItem("gauge_extension_auth");
    if (saved) {
      var parsed = JSON.parse(saved);
      if (parsed && typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({
          type: "AUTH_SYNC",
          apiKey: parsed.apiKey,
          plan: parsed.plan,
          user: parsed.user,
        });
      }
    }
  } catch (e) {}

  // Proactively check session via same-origin GET
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    fetch("/api/v1/keys/exchange", { method: "GET" })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (data) {
        if (data && data.authenticated && data.user) {
          // Immediately sync current plan tier and user profile to extension
          chrome.runtime.sendMessage({
            type: "AUTH_SYNC",
            plan: data.plan || "free",
            user: data.user,
          });

          // Also request key mint so offscreen/background has credentials
          fetch("/api/v1/keys/exchange", { method: "POST" })
            .then(function (r) {
              return r.ok ? r.json() : null;
            })
            .then(function (keyData) {
              if (keyData && keyData.raw) {
                chrome.runtime.sendMessage({
                  type: "AUTH_SYNC",
                  apiKey: keyData.raw,
                  plan: keyData.plan || data.plan || "free",
                  user: keyData.user || data.user,
                });
              }
            })
            .catch(function () {});
        }
      })
      .catch(function () {});
  }
})();
