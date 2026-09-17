# HOMEPAGE-OVERHAUL-PLAN — Gauge frontal page vs competition

> Arc: homepage overhaul (user 7-point brief + screenshot `usegauge.vercel.app/#demo`).
> Defaults locked on `go` (user gave no answers): initials-only roster, polish existing 39s MP4, upgrade static `/demo`, keep H1 variant B + reframe subcopy.
> One-concern UI arc. Disjoint file sets per executor. Orchestrator merges + gates.

## 0. Baseline truth (verified 2026-09-17)

- `src/app/page.tsx:36-397` server component, 11 blocks. Hero grid `1.1fr/0.9fr` at `:80`.
- Copy SSOT `src/lib/homepage-copy.ts:39-100` — H1 variant B already `...flags virtual competitors.` highlight `:49`. Subcopy already radar-framed `:51-52`.
- Hero-right video = `hero-scrubbable-video.tsx:71` (facade, 39s, 4 scrub lines `:33-62`, VTT `public/videos/gauge-hero-mgmt-captions.vtt`). `id="demo"` lives mid-page in `hero-video-player.tsx:54`, NOT hero-right.
- `HeroEvidenceStack` (`hero-evidence-stack.tsx:33`) nested in hero-right col `page.tsx:125` — must move full-width below fold (its own header says so `:1-9`).
- `TeamShowcase` + `WhoWeAre` imported `page.tsx:13-14`, never rendered. Roster placeholders `src/lib/team.ts:21-28`.
- `/demo` static page exists (`demo/page.tsx` + `demo-carousel.tsx` + `demo-data.ts` 5 calls). Double-footer bug (local + global `layout.tsx:122`).
- Contrast fails: `gray-400` eyebrows, `white/30` disclaimer `page.tsx:269`, `#F26522` small text. Tap targets <44px (secondary CTA, tabs, hamburger).
- Tests pinning behavior: `homepage-copy.test.ts`, `hero-scrubbable-video.test.tsx` (39s, 4 lines, facade, `film_play` once), `bundle-gate.test.ts` (`/` 252kB, `/demo` 212kB).

## 1. Executors (DISJOINT sets — no overlap)

### E1 Frontend Layout + a11y (owner of page.tsx structure)
Files: `src/app/page.tsx`, `src/app/globals.css` (hero-scoped additions only, NO global doppel changes), `src/components/nav.tsx`, `src/components/site-footer.tsx`, `src/components/sticky-marketing-cta.tsx`
- Hero: keep `lg:[1.1fr_0.9fr]`, right col = `HeroScrubbableVideo` ONLY. Extract `HeroEvidenceStack` to full-width section directly after `</section>` hero, before `LiveProofStrip`.
- Render `<TeamShowcase/>` + `<WhoWeAre/>` after `SocialProof`, before `RoiCalculator` (below fold, starting page per brief points 3+4).
- Contrast: eyebrows `gray-400→gray-600`, disclaimer `white/30→white/60`, timestamps keep ≥4.5:1. Keep CTA `#C94F17` (do NOT unify to `#F26522`).
- Targets ≥44px: secondary CTA `py-2→py-3 min-h-[44px]`, tab pills, hamburger `p-2→p-3`, sticky dismiss.
- Heading order: single h1; evidence h2 stays `Every flag ships with proof.`; team `h2#team-heading`, who `h2#who-we-are-heading`.
- `#demo` anchor: keep on `HeroVideoPlayer`, add `scroll-mt-24` + focus management on `Watch demo` click.
- Verify: `npx tsc --noEmit`, grep no `text-gray-400` in hero, no duplicate `id="hero-video"`.

### E2 Copy + Team data (no layout)
Files: `src/lib/homepage-copy.ts`, `src/lib/team.ts`, `src/components/team-showcase.tsx`, `src/components/who-we-are.tsx`
- Keep H1 + highlight. Tighten `heroSub` second sentence if >280 chars (keep Slack|rival|coach|virtual competitor keywords — test asserts).
- `team.ts`: replace placeholder names with role-forward honest labels (e.g. Founder — `Building Gauge`, NOT invented humans). Keep `ADVISORY_NOTE` honest (12 teams). NO photos.
- `team-showcase.tsx`: initials avatars, `ul[role=list]`, eyebrow `Team showcase · Advisory board` keep.
- `who-we-are.tsx`: 3 pillars keep (What we do / Our goal / What we achieve), numbers `12 beta teams, 500+ calls` only.
- Verify: `npx vitest run src/test/homepage-copy.test.ts`.

