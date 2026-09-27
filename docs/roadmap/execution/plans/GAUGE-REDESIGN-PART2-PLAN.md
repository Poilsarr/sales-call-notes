# GAUGE-REDESIGN-PART2-PLAN — Proof + Conversion

> Part 2 of homepage rebuild. Part 1 (trust-strip, product-visuals, radar-moat) built + gate-green, uncommitted. This PR builds on top, same branch, no push until combined confirm.
> Rules: one concern per file set, tsc/eslint/vitest/build green, no secrets, no fake customers (PR #42 memorial).

## 1. Scope (3 executors, disjoint)

- **P2A — Personas + Proof wall:** new `personas-tabs.tsx` (tabbed AE/SDR/Manager/RevOps/Founder reusing SEGMENTS + CASES), evolve `social-proof.tsx` stats + add 2nd quote (honest beta voice only, no invented logos). Owns: `personas-tabs.tsx`, `personas-tabs.test.tsx`, `social-proof.tsx` (edits), `homepage-copy.ts` (extend proof only if needed — prefer not).
- **P2B — Integrations wall + VS teaser:** expand `differentiators.tsx BRANDS 6→9` (+teams, google-calendar, outlook with Live/Coming-Soon pills mirroring integrations-page-client.tsx:318-325), mirror in `trust-strip.tsx LOGOS`, add `vs-teaser.tsx` cards linking /vs/otter-ai /vs/fireflies /vs/gong + /otter-alternative. Owns: `vs-teaser.tsx`, `vs-teaser.test.tsx`, `differentiators.tsx` (BRANDS block only), `trust-strip.tsx` (LOGOS block only — coordinate, small).
- **P2C — Team faces-ready + FAQ schema:** `team-showcase.tsx` avatar swap-point ready for photos (next/image with initials fallback, extend TeamMember with photo? optional — initials stay default), add FAQPage JSON-LD to /pricing (mirror vs-comparison.tsx:343-346) + create FAQ block on /features after ComparisonSection. Owns: `team-showcase.tsx`, `lib/team.ts` (optional photo field), `pricing-client.tsx` (schema only), `features-page-client.tsx` (FAQ only), tests.

Mounts: orchestrator/E4-follow mounts personas + vs-teaser + FAQ in page.tsx after gate.

## 2. Specs

- Personas tabs: clone live-proof tab a11y (`aria-pressed`, `aria-label`, active `bg-gray-900 text-white`), data = SEGMENTS(3) + CASES(4) → 5 tabs max (dedupe Discovery). Card shell `doppel-outer>inner p-6`, icon chip peach, per-tab radar angle line + CTA link (Learn more → /features or /demo). Server unless interactive — use client only for tab state like live-proof-strip.
- Proof wall: keep Alex R. card + stats (500+/12/60s/99.2% from SSOT), add 1-2 short beta quotes ONLY if real copy exists — else add G2-style stat card + "12 beta teams" honesty line. No invented names/logos.
- Integrations: 9 tiles via brand-logos.tsx Tiles (reuse, no dup), status pill Live (green) / Coming Soon (gray). Fix honesty: Zoom tile marked Coming Soon (currently shown as live on wall).
- VS teaser: 3 cards (Otter / Fireflies / Gong) with Winner-row hint + "Read comparison →" links, footnote "public pricing as of July 2026".
- Team: avatar `<span>` 39-44 → conditional Image/initials, no layout shift (fixed w-11 h-11 rounded-full). No photos shipped in P2 — readiness only.
- FAQ schema: pricing FAQ const 32-57 → JSON-LD script; features new FAQ 4-5 Qs (migrate, languages, train?, radar, free minutes) + schema. Use dangerouslySetInnerHTML pattern from vs-comparison.

## 3. Guards

- homepage-copy.test.ts (SSOT numbers), hero-scrubbable-video.test (scrub), trust-strip.test (no hardcoded), bundle-gate / 252kB, data-track-section values, PR#42 no-fake rule.
- tsc/eslint/vitest per executor + full build by orchestrator.

## 4. Confirm

Photo readiness (no real headshots in repo — ship fallback), 2nd quote copy source, FAQ Qs approval — confirm before ship.
