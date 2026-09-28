# Gauge — Meeting Notes · Chrome Web Store listing

> Manifest version this listing describes: **1.0.0** (MV3).
> Do not lower the manifest version — new submissions only bump it.

## Title

Gauge - Meeting Notes

## Short description (≤ 132 chars, currently 81)

Capture meeting captions and audio on Record click, then generate AI sales notes.

## Category

Productivity

## Full description

Gauge turns your sales calls into notes while the meeting is still happening.

HOW IT WORKS
1. Open the Gauge side panel and paste your API key (see Reviewer notes below for how to mint one).
2. Join a Google Meet, Microsoft Teams, or Zoom meeting in the browser.
3. Click Record in the side panel. Gauge captures the meeting tab's audio stream plus live captions — only from that click onward.
4. Click Stop, then Send. Gauge uploads the audio + transcript and returns AI-powered sales notes (summary, action items, follow-ups) in your Gauge call history.

WHAT IT CAPTURES
- Meeting tab audio (via tab capture) and on-page live captions (via a content script on meeting pages only).
- Nothing is captured before you click Record. Stopping ends the capture and releases the microphone/tab stream immediately.

WHAT IT NEVER DOES
- No background or always-on recording. No keystroke, screen, or browsing-history collection.
- Your API key lives in chrome.storage.session (memory-only, cleared when the browser closes) — never in persistent local storage.
- Zero third-party SDKs or analytics in the extension. Network calls go only to the meeting page you are on and to the Gauge app origin.

Learn more: https://usegauge.vercel.app/privacy

## Permissions — justification (all tied to the Record-click capture)

| Permission | Why it is needed |
|---|---|
| storage | Persists the caption buffer + upload state locally (chrome.storage.local) so closing the tab mid-meeting never loses captions. The API key itself is kept in chrome.storage.session (memory-only), never here. |
| tabCapture | Captures the meeting TAB audio stream, and only after the user clicks Record in the side panel. Never auto-starts; the stream is released on Stop. |
| offscreen | Hosts the MediaRecorder (32kbps Opus) in an offscreen document, because MV3 service workers terminate after ~30s and cannot hold a MediaStream. Created lazily on the first Record click, closed on Stop. |
| sidePanel | Hosts the recorder UI: paste Bearer key, Record / Stop / Send buttons, recent-call list. |
| alarms | Retries the captions-finalize POST after a service-worker restart (respects the SW ~30s lifetime — no setTimeout chains). |

Host permissions:

| Host | Why it is needed |
|---|---|
| https://meet.google.com/* | Meeting pages where caption scraping + tab audio capture run — and only there. |
| https://teams.microsoft.com/* | Meeting pages where caption scraping + tab audio capture run — and only there. |
| https://*.zoom.us/* | Meeting pages where caption scraping + tab audio capture run — and only there. |
| https://usegauge.vercel.app/* | Gauge API origin: /api/upload-url, /api/analyze, /api/v1/calls with the user's Bearer key. No other origin receives extension traffic. |

Removed (deliberately NOT requested): identity, activeTab, cookies. Auth is a pasted Bearer key, so the extension never touches browser identity or cookies.

## Privacy

- Record-click-only audio: capture starts on the user's Record click and ends on Stop; there is no passive or background recording.
- API key in chrome.storage.session: memory-only, cleared on browser close, sent solely as an Authorization: Bearer header to the Gauge app origin.
- Zero third-party SDKs: no analytics, ads, crash-reporting, or external scripts bundled or loaded.
- Privacy policy: https://usegauge.vercel.app/privacy
- Support: <SUPPORT_EMAIL>

## Reviewer test instructions

Key source (verified read-only against the codebase): `POST /api/v1/keys/exchange`
(see `src/app/api/v1/keys/exchange/route.ts`). It is Clerk-gated: the signed-in
web app calls it once and receives a `read_write` API key whose `raw` value is
returned ONCE. Guards mirror `POST /api/v1/keys`: 5/hr per-user creation cap
(shared bucket) + `api_access` plan gate (Pro plan). The key is named
`extension-<yyyy-mm-dd>`.

Steps to test the submission:
1. Sign in to https://usegauge.vercel.app with a Clerk account on a plan with API access (Pro).
2. As that signed-in user, `POST /api/v1/keys/exchange` (session cookie auth). Copy the returned `raw` key (`cn_live_…` / `cn_test_…`).
3. Install the submitted extension build, open the Gauge side panel, paste the Bearer key.
4. Join a Google Meet / Teams / Zoom meeting in a tab, then click Record in the side panel. Confirm capture starts only at that click.
5. Click Stop (stream released), then Send. Confirm the call uploads and appears in the Gauge call history with AI notes.
6. Reload the extension / restart the browser and confirm the key is gone (session storage) and no audio was captured without a fresh Record click.

## Icons

| Size | File | Used in |
|---|---|---|
| 16 | extension/icon16.png | toolbar / favicon (`action.default_icon`, `icons`) |
| 48 | extension/icon48.png | extension management page (`action.default_icon`, `icons`) |
| 128 | extension/icon128.png | Web Store listing + install dialog (`action.default_icon`, `icons`) |

Source: extension/icon.svg (see extension/generate-icons.sh).
