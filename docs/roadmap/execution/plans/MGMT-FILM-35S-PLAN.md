# MGMT-FILM-35S-PLAN — Management-convincing 35s film + premium right-side

> Converged 2026-09-16 from 4-agent explore wave. Goal: right-side creative that a user sees + 30-40s management film covering what Gauge is / how it functions / its use — simple, convincing, fulfilling, engaging. Divide into parts for efficiency, no lags, no complaints.

## Parts (disjoint file sets, parallel-safe)

### Part A — Right-side hero creative (code) — owner: Frontend
- Files: `src/components/hero-scrubbable-video.tsx`, `src/components/hero-evidence-stack.tsx` (new), `src/app/page.tsx:116` slot only
- Job: keep `doppel-outer border-2 border-film-ink shadow-[8px]` vibe, kill lag:
  - poster facade first paint (1280w AVIF/WebP <80KB intent, keep jpg fallback), `preload="none"` until click, mount `<video>` on interaction only
  - static evidence stack fallback: transcript line (Sarah Chen 00:14:22 Gong) + Slack ping card (#deal-room-acme) + Health 8.2 / Rival / CRM row — pure DOM, transform/opacity only
  - unify reds to `#F26522`, keep `film_play {film:hero-scrubbable,duration_s:35}` analytics, keep captions VTT wiring
  - DO NOT touch `hero-shader.tsx` (orphan, delete later), DO NOT touch `hero-video-player.tsx` (#demo wedge)
- Verify: `npx tsc --noEmit`, `npx eslint`, `npx vitest run hero`, `npx next build`, LCP poster not video

### Part B — Scripts variety + Key Rules (docs) — owner: Content/PM
- Files: `docs/video/35s-scripts-variety.md` (new, 5 scripts), `docs/video/KEY-RULES.md` (new) — DO NOT edit `35s-mgmt-script-final.md` (shooting master locked)
- Job:
  - 5 scripts × 30-40s, 85-110 words, Grade 6, payer-voiced, each covers What + How + Use, ends `Start free 300 min · $9 flat`
  - Angles: 1 Risk/Loss (locked winner), 2 Time-back/ROI, 3 Coaching/Evidence, 4 Zero-change/No-bot, 5 Visibility/Manager-rollup
  - Each: Full VO + scene table (0-8 / 8-18 / 18-28 / 28-39) + on-screen muted text + why management buys it
  - KEY-RULES: 10 rules (muted-first, 1 job/line, no jargon, honest proof only 12 beta/500+ calls/Alex R., pricing pins 300/$9/5 seats/1200, local mp4 DENY iframe, captions 4 cues, poster last-frame legible 768px, <12MB H264 2200k, scrub to 14.37s, analytics film_play)
- Verify: word counts, Grade-6 check, pricing pins vs `src/lib/plans.ts`

### Part C — Judge kit + vibe/tech artifacts (docs + hyperframes) — owner: UX/Video
- Files: `docs/video/REFS-JUDGE-KIT.md` (new), `hyperframes-gauge-mgmt-35s/index.html` (new prototype, reuse Swiss Paper tokens) — DO NOT edit `REFS-MOODBOARD.md`, DO NOT edit existing `hyperframes-gauge-*/`
- Job:
  - 4-5 reference videos to judge against (Otter muted loop = format, Linear dark loops = craft, Slack So Yeah = narrative, Gong callout chip = steal, Fireflies 0:27 vertical = hook) with URL/runtime/format + what to steal/avoid + scorecard (artifacts/vibe/tech/narrative 1-5)
  - Vibe: Swiss Paper `paper #F5F0E6/cream #FFFDF7/ink #131316/amber #D9A21B` + doppel + mono 11px 0.18em; Tech: 1920x1080 H264 2200k+AAC <12MB, poster <250KB, preload metadata, rVFC, GPU-only; Management lens: loss aversion → fix → Slack proof → never-blindsided payoff + ROI baked example (40 calls × 8min = 5.3h back, payback <1 day)
  - Hyperframes prototype: single paused GSAP timeline, 4 beats, seek-safe, deterministic, muted-readable text carries story
- Verify: `hyperframes check --no-contrast` if available, else file exists +Tokens match tailwind.config

## Gate (orchestrator)
`npx tsc --noEmit && npx eslint src/components/hero* && npx vitest run && npx next build` — then single-concern commits, docs row in DEVELOPMENT_FRONTIER.md

## Finish wave (2026-09-16) — close audit blockers, no new scope
- E1 duration truth: ship real `gauge-hero-mgmt-35s.mp4` (39s container) OR relabel to 25s + fix VTT/analytics. Decision: ship 39s asset.
- E2 asset build: ffmpeg 1920x1080 30fps H264 High 2200k + AAC 128k <12MB, 4 beats matching shooting master, last-frame poster, VTT 4 cues verified.
- E3 LCP: 1280w poster <80KB intent (AVIF/WebP + jpg fallback), `fetchPriority high`, CTA legible 768px/360px.
- E4 scrub: 1 line → 4 tappable lines (00:02/00:12/00:22/00:32) matching VTT.
- E5 docs truth: 4-gate muted test log in REFS-JUDGE-KIT.
- E6 ship: isolated hero branch, stage ONLY hero files, gate green, PR, merge, verify prod. Do NOT stage unrelated M files (.env.example, INTEGRATIONS, etc).
