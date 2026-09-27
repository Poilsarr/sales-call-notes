# GAUGE-REDESIGN-PART1-PLAN — Visual Proof (above-fold + pictorial core)

> Owner-ordered 2026-09-27. Part 1 of 2-part homepage rebuild.
> Goal: kill "theoretical" feel below hero. Photo-real product visuals, not illustrations.
> Standing rules: one concern per PR, `npx vitest run && npx next build` green, verification agent on push, no secrets.

## 0. Baseline (explore wave 2026-09-27)

- `src/app/page.tsx:37-410` — 20 blocks. Hero `45-132` good (4.2rem H1, `film-paper→#EFEFEF`, video `gauge-hero-mgmt-35s.mp4`). Below fold: 6x same `doppel-outer/inner + peach icon w-10 h-10 bg-[#F26522]/10`, 8x same H2 `clamp(1.5,4vw,2.6)`, 0 product screenshots, same mock `Health 8.2 / Gong / Sarah Chen 00:14:22` x4, CTA desert (5 sections 0 CTAs).
- Tokens: `tailwind.config.ts:22-54` (`accent #F26522`, `film paper #F5F0E6 cream #FFFDF7 ink #131316 vermilion #E8442E`, `linear panel #0a0a0b`), `globals.css:77-97` (`doppel-outer/inner`, `outer-dark/inner-dark`, `btn-primary`).
- Copy truth: `src/lib/homepage-copy.ts:66-71` (`proof: 12 teams / 500+ calls / quote`), pinned by `src/test/homepage-copy.test.ts:1-85`.
- Events truth: `film_play/close/end {film:"2-14pm-call",duration_s:25}` pinned by `homepage-events.test.tsx:129-178`; `gauge:scrub {seekS}` pinned by `hero-scrubbable-video.test.tsx`.
- Dashboard `/dashboard` + `/app/intelligence` are Clerk-gated (`middleware.ts:29`) — NOT publicly screenshottable. Part 1 uses Figma-grade pixel mocks (real data, real tokens) as `<img>/SVG`, swappable to real screenshots later. No auth bypass.
- Working tree dirty at plan time (`git status --short`: M .env.example, package.json, prisma/schema, leads route, sidebar, footer, posthog + ?? admin routes, plans). Part 1 must NOT include those in diff — single-concern PR only.

## 1. Part 1 scope (this PR) vs Part 2 (next)

**Part 1 — 4 new/edited surfaces, disjoint sets:**
1. `TrustStrip` (new) — numbers + logo marquee + G2, replaces thin `ProofStrip` text.
2. `ProductVisualCard` (new) — 3x photo-real cards: transcript / Slack / CRM. Replaces text-only evidence triptych feel.
3. `RadarMoat` (new, dark `#0a0a0b`) — "Surface no notetaker has": live flag + battlecard + aggregation chart.
4. `page.tsx` wiring only — mount order, no copy changes, no hero video logic changes.

**Part 2 (separate PR):** personas tabs, proof wall faces, integrations wall, `/vs-*` tables, team photos, pricing/FAQ + migration guide. Explicitly OUT of Part 1.

## 2. Target order (page.tsx)

```
Hero (keep 45-132)
<HeroEvidenceStack/> (keep 134, restyle footer only if needed)
<TrustStrip/> (NEW, between LiveProofStrip and Problem — replaces ProofStrip import at 143)
<LiveProofStrip/> (keep, pass visual data via props later — no logic change in P1)
<ScrubSummarySection/> (keep)
<ProblemSection/> (light restyle: keep copy, change icon grid to editorial rows — CSS only)
<ProductVisuals/> (NEW section, 3 photo-real cards, cream bg)
<RadarMoat/> (NEW dark band, before film wedge 178)
film wedge 178-285 (keep, add anchor id for radar CTA)
... rest untouched
```

Do-not-touch: `HeroCTA placement`, `hero-scrubbable-video.tsx:146-155 gauge:scrub`, `hero-video-player.tsx:59 id="demo"`, `homepage-copy.ts` strings, `globals.css doppel` definitions.

## 3. Visual spec (photo-real decision)

