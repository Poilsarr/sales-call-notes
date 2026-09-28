# VS-FUNNEL-PROOF-PLAN — product proof in comparison pages + funnel links + color/honesty fixes

> Third design arc after #168 (homepage) + #169 (pricing/features). Targets longest text-only stretches: 5 `/vs/*` pages (one shared template), `/demo`↔`/vs` disconnection, CTA orange drift, stale api-docs copy.
> Rules: single-concern sets, pins green, no new claims, no commit/push without confirm.

## 1. Scope (3 executors, disjoint)

**R1 — vs-template proof (owns ONLY src/components/vs-comparison.tsx + vs-comparison test if created):**
1. Insert one `ProductVisualCard` (reuse, variant per page: transcript for otter/fathom, slack for fireflies/tldv, crm for gong — prop-driven, template reads page data or defaults transcript) between TL;DR table (`:130`) and talking-points (`:133`).
2. Replace privacy wedge text-only (`:266-282`) visual: keep copy, add Slack-mock motif or Shield + mono pills (no new claims).
3. CTA color: `bg-[#C94F17]` (`:70,324`) → `bg-[#F26522]` to match homepage/extension (hover states accordingly).
4. Add secondary cross-link to `/demo` beside `See full pricing` (connects funnels; demo hero already links pricing/features).
5. Keep: all 5 pages' data untouched, table classes, FAQ schema, metadata. Verify: vs-teaser.test (untouched, still green), build renders all 5.

**R2 — demo funnel + integrations color (owns ONLY src/app/demo/page.tsx, src/components/demo-carousel.tsx, src/components/integrations-page-client.tsx CTA block):**
1. Demo carousel CTA card: add `Compare vs Otter/Fireflies → /vs/otter-ai, /vs/fireflies` links (mirrors vs-teaser, no new components).
2. Demo hero sub: soften `same engine runs on every paid plan` with plan-mapping hint or drop clause (no new claims).
3. Integrations CTA `434-459` + badges `321-326`: `#C94F17` → `#F26522` system (links already #F26522). No OAuth logic touch.
4. Verify: integrations-page-client.test (11 tests), smoke `/demo 200` pattern, build.

**R3 — api-docs honesty (owns ONLY src/app/api-docs/page.tsx copy + src/test/api-docs-*.test.ts):**
1. Index v1 card: `Released 2026-06-21 · 4 endpoints` → accurate count (9 rendered) or drop count.
2. Extend api-docs-v1.test with asserts for the 5 newer endpoints (additive, keeps existing 4).
3. No component/route changes. Verify: api-docs tests green.

## 2. Explicitly OUT (needs owner)

- Partners payout/dashboard claims, extension store listing URL, blog placeholder, roadmap marketing, gong reported-numbers (already hedged), lawsuit citations. Flagged in explore; owner decides.
- VsTeaser 3→5 pages (would break vs-teaser.test + features-q2.test pins) — separate decision.

## 3. Gate

tsc + eslint touched files, targeted (vs-teaser, integrations-client, api-docs-*, homepage-copy), full (expect only proof-openai), build (check /vs/* + /demo prerender). Present, no commit/push.
