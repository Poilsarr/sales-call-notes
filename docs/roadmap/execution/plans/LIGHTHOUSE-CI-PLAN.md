# LIGHTHOUSE-CI-PLAN — Executable order

Gate: `npx vitest run` + `npx tsc --noEmit` + `REDIS_HOST=disabled REDIS_PORT=0 npx next build` + local lhci proof + `git status --short` clean. Never `git add -A` in this arc — the tree contains unrelated noise (graphify-out/, scripts/.proof-openai.json).

## Phase 0 — Facts (DONE)

- Explore wave (2 agents) verified root causes R1-R6 (see PRD) + stability audit.
- CI failure proven from run 30211958540 logs: ECONNREFUSED :6379 during build.
- Migration incident (15 deleted tracked files + untracked baseline): DB Optimizer + Lead Engineering Operator verdict → **restore + quarantine** — DONE (`git restore --worktree -- prisma/migrations/`; baseline moved to temp). prisma/migrations/ clean.

## Phase 1 — Grounding proof run (DONE/IN-PROGRESS)

1. Build: `REDIS_HOST=disabled REDIS_PORT=0 npx next build` — GREEN.
2. `lighthouserc.proof.js` (no assertions, 5 URLs × 1 run, desktop) — collect running in background.
3. Read `.lighthouseci/results.json` → real per-URL scores → fill TRD assertion matrix with ~5-10% headroom.

## Phase 2 — Execute wave (parallel, disjoint files)

**Executor A — CI plumbing:**
- Rewrite `.lighthouserc.js` (T1) with proof-grounded thresholds; delete `lighthouserc.proof.js`.
- Rewrite `.github/workflows/lighthouse.yml` (T2).
- `package.json` + `package-lock.json`: normalize lockfile `resolved` URLs yarnpkg→npmjs; keep `@lhci/cli ^0.15.1`.
- `.gitignore`: add `.lighthouseci/`.

**Executor B — Docs:**
- `docs/roadmap/PERF_BUDGETS.md`: Lighthouse score budgets section (T5).
- `docs/roadmap/levels/LEVEL_4.md`: note Lighthouse hard gate status (only if a Lighthouse item exists there).
- PRD/TRD/PLAN trio already written (orchestrator).

## Phase 3 — Orchestrator gate (sequential, all must pass)

1. `REDIS_HOST=disabled REDIS_PORT=0 npx next build` → exit 0.
2. `npx lhci collect --config=.lighthouserc.js && npx lhci assert --config=.lighthouserc.js` → exit 0 (assert against fresh local runs; thresholds must pass with headroom to spare).
3. `npx vitest run` → green (regression: nothing should be affected).
4. `npx tsc --noEmit` → clean.
5. `npm run lint` → 0 warnings.
6. Verification cloud (read-only): Code Reviewer (workflow YAML + config), Reality Checker (no fabricated claims in docs; thresholds trace to proof numbers).

## Phase 4 — Ship

1. Scoped adds ONLY: `.lighthouserc.js` `.github/workflows/lighthouse.yml` `package.json` `package-lock.json` `.gitignore` `docs/roadmap/execution/plans/LIGHTHOUSE-CI-*.md` `docs/roadmap/PERF_BUDGETS.md` (+ `docs/roadmap/levels/LEVEL_4.md` if touched).
2. Single-concern commit(s): `ci: hard-gate Lighthouse CI on PRs (green on main)`.
3. Consult user → push → `workflow_dispatch` run on main must be GREEN (real CI proof).
4. Update `docs/roadmap/DEVELOPMENT_FRONTIER.md` Recently-Shipped + tracked-item row; note queue.ts / status-client / /features follow-ups.

## Follow-ups tracked (NOT this arc)

- queue.ts `REDIS_HOST=disabled` lazy-guard (prod hardening).
- status-client.tsx:84 `data?.db === "ok"` object-vs-string bug.
- /features canvas + Math.random waveform + GSAP LCP flakes.
- Integration unique-constraint migration: dedupe → `migrate dev` when Neon reachable (DB-gated arc).
