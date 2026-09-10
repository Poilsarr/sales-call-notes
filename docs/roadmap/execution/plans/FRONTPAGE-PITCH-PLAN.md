# FRONTPAGE-PITCH-PLAN — Gauge `/` rebuild (Uber-deck clarity + Otter polish)

Date: 2026-09-10 | Status: converged from explore wave | Type: UI-only (no backend)
Plan owner: orchestrator (swarm: explore + UX + PM + analytics)

## 1. Polished brief (refined from founder voice-note)

> Rebuild Gauge's front page (`/`) so a first-time visitor answers in 5 seconds:
> **What is this? What problem does it solve? How is it different? What do I do next?**
>
> Structure the page like Uber's original pitch deck (Cover → Problem → Solution →
> How it Works → Differentiators → Product → Use Cases → Benefits → Proof → CTA)
> with Otter.ai's polish (plain-English What-line, dual CTA, early social proof,
> scannable cards, integration strip, clean hierarchy).
>
> Requirements:
> 1. Clear, pristine, polished copy — no internal jargon above the fold
>    (ban `Open Intelligence`, `MEDDIC`, `Whisper Large V3` from hero).
> 2. Show only what the user needs to decide — demote the short film below the
>    product proof, collapse double-dark sections, defer ROI math until after value.
> 3. Detailed script + functions/events spec so builders execute without guessing.
> 4. Forecast structural problems (copy drift, duplication, CTA competition,
>    blind analytics) and fix them in the same arc across sequenced single-concern PRs.
> 5. Ideate from Otter.ai (primary) + 6 secondary references below. Measure whether
>    users stay / watch / click via 5 new Vercel Analytics events + 2 funnels.

Non-goals: no pricing logic change, no transcription pipeline change, no new vendor
(PostHog/GA4 deferred until funnels show volume). Analytics is a separate PR.

## 2. Evidence (explore wave — read-only, 2026-09-10)

### 2.1 Current `/` inventory (`src/app/page.tsx` 420 lines, server)
- Hero: eyebrow `Gauge` (:73), H1 `Know the moment a competitor enters the deal.` (:74-77),
  sub 3-jobs-at-once (:78-81), beta pill (:82-85), CTA row `<HeroCTA/>` + 2 text links (:86-94).
- Right: LIVE SUMMARY card, hardcoded Acme/Procurement transcript + 3 actions + Health 8.2 /
  Sentiment / Talk 42/58 (:98-157). Amber tape + `doppel-outer border-2 shadow-[8px]` (:99-100).
- Below: `<HeroVideoPlayer/>` 25s film `The 2:14pm Call` (:161-163 + hero-video-player.tsx:36-101).
- Sections: Capabilities 4-cards (:168-191), Competitive wedge dark 3 alerts (:194-300),
  `<SocialProof/>` (:303), `<HowItWorks/>` 4 steps (:306), `<RoiCalculator/>` (:309),
  Pricing teaser 2-col $9 (:312-371), `<FinalCta/>` (:374), Chrome extension strip (:377-405),
  Sticky mobile `<HeroCTA/>` (:410-412) + desktop `<StickyMarketingCta label="Start with 300 free minutes/mo">` (:414-416).
- Design tokens: `globals.css:77-83` doppel-outer/inner (light only on dark secs = mismatch),
  3 competing oranges (`accent #F26522`, `vermilion #E8442E`, CTA `#C94F17`).
- Tests: no component test renders `/`; `roi/seo/marketing-assets/footer-links/bundle-gate/sitemap` pin
  peripherals only; Playwright has no public `/` spec (smoke 200 only).

### 2.2 Otter.ai live fetch (webfetch 2026-09-10, otter.ai/)
- Hero: `Your AI notetaker is now also your Conversational Knowledge Engine` + sub
  `Otter transcribes every meeting, turning it into searchable knowledge that powers your workflow.`
  Dual CTA `Start for free` + `Schedule demo`. Proof at hero: Draper/Brown/Savage quotes + 8 logos
  (Salesforce, Harvard, NBC, Amazon, IBM, Grant, Walgreens, Mastercard).
