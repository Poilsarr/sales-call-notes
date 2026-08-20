# BUNDLE-PLAN — re-baseline + optimization

> Arc B of ARCS-BACKLOG.md. Restores bundle-gate honesty and claws back
> real bytes. Established 2026-08-19 after explore wave (evidence below).
> Guardian protocol applies (ARC-CONTEXT-GUARDIAN.md).

## Verified facts (explore wave 08-19, all evidence file:line)

- **Root cause is two stacked factors:**
  1. Shared floor grew ~30 kB on EVERY route via the intentional stack upgrade: react ^18→^19.2.8, react-dom ^18→^19, next 14.2.3→15.5.23, @clerk/nextjs ^5→^6.39.6 (package.json diff vs ed323a3). Build log: "First Load JS shared by all: 184 kB" — chunk `7655-cee0a6b00be5cdc9.js` 126.7 kB gz (react-dom 19 **+ @sentry/nextjs client SDK merged in**) + `4bd1b696` 54.5 kB gz (react runtime).
  2. New client code on app pages: sonner 10.1 kB gz (settings :20-21, billing :5), shared PLANS chunk `6635` 2.7 kB gz (billing :12, dashboard :15, settings :19 — all "use client" pages), GSAP 48.5 kB gz on /features (features-page-client.tsx:1 "use client", static imports :6-8, :23).
- Fresh vs June (budgets at src/test/bundle-gate.test.ts:21-30): `/` 222 vs 190 (+32, budget 220), /demo 191 (+21, 180), /pricing 229 (+39, 210), /features 279 (+30, 260), /settings 250 (+44, 215), /onboarding 190 (+22, 175), /dashboard 237 (+43, 210), /billing 234 (+26, 220). ALL 8 fail.
- No charts lib (dashboard charts are hand-rolled SVG: src/components/ui/area-chart.tsx:1, donut-chart.tsx:1 — not drivers). No webpack/turbo config in next.config.mjs. Sentry wrapper `withSentryConfig` + static `import * as Sentry` in sentry.client.config.ts:1,30 → full browser SDK in the shared chunk.
- @vercel/analytics + @vercel/speed-insights in root layout (src/app/layout.tsx:113-114, chunk `7025` 9.0 kB gz) load on every page incl. marketing.
- PLANS client importers (verified): billing/page.tsx:12, settings/page.tsx:19, dashboard/page.tsx:15 (upgrade-prompt.tsx:8 is type-only — erased). Server importers have no bundle cost.

## Workstreams

### B-A — Sentry client SDK out of the shared chunk (biggest lever, try-first)
Target: `7655` (126.7 kB gz shared incl. react-dom 19 + Sentry). Removing ~30-40 kB gz of Sentry from EVERY route's first load.
Files: `sentry.client.config.ts` (repo ROOT, not src/), possibly NEW `src/instrumentation-client.ts`, `src/app/global-error.tsx` (static `import * as Sentry` :1-4, no init), AND — BLOCKING review fix — `src/test/sentry-config.test.ts` (:13-14 fs.stat on the file) + `src/test/sentry-release-env.test.ts` (:12-16,21-31 readFileSync + release/env regexes) MUST move to executor 1's allowlist and be re-pointed at the new init location (preserving release/env tags + the PII scrubber at sentry.client.config.ts:10-51).
Approach: @sentry/nextjs 10.56.0 injects `./sentry.client.config.ts` into the `main-app` entry ONLY if the file exists (node_modules webpack.js:271-276) — deleting it stops the SDK landing in the shared chunk. Lazy-init is NOT a documented Sentry pattern (documented options are eager); it is bespoke: dynamic `import("@sentry/nextjs")` + init inside global-error.tsx when an error fires. DOCUMENTED TRADEOFF: lazy init drops non-global-error client capture (unhandledrejection/onerror) — acceptable at beta scale, note it in the code comment.
FALLBACK (safety valve, per plan): if the SDK fights the split, abandon and KEEP Sentry in the floor — never ship a half-working error reporter.
Success check: build log shows the SDK no longer in the shared first-load chunk AND sentry-config/sentry-release-env tests pass against the new init location.

### B-B — GSAP off the /features critical path (~48 kB gz)
Files: src/components/features-page-client.tsx (split into parent + NEW lazy child src/components/features-animations.tsx).
Approach (review-corrected: there is NO server shell — src/app/features/page.tsx:21-22 renders the whole page as one client component): parent-client keeps static sections (Nav, ComparisonSection :493, CTA, StickyMarketingCta, ParticleCanvas :87-163 canvas-only) + `next/dynamic` (ssr:false) child holding the GSAP-driven sections (HeroMockup :168-183, FeatureCard/AnimatedIcon :246-250/:317-325, AnimatedCounter/StatsSection :432-447/:471-478, WorkflowSection :591-613, hero timeline :679-686, + Feature3D 3D-SVGs :15-19). Static gsap imports (:6-8, :23) move into the child only.
Tradeoff (documented): with ssr:false the grid's HTML appears after the child loads — the near-viewport IO fires immediately for the hero, so the child effectively loads on mount; expectation: /features lands well under 231 kB (3D SVGs leave too). Preserve identical animation options/easing.

