# HOMEPAGE-V2-PLAN — user corrections round (live-site feedback)

> Source: user screenshots + text (2026-09-18). Supersedes V1 on hero/demo only.
> Frozen decisions — do NOT reinterpret:
> - H1 = `AI notetaker for sales calls — your virtual competitor.` highlight = `virtual competitor`. The word "flags" MUST NOT appear in H1/hero.
> - Hero-right = VIDEO ONLY (Otter-style tall panel). LIVE SUMMARY scrub list + Health/Rival footer move below fold. Zero summary text in hero.
> - Demo = halves: video top half, all other content bottom half (`#demo` band AND `/demo` page).
> - One layout language: single container/eyebrow/H2 system, coherent bg rhythm.

## E1 — Hero rebuild (owns page.tsx hero + film-band wrapper)

Files ONLY: `src/app/page.tsx`, `src/components/hero-scrubbable-video.tsx`, NEW `src/components/scrub-summary-section.tsx`
- `hero-scrubbable-video.tsx`: strip ALL summary UI (header `Live summary…`, scrub buttons, footer meta) into data-only export. Component renders VIDEO ONLY: facade poster + play + mute + `<video>` + captions. Panel fills column: wrapper `h-full min-h-[440px] lg:min-h-[600px]`, poster/img `object-cover w-full h-full` (drop `aspect-video`), keep `fetchPriority=high decoding=async`, `film_play{hero-scrubbable,39}` once, `aria-label`s. Video listens `window 'gauge:scrub'` CustomEvent `{seekS}` → same activate+seek path as old buttons.
- NEW `scrub-summary-section.tsx` (server + tiny client island for buttons): full-width section BELOW fold rendering `HERO_SCRUBBABLE_LINES` verbatim (4 lines, stamps 00:02/12/22/32) + header `Live summary · tap a line to scrub` + footer `Health 8.2 / Rival: Gong / #deal-room-acme`. Buttons `min-h-[44px]`, dispatch `gauge:scrub`. `aria-labelledby`, `data-track-section="scrub-summary"`.
- `page.tsx` hero: right col = `<HeroScrubbableVideo/>` only, `h-full`. Order below hero: `<HeroEvidenceStack/>` → `<ScrubSummarySection/>` → `<LiveProofStrip/>` → … . Film band `#demo` wrapper → stacked halves (copy header top, `<HeroVideoPlayer fullBleed/>` middle, alert cards grid bottom) — markup shell only, player internals E2.
- H1 render: keep split(highlight) pattern, new strings from copy lib. No other H1.
- Verify: `tsc`, grep `flags` in hero = 0 hits, grep `Live summary` in hero-scrubbable-video = 0.

## E2 — Demo halves + one layout language

Files ONLY: `src/app/demo/page.tsx`, `src/components/demo-carousel.tsx`, `src/components/hero-video-player.tsx`, `src/components/hero-evidence-stack.tsx` (spacing only), section shells: `live-proof-strip.tsx`, `proof-strip.tsx`, `problem-section.tsx`, `social-proof.tsx`, `how-it-works.tsx`, `differentiators.tsx`, `use-cases.tsx`, `roi-calculator.tsx`, `final-cta.tsx`. NEVER page.tsx, copy lib, tests.
- `hero-video-player.tsx`: add `fullBleed?: boolean` — full-width 16:9 panel (no max-w constraint inside; parent controls width), keep captions track, film events, `scroll-mt-24` on `#demo`, motion-safe classes.
- `/demo` page halves: TOP half = `<HeroVideoPlayer fullBleed/>` (25s film, existing, with captions); BOTTOM half = existing carousel (tabs/detail/value props/CTAs) unchanged data (`DEMO_CALLS` verbatim), keep `?call=` deep-link + `aria-live` + reduced-motion from V1. Keep single global footer.
- Layout language (all owned sections): container `max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12`; eyebrow `text-[11px] uppercase tracking-[0.18em] text-gray-600` (dark bands: `text-white/60`); H2 `text-[clamp(1.5rem,4vw,2.6rem)] font-medium tracking-[-0.02em]`. BG rhythm: paper hero → cream evidence → white scrub → (keep rest order) → ONE dark band (film) → light → … if two dark bands adjacent, lighten the weaker to `bg-white`. py `16/sm:20/lg:28` everywhere.
- Verify: `tsc`, no `text-gray-400` in owned files, `/demo` has exactly one `<footer>` (global).

## E3 — Copy reframe + test pins + gate assist

Files ONLY: `src/lib/homepage-copy.ts`, `src/test/homepage-copy.test.ts`, `src/test/hero-scrubbable-video.test.tsx`, `src/test/homepage-events.test.tsx`, `src/test/homepage-events.test.ts` (if exists).
- `homepage-copy.ts`: `HERO_VARIANTS[1].h1 = "AI notetaker for sales calls — your virtual competitor."`, `HOMEPAGE_COPY.heroH1` same, `heroH1Highlight = "virtual competitor"`. Subcopy: keep radar sentence but drop "flags the risks" → "spots the risks" (no "flag" verb in hero; "flag" noun in bullet 2 → "signal": `…your virtual competitor signal lands in Slack…`). Keep Slack|rival|coach keywords + pricing 300/1200/$9.
- Tests: update H1/highlight pins; rewrite scrubbable test → video-only facade assertions (39s const, poster attrs, zero pre-activation video, film_play once, `gauge:scrub` listener) + NEW assertions on scrub section (4 lines, stamps, footer) — put new ones in same file or homepage-events, your call. Ban `flags` (case-insensitive, H1 only — "flag" may survive in `hero-mgmt-video` legacy? it was deleted; grep repo for leftovers and report).
- Verify: full `npx vitest run` (only pre-existing proof-freshness fail allowed), report.

## Gate + ship

`tsc --noEmit` → eslint owned files → `vitest run` → `next build` → smoke `/` + `/demo` → squash-merge PR → poll `usegauge.vercel.app` for `virtual competitor` + `scrub-summary`.
