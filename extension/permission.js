(function () {
  "use strict";

  var grantBtn = document.getElementById("grantBtn");
  var statusBox = document.getElementById("statusBox");

  function setStatus(text, type) {
    if (!statusBox) return;
    statusBox.textContent = text;
    statusBox.className = "status " + (type || "");
    statusBox.style.display = text ? "block" : "none";
  }

  function closeSoon() {
    setTimeout(function () {
      try {
        if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.getCurrent) {
          chrome.tabs.getCurrent(function (tab) {
            if (tab && tab.id) {
              chrome.tabs.remove(tab.id);
            } else {
              window.close();
            }
          });
        } else {
          window.close();
        }
      } catch (e) {
        window.close();
      }
    }, 900);
  }

  async function checkExistingPermission() {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        var status = await navigator.permissions.query({ name: "microphone" });
        if (status && status.state === "granted") {
          if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
            await chrome.storage.local.set({ micPermissionGranted: true });
          }
          setStatus("✓ Microphone permission already active! Returning to your call...", "success");
          if (grantBtn) grantBtn.disabled = true;
          closeSoon();
          return true;
        }
      }
    } catch (e) {
      // permissions.query not supported for mic in some browser versions — fall through
    }
    return false;
  }

  async function requestMicrophone() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("Your browser does not support audio capture. Please update Chrome.", "error");
      return;
    }

    if (grantBtn) {
      grantBtn.disabled = true;
      grantBtn.textContent = "Requesting permission…";
    }

    try {
      var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop stream immediately to release the hardware mic
      if (stream && stream.getTracks) {
        stream.getTracks().forEach(function (track) {
          track.stop();
        });
      }

      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ micPermissionGranted: true });
      }

      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        try {
          chrome.runtime.sendMessage({ type: "MIC_PERMISSION_GRANTED" });
        } catch (e) {}
      }

      setStatus("✓ Microphone access granted! You can now record in the background. Closing…", "success");
      closeSoon();
    } catch (err) {
      console.warn("[Gauge] Microphone request failed:", err);
      if (grantBtn) {
        grantBtn.disabled = false;
        grantBtn.textContent = "Try Again";
      }
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setStatus(
          "Permission was blocked. Click the lock/settings icon in the address bar above, set Microphone to 'Allow', and click Try Again.",
          "error"
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setStatus("No microphone device was detected on your system. Please connect a microphone.", "error");
      } else {
        setStatus("Could not access microphone: " + (err.message || err.name), "error");
      }
    }
  }

  if (grantBtn) {
    grantBtn.addEventListener("click", requestMicrophone);
  }

  checkExistingPermission();
})();