### B-C — Trim authenticated pages (dashboard/settings/billing)
Files: src/app/dashboard/page.tsx, src/app/settings/page.tsx, src/app/billing/page.tsx, NEW src/components/toaster-host.tsx (client, next/dynamic ssr:false of sonner Toaster), src/app/api/billing/route.ts (additive field only).
1. /dashboard: drop the client PLANS import (dashboard/page.tsx:15) — the `/api/billing` GET response (api/billing/route.ts:41-56) has plan tier/usage/limits/features but NOT plan.name; dashboard uses `getPlan(billing.plan).name` (page.tsx:196,499). ADD an additive `planName` display field to the billing route (consumers: dashboard:168, settings:104, billing:34, billing-plan-gate.test.ts — all read existing fields, additive breaks nothing). Removes PLANS chunk `6635` from the dashboard graph.
2. Toaster placement (review-corrected): Toaster is mounted ONLY on /settings (settings/page.tsx:205) + the /app layout (src/app/app/layout.tsx:37). /billing calls toast() (:60,68,71,89,92,95,99) with NO Toaster mounted — those toasts are invisible TODAY; mounting toaster-host on /billing is a fix of a latent bug, not a move (report it as such). /settings: replace its Toaster with toaster-host (ssr:false; all toast() calls are event-handler-only — safe). ~10 kB gz off settings; billing gains working toasts.
3. STALE TOAST COPY (W-B follow-up; scope review-corrected): settings/page.tsx:189 AND :303-306 carry the "sign in within 7 days to cancel" 7-day-grace copy — hard delete is now INLINE (api/user/delete/route.ts:17-27,111). Rewrite both to honest immediate-purge language; check the export/delete status strings on the same page for staleness. No test pins this copy.

### B-D — Re-baseline the gate (lands LAST, after B-A/B-B/B-C)
Files: scripts/.proof-bundle.txt (regenerated), src/test/bundle-gate.test.ts (BUDGETS + comments).
Approach:
1. Regenerate proof: `REDIS_HOST=disabled REDIS_PORT=0 npx next build 2>&1 | grep -E '^[├└┌] [ƒ○λ] ' > scripts/.proof-bundle.txt`.
2. New budgets = **OLD GATE BUDGETS + 32 kB** (the measured stack-upgrade floor delta: `/` June 190 → fresh 222 before optimizations; derivation is old-budget + 32, NOT June-measured + 32 — keep the comment honest). Validated table:
   /: 252, /demo: 212, /pricing: 242, /features: 292, /settings: 247, /onboarding: 207, /dashboard: 242, /billing: 252.
   NOTE (review-validated): /settings fresh 250 EXCEEDS its new budget 247 pre-optimization — it needs B-C's sonner/Toaster work to pass (B-D lands last, so fine). Realistic post-B-C expectation ~237-240, NOT 215 (toast() calls keep sonner's core; only part of the 10.1 kB leaves). /features expected well under 292 (GSAP+3D SVG leave). If any route still exceeds its new budget after B-A/B-B/B-C, the executor must find another win or flag it explicitly for the orchestrator — no silent bumps beyond the documented floor delta.
3. Update the test header comment: document the June→Aug floor inflation (React 19 / Next 15 / Clerk 6) as the reason budgets moved, so future agents don't treat it as regression.
4. The freshness test stays as-is (proof regenerated = fresh).

## Execution (swarm, disjoint file sets)

| Executor | Files | Commit |
|---|---|---|
| 1 (B-A) | sentry.client.config.ts (root), src/app/global-error.tsx, instrumentation-client.ts (new, only if needed), src/test/sentry-config.test.ts, src/test/sentry-release-env.test.ts (re-point at new init) | `perf(sentry): lazy client SDK out of shared chunk` |
| 2 (B-B) | features-page-client.tsx, features-animations.tsx (new) | `perf(features): GSAP lazy-loaded off first load` |
| 3 (B-C) | dashboard/page.tsx, settings/page.tsx, billing/page.tsx, toaster-host.tsx (new), api/billing/route.ts (additive planName only) | `perf(pages): drop PLANS from dashboard, lazy Toaster, honest delete toast` |
| 4 (B-D) | scripts/.proof-bundle.txt, src/test/bundle-gate.test.ts | `chore(perf): re-baseline bundle gate to Next-15 floor` |

Conflict note: B-D must land AFTER 1-3 (needs the optimized build numbers). Orchestrator orders: executors 1+2+3 in parallel → full gate → executor 4 → gate → commits (sequential push).

## Gate & ship
1. Per-executor: their test files + `npx tsc --noEmit`.
2. Orchestrator full gate: `npx vitest run` (1100 + new) + `npx tsc --noEmit` + `REDIS_HOST=disabled REDIS_PORT=0 npx next build` + bundle-gate green on the NEW budgets.
3. Guardian checkpoint before commits (allowlist, claim-vs-diff, secrets, test counts).
4. 4 commits, sequential push, CI green per commit.
5. Docs: frontier rows (4), ARCS-BACKLOG B status, this plan's Plan status.

## Out of scope (debt)
- @vercel/analytics + speed-insights lazy island (~10 kB, marginal data-loss risk) — optional later, not this arc.
- Deep bundle surgery (manual chunk splitting, reactCompiler) — v2.
- Dependency upgrades (arc C) unchanged.
- KG calls[] scrub + presigned path (frontier rows, unchanged).

## Plan status
- Last verified checkpoint: 4c64e47 (2026-08-20, full gate 1112/1112, tsc clean, build green, shared floor 105 kB, all 8 routes 73–145 kB under new budgets).
- Guardian verdicts: CLEAR (2026-08-20, pre-commit: allowlist, secrets, claim-vs-diff, test counts).
- Open drift items: none.