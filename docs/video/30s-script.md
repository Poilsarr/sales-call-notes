# Gauge — 30s Demo Script (premium, no AI slop)

**Duration:** 30s exactly (1920×816, 2.35:1 cinematic fits hero player `aspectRatio: "2.35 / 1"`)

**Deliverables:**
- `public/demo-video.mp4` — music-only (no VO) → **hero default** (autoplay-friendly, text carries story)
- `public/demo-video-vo.mp4` — with VO (am_michael, 26.5s) + ducked music → for landing, ads, or click-to-play with sound
- `public/demo-30s-silent.mp4` / `demo-30s-vo.mp4` — same files duplicated for clarity
- `public/demo-poster.jpg` — poster frame (Gaugemark + "Know the moment")

**VO Talent:** Kokoro-82M `am_michael` at 0.95x — calm, confident, mid-40s American male. -16 LUFS, -1.5 TP.
**Music:** Custom minimal ambient pad (55 Hz + 82 Hz + 110 Hz sines + pink noise, filtered, compressed, no cheese). Silent version at -14 LUFS, VO version ducked -7 dB under VO and re-normalized to -16 LUFS.

**Beat sheet aligned to timeline:**

| Time | Visual | VO / On-screen text |
|------|--------|----------------------|
| 0.0–3.6 | Light #EFEFEF, eyebrow "FOR SDRS WHO LOSE DEALS IN SILENCE", huge headline "Every sales call / holds the signal. / Most teams miss it." underline strokes | "Every sales call holds the signal. Most teams miss it." |
| 3.6–9.0 | Gauge wordmark + compass mark (64px), pill "PRIVATE BETA", headline "Know the moment / a competitor / enters the deal." Right: live-summary card (Priya S. / You, 3 action items, Health 8.2) | "Gauge turns every conversation into intelligence." |
| 9.0–19.0 | "HOW IT WORKS — Upload. Structure. Push." 3 cards: 01 Capture anywhere (MP3 · MEET · REC, Whisper 32kbps bar), 02 Structured in seconds (Summary/Action items/MEDDIC chips), 03 CRM-ready push (HubSpot+Salesforce → Push to CRM) + "1,200 min/mo" footer | "Upload, record, or capture from Google Meet. Get structured notes, action items, and MEDDIC — ready for your CRM." |
| 19.0–26.0 | **Dark #0a0a0b** — live competitive signal. Left: transcript "00:14:22 Sarah Chen: We're also evaluating [Gong] and [Chorus]..." Right: stack 3 alerts — Gong 0.96 white card (Slack #deal-room-acme), Otter 0.91, Fireflies 0.99. "SAMPLE ALERTS — fires in real time" | "And the second a competitor enters the deal — Gong, Otter, Chorus — you get an instant Slack alert with the exact line." |
| 26.0–30.0 | Back to light, badge "FREE FOREVER TIER · PRO $9/MO", headline "Start with / 300 free / minutes." CTA "Start free → $9/mo Pro · $7.50 annual", right board "WHAT YOU GET" 6 checks | "Gauge. Know the moment. Starting at nine dollars a month." |

**Full VO script (67 words, 26.5s):**
> Every sales call holds the signal. Most teams miss it. Gauge turns every conversation into intelligence. Upload, record, or capture from Google Meet. Get structured notes, action items, and MEDDIC — ready for your CRM. And the second a competitor enters the deal — Gong, Otter, Chorus — you get an instant Slack alert with the exact line. Gauge. Know the moment. Starting at nine dollars a month.

**Why this is not AI slop:**
- No generative blobs, lens flares, or floaty 3D. Editorial, Swiss-grid, type-first (Inter + JetBrains Mono, tracking -0.04).
- Exact product UI re-drawn as cards (doppel-outer/inner, #EFEFEF, #F26522, #111, #0a0a0b), not stock mock blurs.
- One paused GSAP timeline, seek-safe, deterministic, 1920×816 native, 30 fps, H.264 + AAC.
- Text carries story when muted (VO lines also on-screen), so silent version works in hero without sound.

**Integration:** Already drops into `src/components/hero-video-player.tsx` (`<source src="/demo-video.mp4" poster="/demo-poster.jpg" />`). For VO variant, point to `/demo-video-vo.mp4` or add a toggle.

**Renders:** `/tmp/gauge-demo/renders/gauge-30s-silent.mp4` (2.6 MB) and `gauge-30s-vo.mp4` (2.6 MB), both 1920×816, 30.0s, verified via `ffprobe` and `hyperframes check --no-contrast` (0 errors).
