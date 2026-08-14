# LIGHTHOUSE-CI-PRD — Hard-gate Lighthouse CI on PRs

Status: IN PROGRESS — local gate green, awaiting commit + green `workflow_dispatch` run on main
Owner: orchestrator + parallel executors (swarm)
Gate: `npx vitest run` + `npx tsc --noEmit` + `REDIS_HOST=disabled REDIS_PORT=0 npx next build` + local `lhci collect/assert` proof + `git status --short` clean before push.

## Problem statement

`.github/workflows/lighthouse.yml` has been **red on main since 2026-07-16** (empirically:
`gh run list --workflow lighthouse.yml` — failures on 07-16 main push, 07-20 ×2, 07-26 ×1;
last green 07-11). It is **not a required status check**, so the red job is silently
ignored — the "Lighthouse CI runs as soft-warn only" item tracked in
`docs/roadmap/DEVELOPMENT_FRONTIER.md` ("Code-Doable Left on the Board", row 1).

The job **never reaches Lighthouse at all**: `npx next build` fails during
"Collecting page data" with `AggregateError [ECONNREFUSED] ::1:6379 / 127.0.0.1:6379`
(verified in run 30211958540 logs). Root causes (explore-wave verified, file:line):

| # | Root cause | Evidence |
|---|---|---|
| R1 | The job passes **no env at all** — no `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → `ClerkProviderBase` throws during prerender of every page (`src/app/layout.tsx:110`; clerk-react `throwMissingPublishableKeyError`) | ci.yml Build job passes `${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_dummy' }}` — lighthouse.yml mirrors nothing |
| R2 | BullMQ `Queue` instances connect to Redis at module scope (`src/services/queue.ts:8-19`, 7 queues, host defaults `localhost:6379`) → ECONNREFUSED in the lighthouse job's build. Note: ci.yml's Build job is green WITHOUT Redis env — the observed failure is specific to the lighthouse job (no env at all, no `.env` write), so queue.ts is the mechanism and missing env the trigger; both are covered by the fix | run 30211958540 log; local build only green with `REDIS_HOST=disabled REDIS_PORT=0` (repo's documented convention, CLAUDE.md) |
| R3 | Stale `startServerReadyPattern: "ready started server"` — Next 15.5 logs `✓ Ready in …` (`node_modules/next/dist/server/lib/start-server.js:386`); old string vanished (`grep` = 0 hits) | `.lighthouserc.js:5`; lhci 0.15.1 warn-and-proceeds on timeout (`collect.js:171-177`) |
| R4 | Duplicate `"categories:performance"` key in assertions | `.lighthouserc.js:21` and `:25` |
| R5 | `@lhci/cli` installed ad-hoc mid-CI (`npm install --save-dev @lhci/cli`) instead of a pinned devDependency — network-dependent, flaky (npmjs was unreachable this session) | `lighthouse.yml:27`; `package.json` has no `@lhci/cli` |
| R6 | Audited URLs include three that cannot pass in keyless CI: `/pricing` (throws without `NEXT_PUBLIC_PADDLE_CLIENT_KEY`, `pricing-client.tsx:143-148`), `/sign-in` (Clerk middleware 500s without keys, `middleware.ts:83-93`), `/features` (GSAP canvas RAF loop + `Math.random()` waveform hydration mismatch → CLS/TBT flakes, `features-page-client.tsx:119-155,168-199`) | explore-wave stability audit |

## Goals (must)

1. `lighthouse.yml` becomes a **hard, dependable gate on PRs** (assertions fail the job).
2. Job is **green on main** at ship time (thresholds grounded in a real local run, ~5% headroom).
3. Catches regressions on the hard-gated categories: a11y, performance, best-practices, LCP, CLS, byte weight. SEO is warn-only pending the meta-in-body fix (tracked item, see `.lighthouserc.js` comment + DEVELOPMENT_FRONTIER.md).
4. Build step mirrors the proven-green `ci.yml` Build job (same env fallbacks) + `REDIS_HOST=disabled REDIS_PORT=0`.
5. `@lhci/cli@0.15.1` pinned in devDependencies; `.lighthouseci/` gitignored.

## Non-goals (explicit)

- No product-code changes (no queue.ts refactor, no status-client fix — tracked separately).
- No migration changes (15 migrations restored + baseline quarantined per DB-optimizer/LEO verdict).
- No change to `lighthouse-prod-nightly.yml` (stays informational; prod monitoring).
- Not adding Lighthouse as a GitHub *required* status check yet — make it green + stable first, then user decides.
- No `/features`, `/pricing`, `/sign-in`, `/status`, `/demo` in the audited set (flaky/500 in keyless CI).

## Success criteria

- `npx lhci autorun` (final config) passes locally against the real built app.
- `REDIS_HOST=disabled REDIS_PORT=0 npx next build` green; `npx vitest run` green; `npx tsc --noEmit` green; `npm run lint` green.
- Workflow YAML + config reviewed by verification cloud (Code Reviewer, Reality Checker).
- After merge: workflow_dispatch run on main is GREEN (real CI proof).
