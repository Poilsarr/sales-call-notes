# HERO-15S-LOOP — 15-Second Screen-Recording Loop for Hero / Studio

Status: in build. Owner: agent swarm (orchestrator + executors, disjoint sets).

## Why
Hero right column (`HeroScrubbableVideo`, 39s container) is high-intent but heavy
(8.9MB, 39s story used as `loop`). A purpose-built 15s seamless loop of the
Chrome extension capturing a real Google Meet call gives higher visual punch at
<5MB, flawless autoplay, zero export from YouTube (X-Frame-Options: DENY).

## What ships
- `hyperframes-gauge-15s-loop/` — offline HyperFrames composition (1920x1080, 15.0s, 30fps, silent,GSAP vendored, no CDN/Three/network at render).
- `public/videos/gauge-hero-15s-loop.mp4` — H.264 High yuv420p + silent AAC, faststart, <5MB, 15.0s.
- `public/videos/gauge-hero-15s-poster.jpg` — 1280w q:v 4 <250KB (frame at ~6.5s, Meet capture beat).
- `public/videos/gauge-hero-15s-loop.gif` — 640w 15fps palette fallback for reduced-motion/noscript.
- `public/videos/gauge-hero-15s-captions.vtt` — 4 cues matching beats.
- Hero wiring: `HeroScrubbableVideo` defaults → 15s assets + `HERO_SCRUBBABLE_DURATION_S=15` + 4 scrub lines at [1.5, 4.5, 8.5, 12.0]; `<video loop muted playsInline preload="metadata">` unchanged.
- Studio wiring (optional 2nd drop): `PictorialAppShowcase` 4th tab reuses same MP4.

## Scripts considered (winner: B)
- **A — "The Line You Missed" cutdown:** 39s→15s compression (hook/what/notes/signal). Faithful but rushed; Meet capture only 3s.
- **B — "No Bot Joins" Extension POV (WINNER):** full Meet-capture beat (browser chrome + 2 tiles + live captions + side panel recording + waveform + no-bot chip). Answers the user ask literally; highest visual punch in hero window.
- **C — "Rival Named → Slack":** detection-forward (transcript → Slack ping → summary). Strong signal story, weak extension proof.

Winner B: 0.0–2.8 hook / 2.8–7.2 Meet capture / 7.2–11.0 notes / 11.0–15.0 Slack signal + 14.2–15.0 loop-reset to t=0 state. Sweep rotation = exactly 360°/15s; REC blink 1s×15; waveform bars period divides 15s — seamless.

## No-lag contract
- Motion: x/y/scale/autoAlpha only, expo.out, no width/height/top/left, no repeat:-1, no Math.random/Date.now/network at render, seeded layout constants.
- Render: `npx hyperframes check` (0 errors) → `render --quality high` → ffmpeg transcode (crf 19, preset slow, yuv420p, faststart, 30fps) → ffprobe verify (15.0s±0.1, 1920x1080, <5MB).
- Serve: poster-first facade (`preload="none"`, mount on click/scrub), `object-contain` over blurred fill, transform/opacity page motion only.

## Verification
`npx hyperframes check` in project → `ffprobe` duration/size → `npx tsc --noEmit` + `npx vitest run` + `npx next build` (repo gate) → Studio preview approval → render.