- Section 4 cards: `doppel-outer border-2 border-film-ink shadow-[8px_8px_0_#131316]` + `doppel-inner bg-white p-0 overflow-hidden`. Top: `<img @2x 1440x900>` (transcript/Slack/CRM mock rendered from real tokens: `cream #FFFDF7`, `ink #131316`, mono timestamps, speaker pills Customer `#131316` / Gauge `#F26522` / Slack `#047857`). Bottom: `p-6` title `15px semibold` + body `13px gray-600` + mono footer. Overlay: tape `w-24 h-6 bg-film-amber/60 rotate-[-2deg]`, confidence progressbar `role=progressbar` copied from `live-proof-strip.tsx:173-185`, pulse dot.
- TrustStrip: `bg-white border-b`, `max-w-[1440px]`, row1 `12.5px gray-500` (reuse `proof-strip.tsx:13-26` separators `·`), row2 logo marquee `h-7 opacity-50 grayscale` (reuse `differentiators.tsx:166-175` pattern, 8 logos from `/brand/*` + text wordmarks), stat pills `Health 8.2 / 60s / 99.2%` mono `12px`.
- RadarMoat: `bg-[#0a0a0b] text-white`, `doppel-outer-dark/inner-dark`, 3 visuals (flag chip `#F26522`, battlecard push, SVG aggregation chart teal/amber), CTA rotation `See radar live → #demo` + `Start free`.
- Type rhythm: Trust `12px`, Product H2 `clamp(1.5,4vw,2.6rem)`, Moat H2 `clamp(1.5,4vw,3rem)`. Eyebrows `11px uppercase 0.18em`.
- CTA: add 1 pill per new section (`btn-primary` + white-circle ArrowRight), `data-track-section` + `data-placement` distinct. No duplicate `hero_view`.

## 4. Executor split (DISJOINT sets, parallel)

- **E1 — Trust + wiring:** files: `src/components/trust-strip.tsx` (new), `src/components/proof-strip.tsx` (deprecate-or-reexport, keep `aria-label`), `src/app/page.tsx` (mount only, lines 140-144). Tests: `src/components/trust-strip.test.tsx` (new, asserts proof copy from HOMEPAGE_COPY, logos render, no hardcoded numbers). Must keep `homepage-copy.test.ts` green.
- **E2 — Product visuals:** files: `src/components/product-visual-card.tsx` (new), `src/components/product-visuals-section.tsx` (new), `public/brand/*` reuse only (no new binaries in P1 — inline SVG mocks), `src/test/product-visuals.test.tsx` (new). Must NOT touch `page.tsx` (E1 owns wiring) — export section, E1 mounts. Copy `SPEAKER_STYLES` + progressbar a11y from live-proof/scrub verbatim.
- **E3 — Radar moat (optional parallel, disjoint):** files: `src/components/radar-moat.tsx` (new), `src/test/radar-moat.test.tsx` (new). Dark tokens only. No touch to differentiators/film.

Each executor: self-contained script + `npx tsc --noEmit`, `eslint <files>`, `vitest run <new.test>`, `next build` smoke note. Single-concern commits, no mixing with dirty-tree files.

## 5. Gate (orchestrator, before confirm)

1. `npx tsc --noEmit`
2. `npx eslint src/components/trust-strip.tsx src/components/product-visual*.tsx src/components/radar-moat.tsx src/app/page.tsx`
3. `npx vitest run` (full, 1040+ tests must stay green; homepage-copy/events/scrubbable pinned)
4. `npx next build` (check no LCP/CLS regression, no `id="demo"` dup, no `gauge:scrub` break)
5. `git status --short` — Part 1 diff must list ONLY E1/E2/E3 files + this plan. Dirty pre-existing files stay untouched.
6. Present screenshots/DOM + diff for user confirm. NO commit/push without explicit "ship it". On ship: dedicated verification agent watches `gh run list` + `--log-failed` for SHA.

## 6. Confirm needed from owner before execute

- Photo-real via coded mocks (no binary screenshots in P1) — approved 2026-09-27 ("best result whatever it may be").
- TrustStrip replaces ProofStrip (re-export shim keeps old import green) — confirm.
- RadarMoat dark band before film wedge (second dark band after differentiators — okay, separated by light sections) — confirm.
