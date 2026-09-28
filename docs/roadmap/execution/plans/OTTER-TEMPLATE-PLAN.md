# OTTER-TEMPLATE-PLAN — Gauge homepage on Otter's structural skeleton

> Owner-ordered 2026-09-28: "not satisfactory — copy the exact template of otter.ai, mold it for our product." Boundary: structure/layout/CTA-rhythm mirrored; all copy, assets, code original (nothing lifted).
> Rules: hero copy + analytics + scrub contract + bundle budget frozen; section order free; no commit/push without confirm.

## 1. Template map (Otter T1..T12 → Gauge)

| Otter | Gauge fill (original copy/components) |
|---|---|
| T1 Header | Keep `Nav` (already matches: logo/links/demo/login/Start-free). No change. |
| T2 Hero | Keep hero block + `HeroScrubbableVideo` + CTA cluster + bullets (copy frozen by homepage-copy.test). No copy change. |
| T3 LogoMarquee | Move `TrustStrip` (9 integration logos + proof) directly under hero. |
| T4 FeatureBento | `ProductVisualsSection` (3 proof cards) + `HowItWorks` (3 steps) adjacent, with demo link + signup close. |
| T5 PersonaTabs | Keep `PersonasTabs` (5 tabs already mirrors Otter). No change. |
| T6 ObjectionTrio | NEW `ObjectionTrio` (no-bot capture / never-train privacy / 1-click migrate — all existing claims from differentiators rows). |
| T7 ProofWall | `SocialProof` (stats + Alex R. + honesty) + `LiveProofStrip` (tap-a-call) adjacent. |
| T8 Integrations | Keep `Differentiators` brand strip + add `View all integrations → /integrations` CTA. |
| T9 Pricing3Col | NEW `PricingTeaser` (Free $0 / Pro $9 / Business $29 from plans.ts truth + /pricing link). Middle emphasized. |
| T10 FinalCTA | Keep `FinalCta`, change tertiary to `See live demo → /demo` (duo like Otter). |
| T11 SEOLinks | NEW `SeoLinks` (8-10 links: blog, vs x5, otter-alternative, api-docs, extension — all existing routes). |
| T12 Footer | Keep `SiteFooter` (global). No change. |

Kept off-template (differentiators, low risk): `ScrubSummarySection` (pinned, stays right after hero as video companion), `HeroEvidenceStack`, `ProblemSection`, `RadarMoat` (after bento as moat anchor), film wedge (cinema break before Team), `TeamShowcase`+`WhoWeAre` (founder edge Otter lacks), `VsTeaser`, `UseCases`, `RoiCalculator` (before pricing), extension card, stickies.

## 2. Target order (page.tsx)

Nav → Hero → ScrubSummary → TrustStrip → HeroEvidenceStack → ProblemSection → ProductVisualsSection → HowItWorks → RadarMoat → PersonasTabs → ObjectionTrio(NEW) → SocialProof → LiveProofStrip → Differentiators(+view-all) → VsTeaser → UseCases → RoiCalculator → PricingTeaser(NEW) → film → TeamShowcase → WhoWeAre → FinalCta(duo) → SeoLinks(NEW) → stickies.

## 3. Contracts (parallel-safe)

- `src/components/pricing-teaser.tsx`: `export default function PricingTeaser()` + named export same. Data from `src/lib/plans.ts` (Free 300min $0 / Pro $9 1200min 5 seats / Business $29 6000min), CTAs `/sign-up` x2 + `Contact sales mailto:sales@usegauge.com` enterprise? (Teaser is 3-col Free/Pro/Business + enterprise line → /pricing.) `data-track-section="pricing-teaser"`. No `id="demo"`.
- `src/components/objection-trio.tsx`: `export default function ObjectionTrio()`, 3 cards (Crosshair/ShieldCheck/Download icons, existing claim strings only), `data-track-section="objections"`.
- `src/components/seo-links.tsx`: `export default function SeoLinks()`, heading + links to existing routes only (footer-links.test must pass), `data-track-section="related"`.
- Tests: `src/components/otter-template.test.tsx` (one file, all three: headings, hrefs resolve, no id dup, track-sections present).

## 4. Executors (disjoint)

- **O1:** 3 new components + otter-template.test.tsx. No page.tsx, no existing sources.
- **O2:** page.tsx reorder of EXISTING sections only (move blocks, no new mounts, no copy edits).
- **O3 (after O1+O2):** mount NEW trio in page.tsx + FinalCta tertiary → /demo + Differentiators view-all CTA link.
- Each: tsc/eslint/vitest own files. No commit/push.

## 5. Gate

tsc clean; eslint; targeted (homepage-copy, homepage-events, scrubbable, trust-strip, product-visuals, radar-moat, personas-tabs, vs-teaser, otter-template, footer-links); full (expect only proof-openai); build ≤252kB + regen proof-bundle.txt; present diff for confirm.
