# HERO-V2 — Management-first hero: Scrubbable Signal + 35s convincing film

> Swarm converged 2026-09-15. 5 teams: RIGHT-CREATIVE, SCRIPTS, REFS, ARTIFACTS, MGMT-PSYCH.
> User rule: 30-40s video must cover *what Gauge is + how it functions + its use*, very simple, management payer = buyer, creative right slot a user actually sees, good artifacts/vibe/tech, no lags, very good narrative, divide work for efficiency.

## 1. What exists today (audited)

- Hero `src/app/page.tsx:33-120` server, grid `1.1fr_0.9fr :76`, left copy `HOMEPAGE_COPY` `src/lib/homepage-copy.ts:39-50`, right = `<HeroMgmtVideo>` `src/components/hero-mgmt-video.tsx:46-88` (autoPlay muted loop, env-driven `NEXT_PUBLIC_DEMO_VIDEO_URL || /videos/gauge-hero-25s.mp4 :7`, `aspect-video :52`, `doppel-outer border-2 shadow 8px :48`, captions `gauge-hero-mgmt-captions.vtt`).
- Displaced card reused as `<LiveProofStrip>` `src/components/live-proof-strip.tsx:44-151` `#try-it` 3 tabs (Acme/Gong 0.96, Vandelay/Otter 0.91, Stark/Fireflies 0.99).
- Wedge film `src/components/hero-video-player.tsx:21-147` keeps `#demo`. Video assets `public/videos/gauge-hero-25s.mp4` 5.3MB 1920x1080 25s + poster 249KB.
- No Vercel video env exists (grep 0 hits); fallback proven to work.

## 2. Decisions

**Right slot: Scrubbable Signal (winner of 4).** Muted 35s management video + tappable transcript strip in same `doppel-outer` island. Tap line at 00:14:22 → `video.currentTime = 14.37`. Works muted (transcript readable), interactive without gimmick, GPU-only, pairs 1:1 with script beat 1 flag.

Runners: 2. Command Stack (CSS dashboard, zero bytes) = fallback poster before video loads. 3. Threat Radar (SVG `gauge-viz/threat-radar.tsx`) = future A/B. 4. Paper Theater = rejected (0.14 opacity unreadable).

**Video: Variant 1 "The Line You Missed" — Risk — 99w / 39s** (top of 5). Rejected: #2 Time-back, #3 Coaching, #4 Zero-change, #5 Visibility — kept as B-cuts for email.

Script beats (35s):
- 0-8s HOOK: missed Gong line at 00:14:22, desaturate — VO "Your reps had a great call… No one wrote it down."
- 8-18s WHAT+HOW: 3 cards MP3·Record·Meet no-bot — VO "Gauge is an AI notetaker… No bot ever joins."
- 18-28s NOTES: Summary+owners+dates+draft → CRM 1-click — VO "clean summary, who does what by when"
- 28-39s FLAG+CLOSE: quote chip "Sarah Chen 00:14:22" → Slack #deal-room-acme ping → manager roll-up — VO "exact line … in Slack. You never get blindsided." End card `Start free 300 min · $9 flat`

Refs to judge against (live-fetched): **Otter 1:1 loop** (hygiene), **Slack *So Yeah We Tried Slack* 2:20** (skeptic→conversion narrative), **Linear** (craft dark loops), plus Gong/Chorus/Fireflies.

**Copy: payer-voiced, Grade 6.** H1 keep B for now (A/B later: `Never lose a deal because you heard too late`), sub already `See every sales call…`, 3 bullets kept. MGMT-PSYCH 7 anxieties + 3 rebuttals baked into script VO.

**Artifacts/vibe/tech: Swiss Paper** `paper #F5F0E6 / cream #FFFDF7 / ink #131316 / amber #D9A21B highlighter` + `doppel border-2 8px` + mono `11px tracking 0.18em`. Encode spec `1920x1080 H.264 High 2200k + AAC, <12MB, poster <250KB, preload metadata, aspect-video, rVFC sync, composite-only`.

## 3. Execute — 3 disbursed executors (disjoint file sets)

- **Exec A — Scrubbable build:** `src/components/hero-scrubbable-video.tsx` (new), `src/app/page.tsx` hero right block only (replace `<HeroMgmtVideo>` with `<HeroScrubbableVideo>`), keep `hero-mgmt-video.tsx` as deprecated shim (no delete).
- **Exec B — Script + captions + moodboard:** `docs/video/35s-mgmt-script-final.md` (new, Variant 1 full table), `public/videos/gauge-hero-mgmt-captions.vtt` (rewrite to 35s 4 cues), `docs/video/REFS-MOODBOARD.md` (new, 6 refs table + takeaways).
- **Exec C — Copy polish + strip:** `src/lib/homepage-copy.ts` (tighten heroSub/bullets if needed), `src/components/live-proof-strip.tsx` (a11y polish, keep tabs), `src/test/homepage-copy.test.ts` (keep 6/6).

Orchestrator gate only: `tsc --noEmit && eslint && vitest run homepage-copy && next build`, smoke hero muted autoplay + tap-scrub.

## 4. Artifacts to render after (outside this PR)

`public/videos/gauge-hero-mgmt-35s.mp4` per script + poster `gauge-hero-mgmt-poster.jpg` (hero last-frame). Until then, `NEXT_PUBLIC_DEMO_VIDEO_URL` fallback keeps hero live (current 25s film). Follow-up: cut 35s, drop in `public/videos/`, set Vercel env var, rebuild.

## 5. Gate / risks

- Keep `next.config.mjs:27 DENY` — local mp4 only, no YouTube iframe.
- Keep `#hero-video` vs `#demo` distinct.
- Keep `border-2 8px` not soft shadow.
- Tests: `homepage-copy.test.ts` pricing pins 300/1200/$9.