- Body order: assistant intro → Ask Otter → desktop bot-free → live transcription →
  summaries → action items → CRM push → Channels → use-case tabs (Sales/Education/Media/Recruiting/SDR)
  → capture chooser → enterprise scale → MCP chat → testimonials → `4+ hours saved` stat →
  12 integrations → 3-tier pricing (Free / $19.99 / Enterprise) → final CTA `The world's only Conversational Knowledge Engine`.
- Takeaways for Gauge: 1-line What first; proof+logos in viewport 1-2; use-case tabs for role scent;
  integrations strip (we ship 9 logos in `public/brand/` but render zero); single secondary CTA.

### 2.3 Uber deck (screenshots, Slidebean)
Cover → Problem (3 pains w/ icons) → Solution (4 claims) → How it Works (3 steps + phone UI) →
Key Differentiators (6-grid) → Product (UI + bullets) → Use Cases (4-grid) → User Benefits →
Technology → Market Size → Looking Forward → Go-To-Market (Referral/Virality) → Traction timeline.
Homepage mapping: Hero=Cover, new Problem strip=Slide 2, trimmed Capabilities=Slide 3,
compressed HowItWorks 4→3=Slide 4, condensed compare=Slide 5, wedge+film=Slide 6,
4-chip use-cases=Slide 7, benefits grid=Slide 8, proof/pricing=Slides 10-13.

### 2.4 Positioning facts (grounded, do not invent)
- What: notes + actions + real-time competitive signal; inputs upload/record/Meet extension;
  outputs summary, owners+dates, BANT/MEDDIC/SPIN, Slack ping, talk ratio, sentiment, health.
- Pricing: Free 300 min/mo; Pro $9 flat ≤5 seats 1,200 min; Business $29 6,000 min; Annual -17%.
- Proof (honest): private beta, 500+ calls, 12 testers, 60s avg, 99.2% uptime, 1 quote (Alex R.).
- Tech claimable: Groq whisper-large-v3, Deepgram nova-2 diarize (needs key), embeddings RAG.
  Do NOT claim GPT-4o (code is gpt-4o-mini + llama-3.3-70b) or procurement-detector (mock copy only).
- Existing handlers: HeroCTA modal/link, film play/close, sticky CTAs, nav, demo carousel,
  pricing_* track events. Missing: hero_view, cta_click, film_*, section_view.

### 2.5 Analytics blind spots
Stack = Vercel Analytics + Speed Insights only. CAN answer pageviews/vitals/pricing clicks.
CANNOT answer dwell/bounce/scroll/film/CTAs/funnels/retention/A-B. No instrumentation.ts,
no cookie banner, `/privacy` silent on analytics. Fix = 5 events + 2 funnels, Vercel-only (PR-B).

## 3. Target IA for `/` (10 blocks, alternating white/black)

| # | Section | Purpose | File action |
|---|---|---|---|
| 1 | Hero — What + dual CTA + product visual | Categorize in 3s, one primary action | Keep shell page.tsx:34-70 + card :98-157; rewrite H1/sub :74-81; CTA row :86-94 → dual buttons; rename `Open Intelligence` → `Open dashboard` (hero-cta.tsx:27); single subtle beta line |
| 2 | Proof strip | Borrow trust in 5s | New `proof-strip.tsx`: `12 beta teams · 500+ calls · "caught a Gong mention I missed" — Alex R.`; remove duplicate badge social-proof.tsx:42-45 |
| 3 | Problem — 3 pains | Name cost of status quo | New `problem-section.tsx` (server, 3 icon cards) |
| 4 | How it works — 3 steps | Input → signal → push, plain words | Trim how-it-works.tsx:11-44 4→3; move extension strip page.tsx:377-405 up here as input option |
| 5 | Live product demo | Prove with artifact + 25s video side-by-side | Keep wedge page.tsx:209-293 trimmed 3→1 flagship + move HeroVideoPlayer here as secondary; keep disclaimer :295-298 |
| 6 | Differentiators vs Otter (5 rows) | Answer "why not Otter?" on-page | New `differentiators.tsx` reusing features-page-client.tsx:111-126; link /otter-alternative + /vs/otter-ai |
| 7 | Use cases — 4 chips | Role self-select (SDR/AE/Manager/RevOps) | New `use-cases.tsx` repurposing social-proof.tsx:94-108 segments +1 AE |
| 8 | Benefits (capabilities reframed) | Outcomes not features | Rewrite capabilities[] page.tsx:19-24 to benefit-titles; keep grid :177-189 |
| 9 | Pricing teaser + ROI combined | Price only after value proven | Keep page.tsx:312-371 + roi-calculator as one section, moved below benefits |
| 10 | Final CTA | One close | Keep final-cta.tsx; sticky CTAs unchanged |