### E3 Motion / Media polish (no copy)
Files: `src/components/hero-scrubbable-video.tsx`, `src/components/hero-video-player.tsx`, `src/components/reveal-observer.tsx`, `src/components/hero-mgmt-video.tsx` (delete if unimported)
- Scrubbable: keep facade (`preload=none`, zero `<video>` pre-activation), `fetchPriority=high decoding=async`, 39s + seeks `[2,12,22,32]`, `film_play` once, `<track captions>`. Enhance: larger play `w-14→w-16`, `ring-2 ring-white/80`, caption pill `bg-black/70→bg-black/75`, mute button `aria-label` keep, `min-h-[44px]` scrub rows.
- Player (`#demo`): add missing `<track kind=captions>` reusing mgmt VTT, `scroll-mt-24`, keep 25s `film_play/close/end`.
- Reduced-motion: gate `animate-pulse/ping` + Ken Burns behind `prefers-reduced-motion` (CSS already `globals.css:1069-1078` — use `motion-safe:` variants).
- Delete `hero-mgmt-video.tsx` ONLY if `grep -r HeroMgmtVideo src` shows zero imports.
- Verify: `npx vitest run src/test/hero-scrubbable-video.test.tsx src/test/homepage-events.test.tsx`.

### E4 Demo page upgrade (static, no new routes)
Files: `src/app/demo/page.tsx`, `src/components/demo-carousel.tsx`, `src/lib/demo-data.ts`
- Keep 5 `DEMO_CALLS` verbatim. No `/about` (avoid `/team` Clerk collision).
- a11y: call list `role=tablist/tab/tabpanel` + `aria-selected`, `min-h-[44px]`, detail `aria-live=polite`.
- Deep-link `?call={id}` default `call_acme_discovery`; back/forward restores.
- Gate `pulse setInterval(1800)` + `animate-pulse` behind reduced-motion + `document.hidden`.
- Fix double footer: remove local footer OR set `export const dynamic` note — simplest: keep local disclaimer line, do NOT render second `<footer>`, keep global.
- Funnel: keep `Start free → /sign-up` + `See pricing`, add `data-track-section="demo-carousel"`.
- Verify: `npx vitest run src/test/bundle-gate.test.ts` (demo ≤212kB).

## 2. Automation (awakens on any event)

- `vitest.config.ts` jsdom; relevant: `homepage-copy`, `homepage-events`, `hero-scrubbable-video`, `bundle-gate`, `marketing-assets`, `pricing-copy`.
- Tracking `src/lib/analytics.ts`: `hero_view{variant:B}`, `cta_click{id,section}`, `film_play|close|end{film,duration_s}`, `section_view{team,who-we-are,try-it,demo-carousel}` via `RevealObserver` dynamic import.
- Bundle proof: `npx next build 2>&1 | grep -E '^[├└┌] [ƒ○λ] ' > scripts/.proof-bundle.txt`; enforce `/ ≤252 /demo ≤212`.
- LHCI `.lighthouserc.js` perf/a11y on `/` + `/demo`.

## 3. Gate + Ship

1. `npx tsc --noEmit` 2. `npx eslint src/app/page.tsx src/components/hero-* src/components/team-showcase.tsx src/components/who-we-are.tsx src/components/demo-carousel.tsx src/lib/team.ts src/lib/homepage-copy.ts` 3. `npx vitest run` 4. `REDIS_HOST=disabled REDIS_PORT=0 npx next build`.
2. Single UI commit, no secrets, `git status --short` scoped to files above. Docs row in `DEVELOPMENT_FRONTIER.md` Recently Shipped.
3. Known dirty worktree (stealth/hyperframes/assets) — DO NOT stage unrelated files.

## 4. Follow-ups (not this arc)

- Real roster + photos, `/about` page + sitemap, i18n (`next-intl`), new footage, dynamic demo with real calls.
