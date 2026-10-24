# EXTENSION-REPAIR-PLAN — Fix Auth, Audio Capture, HUD & Branding for Real-World Field Testing

Date: 2026-10-24 | Status: Ready to Execute | Parent: GAUGE_EXTENSION_MASTER_REPAIR_PLAN.md  
Evidence: Google Meet live test session audit (`kfy-wqqt-gxz`), 3 user-provided failure screenshots.

---

## Sequence (strictly sequential, one concern per commit/PR)

- **PR-1 (Auth & Storage Resilience):**
  - Fix key exchange and storage so the extension never loses the API key across service worker restarts.
  - Add localhost and custom domain host permissions so testing works anywhere.
  - Unblock audio recording in `offscreen.js`: NEVER abort recording on `!apiKey`. Capture audio unconditionally.
- **PR-2 (Audio Pipeline & CC Decoupling):**
  - Decouple transcription from Google Meet's DOM closed captions.
  - Tab audio + microphone via Web Audio API is primary; stream to `/api/transcribe` (Whisper/Deepgram).
  - Strip the `⚠️ CC Off — Enable` warning button and "Turn on Live Captions" banner.
- **PR-3 (Autonomous AI HUD — Kill Manual Chips):**
  - Redesign in-meeting floating HUD in `content.js`: replace `Decision`, `Objection`, `Pricing`, `Action` buttons with a sleek, distraction-free recording pill (`● GAUGE 02:45 | [Stop]`).
  - Rely 100% on `/api/analyze` to automatically extract decisions, objections, pricing, and action items.
- **PR-4 (Post-Call State Machine & Recent Calls Sync):**
  - Sidepanel transitions to "Processing AI Notes..." progress state on call end.
  - Auto-append newly completed call to `Recent calls` in the sidepanel and provide 1-click dashboard link.
- **PR-5 (Studio Obsidian UI & Official Logo):**
  - Embed official Gauge SVG logo into sidepanel and popup headers.
  - Align sidepanel CSS with website studio tokens (obsidian `#08090d`, clean glass borders, refined typography).
  - Eliminate all developer error strings.

---

## PR-1 Detailed Scope (Auth & Storage Resilience)

1. `extension/manifest.json`:
   - Add `"http://localhost/*"`, `"http://127.0.0.1/*"` to `host_permissions`.
   - Update `content_scripts` for `bridge.js` to match `http://localhost/*`, `http://127.0.0.1/*`, `https://usegauge.vercel.app/*`, `https://*.usegauge.com/*`.
2. `extension/background.js`:
   - Call `chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' }).catch(() => {})` on startup.
   - When `MESSAGE_TYPES.AUTH_SYNC` arrives, persist the API key in both `chrome.storage.session` and `chrome.storage.local` (as `gauge_api_key_persistent`).
3. `extension/shared.js`:
   - `getApiKeyFromSession()`: check `chrome.storage.session` first; if empty, fallback to `chrome.storage.local.get("gauge_api_key_persistent")`.
   - `setApiKeyInSession(apiKey)`: set in both session and local storage.
4. `extension/offscreen.js`:
   - In `startCapture`: remove the hard exit `if (!apiKey) return { ok: false, error }`.
   - Instead, if `!apiKey`, log warning and continue recording tab + mic audio. Slices will be stored. If auth syncs before call ends, upload seamlessly; if not, prompt 1-click save/upload without losing data.
5. `src/app/api/v1/keys/exchange/route.ts`:
   - Verify key creation works for all authenticated users, including free tier users.

---

## PR-2 Detailed Scope (Audio Pipeline & CC Decoupling)

1. `extension/content.js`:
   - Remove `tryEnableCaptions` and the `⚠️ CC Off — Enable` button from the HUD template and styles.
   - Demote DOM scraping to an auxiliary fallback.
2. `extension/sidepanel.html` & `extension/sidepanel.js`:
   - Remove line 702: `💡 Turn on Live Captions (CC) in your meeting for AI notes.`.
   - In the Live Captions / Audio section, display real-time audio status: "Audio streaming active · 32kbps Opus".
3. `extension/offscreen.js`:
   - Ensure clean mix of user mic + tab loopback without clipping.

---

## PR-3 Detailed Scope (HUD Simplification)

1. `extension/content.js`:
   - Replace lines 355-361 tag buttons with:
     - Minimal pill: `● GAUGE` (pulsing dot) + Timer `00:00` + Audio level meter + `■ Stop`.
     - Optional single subtle `★ Bookmark` button for marking key moments.
   - Clean up HUD CSS styles to match the website's minimalist dark styling.

---

## PR-4 Detailed Scope (Post-Call State Machine)

1. `extension/sidepanel.js`:
   - On `STOP_RECORDING` or `MEETING_END`, set sidepanel state to "Processing AI Notes..." with an animated progress bar.
   - When `OFFSCREEN_DONE` fires with a new call ID and summary, immediately:
     - Prepend the new call to the stored `recentCalls` array.
     - Re-render the `Recent calls` list.
     - Display a prominent card: `✓ AI Notes Generated: [View in Gauge ↗]`.

---

## PR-5 Detailed Scope (Branding & Design Elevation)

1. `extension/sidepanel.html` & `extension/popup.html`:
   - Replace the generic Lucide spark icon (`<svg viewBox="0 0 24 24"...>`) with the official Gauge SVG mark (`public/logo.svg`).
   - Refactor sidepanel styling: replace bright purple/yellow highlights with obsidian studio palette (`#08090d`, subtle zinc borders, crisp monospace counters).
   - Strip all raw developer strings ("Paste your Bearer key in the side panel first", "No API key in session storage"). Replace with clear, polished UI copy.

---

## Verification Gates (Each PR)
- `npm test` (vitest run — all 182 test files green)
- Extension package test: `npm test src/test/extension-*.test.ts`
- Clean `git status --short`