Also: add integrations logo strip (reuse `public/brand/*.svg/png`, zero rendered today) inside §5 or §9.
Break double-dark tunnel (wedge + social proof back-to-back) by alternating backgrounds.
Full SocialProof/Roi/FinalCta components stay; only data/order/copy change.

## 4. Homepage script (ships in PR-A)

- H1 (pick 1, A/B variant key `hero_view {variant}`):
  1. `Know the second a rival enters your deal.` (incumbent)
  2. `AI notetaker for sales calls that flags competitors.` (explicit What — recommended)
  3. `Stop writing notes. Never miss a rival mention again.`
- Eyebrow: `Gauge — AI sales-call notetaker`
- Sub (≤25 words): `Gauge turns every sales call into notes, next steps, and a live alert when a rival is named. Upload, record, or capture from Google Meet. Free to start, $9/mo when you grow.`
- CTAs: primary `Start free → /sign-up`, secondary `Watch demo (0:25) → #demo` (scrolls to §5 + plays film).
- Problem bullets: (1) miss rival line in 40-min discovery (Gong example), (2) notes eat ~5h/week,
  (3) follow-ups slip (procurement one-pager / Q3 review).
- How (3): Bring the call (MP3/record/Meet, no bot ever joins) → Get notes + next steps in about a minute
  (transcript + speakers, summary, owners+dates, BANT/MEDDIC) → Get pinged (exact quote + speaker → Slack; 1-click HubSpot/Salesforce).
- Use chips: Discovery (catch rival early) / Procurement review (one-pager on time) / Q3 vendor review (history not guesses) / Coaching (talk + sentiment).
- Diff table (5 rows): Rival alert (Slack ping w/ quote vs none vs heard-live) / No-bot capture / Sales fields built-in /
  CRM push on Pro ($9) vs Enterprise-only / $9 flat 5 seats vs ~$100 vs 5h lost. Footnote: Free 300 min both.
- Final: `Stop writing call notes. Start closing more deals. Free for solo sellers. $9 flat. No card. Cancel anytime.`

## 5. Functions/events to execute

PR-A (UI, no tracking change except variant prop):
- `HeroCTA` accepts `placement` prop for future `cta_click`; rename signed-in label only.
- Film: expose `onPlay` passthrough (no tracking yet); anchor `id="demo"` on §5.
PR-B (analytics-only, separate PR):
- Extend `src/lib/analytics.ts:55-60` MarketingEvent += `hero_view|cta_click|film_play|film_close|film_end|section_view`.
- Wire: hero mount → hero_view; all CTAs → cta_click {id, section, signedIn}; HeroVideoPlayer play/close/ended → film_*;
  RevealObserver threshold 0.5 fire-once → section_view {section}; fix dead `pricing_calculator_used` fire on slider.
- Funnels in Vercel dashboard: F1 Visit→CTA→Signup; F2 Visit→Film→Pricing→CTA.

## 6. Structural forecast + fixes

| Risk | Forecast if unfixed | Fix in this arc |
|---|---|---|
| Hardcoded copy drift (hero/pricing/alerts vs plans.ts) | Plan change = silent lie; pricing test doesn't pin page.tsx | PR-A: centralize homepage strings to `src/lib/homepage-copy.ts`; add `homepage-copy.test.ts` asserting Free 300/Pro 1200/$9 vs plans.ts |
| Duplication (pricing teaser ≈ pricing-client; wedge ≈ demo-carousel) | Stale in one place | PR-A: import don't copy — link to /pricing, /otter-alternative; no new duplicate tables |
| CTA competition (hero+sticky+final, 3 equal links) | Choice paralysis, unmeasured | PR-A: dual-button hierarchy everywhere; PR-B measures |
| Client-island weight (Nav use client, double HeroCTA, lazy LCP poster) | JS bloat, LCP hit, budget gate trip | PR-A: keep server shell; poster `priority` + `fetchPriority=high`; do not add new client comps except differentiators/use-cases as server |
| Token inconsistency (3 oranges, light doppel on dark) | Unpolished, off-brand | PR-A: use `doppel-outer-dark` in dark secs; lock CTA orange to `--accent #F26522`; follow-up token PR if needed |
| No proof/logos/integrations | Below trust bar | PR-A: proof strip + brand strip from existing assets; no invented logos/names |

