# STAY-FIXES-PLAN — make users stay (sequential PRs)

Date: 2026-09-10 | Status: PR-1 executing | Parent: FRONTPAGE-PITCH-PLAN.md
Evidence: 3-agent research swarm 2026-09-10 (Growth retention loops, PM message map, UX stay patterns — all 7 sites live-fetched, zero failures).

## Sequence (strictly sequential, one concern per commit)

- **PR-1 (small, server-only, this plan):** stat band + film demote + dark-tunnel break + 5 copy swaps. No client components, no tracking, no new deps.
- **PR-2 (analytics-only):** `hero_view` / `cta_click` / `film_*` / `section_view` + fix dead `pricing_calculator_used` + 2 Vercel funnels (spec in FRONTPAGE-PITCH-PLAN §5).
- **PR-3 (retention loop):** shareable public recap links + weekly rival-digest email (top-2 transferable mechanics).

## PR-1 scope (exact)

### A. Copy swaps (verbatim targets — executor reads file first, uses disk-exact oldString)
1. `src/lib/homepage-copy.ts` heroSub → "Gauge takes notes for every sales call — and pings you in Slack the moment a rival is named, with the exact quote. Upload an MP3, record in your browser, or capture Google Meet with no bot joining." (Fathom one-outcome-then-inputs pattern; price moves to CTA line.)
2. `src/app/page.tsx` capabilities[0].desc → "Drop in an MP3, record in your browser, or capture Google Meet — no bot ever joins the call." (kill "Whisper"/"pipe".)
3. `src/app/page.tsx` capabilities[2].desc → "Summary, owners and due dates, and a follow-up draft — one click into HubSpot or Salesforce." (kill "MEDDIC".)
4. `src/app/page.tsx` pricing H2 → "Free 300 minutes a month. $9 flat when you scale — up to 5 seats, 1,200 minutes." (name units, kill "No AI credit traps".)
5. `src/lib/homepage-copy.ts` proof quote → "Gauge caught a Gong mention I missed in a 40-minute discovery call." — Alex R., SDR, beta tester. (Otter-format full sentence; no company/logo invented.)
- Update `src/test/homepage-copy.test.ts` iff it pins old strings (it asserts no-jargon + numbers — keep those green).

### B. Stat band (S)
- `src/components/proof-strip.tsx`: append honest 3-stat row — 500+ calls · 60s avg · 99.2% uptime (numbers already in `social-proof.tsx`, no invention).

### C. Film demote (S)
- `src/app/page.tsx`: remove `<HeroVideoPlayer />` from hero block; render it beside the wedge flagship header (side-by-side per FRONTPAGE-PITCH-PLAN §5). Hero keeps product card. `Watch demo (0:25) → #demo` keeps working (`id="demo"` lives on the component wrapper).

### D. Dark-tunnel break (S)
- `src/components/social-proof.tsx`: re-theme section light (white bg, dark text, adjust inner cards off `bg-zinc-900/*`). Result: wedge dark → SocialProof light → HowItWorks light → Differentiators dark → UseCases light. No back-to-back dark.

## Forbidden (all PRs)
Accuracy % claims, mid-call live-alert claims, revenue-lift / SOC2 / HIPAA / GPT-4o claims (see research §4 never-claims). No invented logos, names, stats. No `track()` calls (PR-2). No pricing-logic or backend changes.

## Execution (disjoint)
- Executor A: `src/app/page.tsx` + `src/lib/homepage-copy.ts` + `src/test/homepage-copy.test.ts` (swaps 1-4 head + film move + test upkeep).
- Executor B: `src/components/proof-strip.tsx` + `src/components/social-proof.tsx` (stat band + light re-theme + swap 5 lands via homepage-copy? No — swap 5 is homepage-copy.ts = A's file. B only renders; attribution text comes from HOMEPAGE_COPY automatically.)
- Gate (orchestrator): `npx tsc --noEmit`, eslint touched, `npx vitest run`, `REDIS_HOST=disabled REDIS_PORT=0 npx next build`, smoke `/ → 200`. Then single UI commit + docs commit (frontier row), sequential push.

## Acceptance
- [ ] 5-second test intact; What-line H1 unchanged.
- [ ] No jargon above fold (Whisper/MEDDIC/credit-traps gone from page).
- [ ] Hero = H1 + card only (no film); film renders once in demo section.
- [ ] No adjacent dark sections; mobile sticky single CTA.
- [ ] homepage-copy/footer-links/bundle-gate green; full suite + build green.
