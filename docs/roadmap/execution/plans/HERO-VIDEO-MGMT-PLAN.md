# HERO-VIDEO-MGMT-PLAN — Management-first hero: video right, card reused, Otter-simple

> Swarm converged 2026-09-14. Explore wave: 4 teams (hero-audit, otter-intel, video-convince, env-scout).
> Goal per user: payer = management/org. Right-side LIVE SUMMARY card → video. Displaced card reused creatively.
> New video must convince non-tech management in simple crystal-clear manner. Steal Otter.ai patterns.

## 1. Truth (explore wave)

- Hero lives `src/app/page.tsx:31-170`. Server component. Grid `page.tsx:74-75` `1.1fr_0.9fr`. Left copy `:79-104`, right card `:106-166` (static JSX, no props).
- Left copy source `src/lib/homepage-copy.ts:39-53`. H1 variant B. Secondary CTA `Watch demo (0:25)` → `#demo` anchor.
- Video today NOT in hero: `<HeroVideoPlayer />` at `page.tsx:219` (wedge section), assets `public/videos/gauge-hero-25s.mp4` 5.3MB + poster 249KB, hardcoded `hero-video-player.tsx:140`. Click-to-play, no autoplay, no modal.
- **No Vercel video env exists.** Grep `NEXT_PUBLIC_*VIDEO*, DEMO_*, MUX, YOUTUBE` = 0 hits. `.env.example`, `vercel.json`, `next.config.mjs` have no video wiring. `public/demo-video.mp4` + `-vo.mp4` orphaned. User's "it is in vercel env" unverified — must support `NEXT_PUBLIC_DEMO_VIDEO_URL` with local fallback, then ask user to confirm Vercel dashboard value.
- Otter.ai (fetched 09-14): H1 `[known] is now also [bigger outcome]`, Grade-5 verbs, right-side 1:1 autoplay muted loop video (Finsweet autovideo.js), testimonial slider under, `Start for free` + `Schedule demo` duality, payer math (`33% time back, 4+hrs/week`), Enterprise trust (SSO, audit, HIPAA). Weakness to exploit: generic, bot-heavy, sales intel locked to Enterprise, minute caps.
- Video-convince team: 55s script "The line you never heard" (hook → capture → notes+flag → Slack → ROI close, ~195 words), asset spec `gauge-hero-mgmt-55s.mp4` 16:9 <30MB + poster + .vtt, host in `public/`, autoplay muted loop + click-for-sound.
- Reuse recommendation: Option A — interactive live-proof strip directly below hero (`#try-it`), 3 tabs (Acme/Vandelay/Stark wedge quotes), reuses card markup verbatim + 30 lines client state.

## 2. Decision

1. **Right slot = new `<HeroMgmtVideo />`** (Otter-style autoplay muted loop, captions burned + .vtt track). Source = `process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || "/videos/gauge-hero-25s.mp4"` so Vercel env wins when set, local fallback keeps build green. Poster = `NEXT_PUBLIC_DEMO_POSTER_URL || "/videos/gauge-hero-poster.jpg"`. `aspect-video`, `preload="metadata"`, `playsInline`, click toggles sound/controls. Analytics reuse `film_play` with `film:"hero-mgmt"`.
2. **Management copy** in `homepage-copy.ts`: keep H1 (variant B tested), rewrite `heroSub` to payer voice ("See every sales call your team makes..."), add `heroManagerBullets` (3 bullets: know every deal / never blindsided / coach with evidence, zero jargon). Render 3 bullets under CTAs (server, no JS).
3. **Displaced card → `<LiveProofStrip />`** new client island rendered `<ProofStrip />` + `<ProblemSection />` between (i.e. directly below hero at `page.tsx:174`). Interactive 3-tab proof using wedge quotes already in `page.tsx:223-256`. Reuses card JSX verbatim from `:109-165`. Anchor `#try-it` so hero video CTA has distinct target from film `#demo`.
4. **Dedupe `#demo`**: hero video uses `#hero-video`, wedge keeps `#demo`. Secondary CTA `secondaryHref` stays `#demo` (film below) OR retarget to `#try-it`? Keep `#demo` to avoid breaking existing `homepage-copy.test.ts`; hero video gets its own play affordance in-place (no anchor jump needed).
5. **Video shoot**: cannot render mp4 in this PR. Ship wiring + poster + script `docs/video/55s-mgmt-script.md` + captions stub `public/videos/gauge-hero-mgmt-captions.vtt`. If user pastes Vercel env URL, it lights up with zero code change. Follow-up: cut `gauge-hero-mgmt-55s.mp4` per script, drop into `public/videos/`.

## 3. Execute wave — disjoint file sets

- **Executor A (hero swap + copy):** `src/lib/homepage-copy.ts`, `src/components/hero-mgmt-video.tsx` (new), `src/app/page.tsx` hero block only (`:79-166`), `src/test/homepage-copy.test.ts` (update if needed), `.env.example` (document vars).
- **Executor B (reuse + dedupe + script assets):** `src/components/live-proof-strip.tsx` (new), `src/app/page.tsx` insertion only (`:172-175`), `src/components/hero-video-player.tsx` (id/label touch only, no logic change), `docs/video/55s-mgmt-script.md` (new), `public/videos/gauge-hero-mgmt-captions.vtt` (new), `docs/roadmap/DEVELOPMENT_FRONTIER.md` row.
- Rule: orchestrator never edits in execution wave; executors stay on their file sets; single-concern commits.

## 4. Risks / constraints (from audit)

- `page.tsx` server + new client island adds above-fold JS — keep `preload="metadata"`, poster `loading="lazy"`, no auto `play()` with sound (browser blocks). Muted autoplay only.
- `next.config.mjs:21-33` `X-Frame-Options: DENY` — stay with local mp4 / Vercel Blob mp4, NOT YouTube iframe, else headers rework.
- Layout shift: force `aspect-video` on both poster + video states (current player mixes 2.35/1 → 16:9).
- Duplicate `#demo` — fixed by `#hero-video` for new component.
- Sticky mobile CTA (`page.tsx:426-428`) can cover controls — page already has `pb-20 lg:pb-0` at `:35`, verify.
- Tests: `homepage-copy.test.ts` pins pricing + copy — update test alongside copy change.

## 5. Gate

`npx tsc --noEmit && npx eslint src/components/hero-mgmt-video.tsx src/components/live-proof-strip.tsx src/app/page.tsx src/lib/homepage-copy.ts && npx vitest run src/test/homepage-copy.test.ts && npx next build`. Smoke `/` hero: video autoplays muted, sound on click, card appears in `#try-it` strip, no duplicate ids.
