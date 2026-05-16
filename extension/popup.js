document.getElementById("openApp").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://app.callnotepro.com" });
});

document.getElementById("viewHistory").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://app.callnotepro.com/dashboard" });
});

// Check if we're on a Google Meet tab
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  if (tab.url && tab.url.includes("meet.google.com")) {
    document.getElementById("statusDot").className = "status-dot active";
    document.getElementById("statusText").textContent = "Capturing Meeting";
    document.getElementById("meetingInfo").textContent = "Google Meet detected - captions will be recorded";
  } else {
    document.getElementById("statusDot").className = "status-dot inactive";
    document.getElementById("statusText").textContent = "Extension Idle";
    document.getElementById("meetingInfo").textContent = "Open Google Meet to start capturing";
  }
});