## 7. Multi-website inspiration backlog (beyond Otter)

Primary: Otter.ai (What-line, dual CTA, proof-at-hero, use-case tabs, integrations, 3-tier pricing).
Secondary (pull 1 pattern each, do not clone):
- Fireflies.ai — `fireflies.ai/` — conversation-intelligence scannability: feature rows with search/command palette motif → inspire §5 demo card chrome.
- Fathom.video — `fathom.video/` — brutal single-CTA hero + 30s lo-fi demo GIF → inspire secondary `Watch demo` treatment.
- Granola.ai — `granola.ai/` — minimal prose-first hero, generous whitespace → inspire §3 problem strip restraint.
- Gong.io — `gong.io/` — outcome-stat band (`% win-rate`) → inspire honest-stat phrasing for future (no fake stats now).
- Linear.app — `linear.app/` — dark product cards + keyboard-hint microcopy → inspire alert-card typography.
- Stripe.com — `stripe.com/` — logo strip + code-adjacent artifact → inspire brand strip + `Sample alerts` disclaimer pattern.
Each executor cites which pattern informed their section in the PR description.

## 8. Execution waves (disjoint file sets — orchestrator does not edit code)

- Executor A (hero + narrative top): `src/app/page.tsx` (hero :69-95 only), `src/components/hero-cta.tsx`,
  NEW `src/components/problem-section.tsx`, NEW `src/components/proof-strip.tsx`, NEW `src/lib/homepage-copy.ts`.
  Script: implement §1-3 + script §4 top + copy centralization + poster priority. Verify: `npx tsc --noEmit`, `npx vitest run src/test/homepage-copy.test.ts src/test/footer-links.test.ts`, `REDIS_HOST=disabled REDIS_PORT=0 npx next build`, screenshot hero desktop+mobile.
- Executor B (proof + differentiation bottom): `src/components/how-it-works.tsx`, `src/components/social-proof.tsx`
  (trim only), `src/app/page.tsx` (§5-9 order + backgrounds), NEW `src/components/differentiators.tsx`,
  NEW `src/components/use-cases.tsx`, `public/brand/*` strip wiring.
  Script: implement §4-9 + brand strip + dark-tunnel break + extension move. Verify: same tsc/vitest/build + `footer-links` + bundle-gate + screenshots of §5/§6/§9.
- Executor C (analytics, SEPARATE PR after A+B merge): `src/lib/analytics.ts`, `src/components/hero-video-player.tsx`,
  `src/components/reveal-observer.tsx`, `src/components/sticky-marketing-cta.tsx`, `src/components/pricing-calculator.tsx`,
  NEW `src/test/homepage-events.test.ts`, `src/app/privacy/page.tsx` (disclosure paragraph only).
  Script: implement §5 events + funnels doc. Verify: vitest new test + build; no UI snapshot change.
- Gate (orchestrator): `npx vitest run && npx next build`, eslint on touched files, Playwright smoke `/ → 200`,
  single-concern commits, sequential pushes, CI green, row in DEVELOPMENT_FRONTIER.md.

## 9. Acceptance

- [ ] 5-second test: What / Problem / Diff / Next action legible without scrolling past §3.
- [ ] No jargon above fold; dual CTA everywhere; film demoted to §5 with `Watch demo (0:25)`.
- [ ] Proof strip + brand strip present; no invented logos/quotes/stats.
- [ ] Alternating backgrounds; no back-to-back dark walls; mobile sticky single CTA.
- [ ] Copy centralized + tested vs plans.ts; footer-links + bundle-gate green.
- [ ] PR-A UI-only; PR-B analytics-only; PR-C docs row.
