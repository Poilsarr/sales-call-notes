# PRICING-FEATURES-REDESIGN-PLAN — kill the theoretical feel, keep the pins

> Follow-up to GAUGE-REDESIGN-PART1/2 (homepage, merged #168). Same complaint class: text-only stretches, repeated doppel+peach cards, zero product visuals on /pricing; abstract-3D cards + CTA gaps + copy contradictions on /features.
> Rules: one concern per file set, SSOT pins stay green, no fake proof, no commit/push without owner confirm.

## 1. Findings (explore 2026-09-28)

**/pricing** (`pricing-client.tsx:766`): 8x `doppel-outer`, 5x peach chip, zero `<Image>/<video>`. Exhibits: trust badges (3x peach), switching (peach + text), final CTA (double H2 + peach x3), social-proof (personas, no quotes by design), hero right (checklist card, no Pro dashboard shot), FAQ text-only. Pins: `pricing-copy.test.ts` (flat-rate strings, FAQ archived-wording, calculator Business), `pricing-fixes.test.ts` (annual label, Gauge col classes, Unavailable fallback), `pricing-client.test.tsx` (Clerk/Paddle auth gate — mocks subcomponents, no visual asserts), `homepage-copy.test.ts` cross-pin (300/1200/$9).

**/features** (`features-page-client.tsx:384` + `features-animations.tsx:587` + `feature-content.ts:249`): visual-led but abstract 3D (no screenshots), hero has NO CTA, cards have NO links, stats/workflow/comparison/FAQ/CTA all text-only. Reuse gap: product-visual-card, radar-moat, vs-teaser, trust-strip all unreused here. Copy stretches in `feature-content.ts`: Switchboard 98.2% w/o eval link; 10k+ tuned calls; copy-vs-sync contradiction (card says formatted-notes copy, content says two-way sync); local-default vs cloud-default privacy contradiction; 12 vs 99 languages triple-number; health-score 60+ signals; DER 6.8%; 10+ vs 4 integrations. Pins: `p2c-team-faq.test.tsx` (FAQ length/keywords/order, dynamic→null mock kills animations in tests), `api-docs-v1.test.ts` (feature-content must contain `Documented at /api-docs/v1`, must NOT contain `OpenAPI 3.1 spec published`).

## 2. Scope (2 executors, disjoint)

**Q1 — Pricing visual proof (owns ONLY: pricing-client.tsx blocks, pricing-calculator.tsx, pricing-social-proof.tsx, sticky/exit untouched, + tests):**
1. Hero right: replace checklist card with Pro-tier proof visual (tier summary + mini confidence/Slack motif, coded mock, tokens film/accent) — keep BillingToggle + Paddle logic untouched.
2. Trust badges: 3 peach cards → single trust strip (mono pills + logo row reuse from trust-strip, no new assets).
3. Switching: add migration visual (3-step coded mock: export → import → searchable) + keep copy.
4. Final CTA: dedupe double H2 into one, add product motif, keep /sign-up pill + Paddle paths.
5. Social-proof: keep honesty disclaimer, add stat-card treatment (no invented quotes).
6. Must keep: all pricing-copy/pricing-fixes strings, Gauge col classes, annual labels, auth-gate behavior. Verify: pricing-client.test, pricing-copy, pricing-fixes, calculator tests.

**Q2 — Features proof + honesty (owns ONLY: features-page-client.tsx, features-animations.tsx HeroMockup/cards insertion only, feature-content.ts copy fixes, vs-teaser/comparison links, + tests):**
1. Hero: add CTA row (Start free / See pricing) + keep ParticleCanvas/HeroMockup.
2. Insert product-visuals band (reuse ProductVisualsSection) between Workflow and ComparisonSection; add `Read comparison →` links from ComparisonSection to /vs/otter-ai, /vs/fireflies, /vs/gong + /otter-alternative (kills forked-claim risk).
3. Copy-honesty fixes in feature-content.ts (minimal edits): resolve copy-vs-sync, local-vs-cloud privacy (single story: cloud default, local option), one language number, soften unevidenced metrics (98.2%, 10k+, 92%, DER 6.8%, 99.9%) to honest ranges or link evals. Keep `Documented at /api-docs/v1`, keep OpenAPI ban.
4. Cards: add per-card link (Learn more → /api-docs/v1 or relevant) without breaking toggle.
5. Verify: p2c-team-faq.test, api-docs-v1.test. Animations render null in tests (dynamic mock) — assert structure only.

## 3. Gate

tsc + eslint on touched files, targeted vitest (pricing-*, p2c-team-faq, api-docs-v1, homepage-copy), full vitest (expect only pre-existing proof-openai freshness fail), next build. Present diff + screenshots for confirm. NO commit/push.
