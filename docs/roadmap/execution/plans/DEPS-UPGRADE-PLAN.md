# DEPS-UPGRADE — 26 vulns (19 high) gated upgrade

> `npm audit` 2026-08-21: `26` total = `19 high + 4 moderate + 3 low` (`ARCS-BACKLOG.md:27`). No `audit fix --force` (would install `next@16.3.2` major + `lhci@0.1.0` downgrade). Per-package gated upgrades.

## Verified facts

- `package.json:49` `next@15.5.23`, `react@19.2.8`, `@clerk/backend@1.14.1`, `@clerk/nextjs@6.39.6`, `@vercel/blob@2.6.1`, `@sentry/nextjs@10.56.0`, `@lhci/cli@0.15.1` (dev), `vite@8.0.13` via `@vitejs/plugin-react@6.0.2`, `postcss@8.5.14` + `next/node_modules/postcss@8.4.31`, `undici@7.25.0` + `6.27.0`, `js-cookie@3.0.5/3.0.7`, `brace-expansion@1.1.14/5.0.6`, `nanoid@3.3.12`, `form-data@4.0.5` via `openai@4.104.0`, `esbuild@0.28.0`, `fast-uri@3.1.2` via `@sentry/webpack`.
- `npm audit --json` metadata `prod 311 / dev 732 / total 1165`, `metadata.vulnerabilities` matches `19/4/3/0`.
- `next.config.mjs:7` `serverExternalPackages:['@vercel/blob']` externalizes `undici@6` (not bundled).
- `npm outdated` 35 behind: `@clerk/backend 1.14.1→1.34.0→3.16.10`, `next 15.5.23→16.3.2`, `@prisma/client 5.22.0→7.9.1` (major, not vuln), `openai 4.104.0→7.5.0`.
- `npm audit fix --force` would do `next@16.3.2` (major) + `@lhci/cli@0.1.0` (downgrade `0.15.1→0.1.0`, not a fix). Must not run.

## Per-high table (19 high) — grouped by top-level dep

| Group | Package | Installed | Fix | Breaking | Via |
|---|---|---|---|---|---|
| A dev | `vite@8.0.13` | `8.0.16+` | No | `@vitejs/plugin-react` | patch |
| A dev | `brace-expansion@1.1.14/5.0.6` | `1.1.18/5.0.9` | No | `eslint`, `@sentry/bundler-plugin-core` | patch |
| A dev | `nanoid@3.3.12` | `3.3.18+` | No | `postcss` | patch |
| A dev | `fast-uri@3.1.2` | `3.1.5+` | No | `@sentry/nextjs→ajv` | patch |
| A dev | `esbuild@0.28.0` | `0.28.2` | No | `vite` | patch |
| B prod | `undici@6.27.0/7.25.0` | `6.28.0/7.29.0` | No | `@vercel/blob`, `jsdom` | patch via `@vercel/blob@2.8.0` |
| B prod | `form-data@4.0.5` | `4.0.6` | No | `openai@4.104.0` prod | patch |
| B prod | `js-cookie@3.0.5` | `3.0.8` | No | `@clerk/shared` | patch |
| C clerk | `@clerk/backend@1.14.1` | `1.34.0` (patch-line) → later `3.16.10` | Patch-line No, major Yes | direct | gated |
| C clerk | `@clerk/shared@2.9.2/3.47.8` | `>3.47.5/>4.13.1` | Transitive | clerk | via js-cookie first |
| D next | `postcss@8.5.14` | `8.5.26` | No if overrides, Yes via next@16 | `next`, `tailwindcss` | overrides first |
| D next | `next@15.5.23` + `sharp@0.34.5` | `16.3.2` + `0.35.3` | **Yes major** | direct | isolated PR |
| E lhci | `tmp@0.1.0`, `@lhci/cli@0.15.1`, `lighthouse@12.6.1`, `puppeteer-core`, `@puppeteer/browsers`, `extract-zip@2.0.1` | `tmp@0.2.7` etc but fix is `0.1.0` downgrade **anomaly** | Yes | `lhci` | remove lhci |

## Plan — 4 sequential waves (share package.json + lockfile, so not parallel)

> Each wave: `npm install <pkg>@<fix> --save(-dev)` or `overrides` → `npx vitest run` + `npx tsc --noEmit` + `REDIS_HOST=disabled REDIS_PORT=0 npx next build` + `npm audit --json` re-check. One concern per commit.

### Wave 1 — dev-only non-breaking (LOW risk) — `deps(wave1): vite, brace-expansion, nanoid, fast-uri, esbuild`

Files: `package.json`, `package-lock.json` + `src/test` none (just bumps). Executors can be parallel on verification but install must be sequential.

- `vite@8.0.13→8.0.16`, `esbuild@0.28.0→0.28.2`, `nanoid@3.3.12→3.3.18` (via `overrides` if postcss not bumped), `fast-uri@3.1.2→3.1.5` (bump `@sentry/nextjs@10.56.0→10.70.0` which also fixes `@opentelemetry/core@2.7.1→2.8.0`), `brace-expansion` via `eslint@9.39.5` refresh or `overrides: {"brace-expansion":"1.1.18"}`.
- Gate: `vitest` + `next build` (eslint + sentry bundler).

### Wave 2 — prod patches (MED) — `deps(wave2): undici, form-data, js-cookie`

- `undici` via `@vercel/blob@2.6.1→2.8.0` (bundles `6.28.0`) + `jsdom` update if needed for `7.29.0`.
- `form-data@4.0.5→4.0.6` via `openai@4.104.0` patch (or `overrides: {"form-data":"4.0.6"}` if openai not bumped).
- `js-cookie@3.0.5→3.0.8` via `overrides: {"js-cookie":"3.0.8"}` before clerk bump.
- Gate: `vitest` including `src/test/api/blob-url-guard.test.ts` + `openai` route tests + `next build`.

### Wave 3 — Clerk chain (MED-HIGH) — `deps(wave3): @clerk/backend 1.34.0`

- After js-cookie fixed, `npm install @clerk/backend@1.34.0` (patch-line, not `3.x`). Verify `npm ls @clerk/shared` now `>3.47.5`.
- Optional: `@clerk/nextjs@6.39.6→6.41.0` if within same line and `npm outdated` shows.
- Gate: `vitest` + `middleware-auth-async` + `middleware-csp-clerk-captcha` + manual `/sign-in` switch test.

### Wave 4 — LHCI removal (HIGH, do not --force) — `chore(lhci): remove or override`

- Do **not** `npm audit fix --force` (would downgrade `@lhci/cli@0.15.1→0.1.0`). Instead `npm remove @lhci/cli` (scripts `perf:lighthouse`/`perf:audit` will break — update `package.json` scripts to `echo "lighthouse removed, see docs"`) **or** `overrides: {"tmp":"0.2.7","uuid":"11.1.1","extract-zip":"2.0.1"}` to keep lhci but fix vulns. Prefer remove (LHCI abandoned, lighthouse 12→13 needs major).
- Gate: `vitest` + `next build` (LHCI not in build), `npm audit` should drop 9 high.

### Wave 5 — Next major (HIGH, separate arc, not this plan)

- `next@15.5.23→16.3.2` + `eslint-config-next@15.5.23→16.3.2` + `postcss@8.5.14→8.5.26` + `sharp@0.34.5→0.35.3` together. Isolated PR, admin-merge risk per `CLAUDE.md:4`. Not in this plan — backlog for after Wave 1-4.
- Interim: `overrides: {"postcss":"8.5.26"}` to fix GHSA without Next major.

## Gate (per wave)

- `npx vitest run` (1133→) + `npx tsc --noEmit` + `REDIS_HOST=disabled REDIS_PORT=0 npx next build` + `npm audit --json` count must drop.
- Final gate after Wave 4: `npm audit` should be `≤7 high` (Next + postcss + sharp remaining, pending Wave 5).

## Out of scope (debt)

- `Next 16` major, `@prisma/client 7`, `openai 7`, `zod 4` — not vuln, not in audit.
- `bullmq 6`, `ioredis 6` majors — not vuln.

## Plan status — SHIPPED 2026-08-23 (audit 0)

- Last verified checkpoint: 23736ee (2026-08-23, audit 0, CI #555 2m15s)
- Executed: Wave1 f9a925f (26→18), Wave2 c23e593 (18→13), Wave3 4f566dc (13→13), Wave4 0bfe585 (13→3), Wave5 23736ee (postcss 8.5.26 + sharp 0.35.0 via overrides, 3→0, next retained; debug oracles 404 in prod, .env 600)
- Gate: `npm audit` 0, `npx vitest run` 136/1139, `npx tsc --noEmit` clean, `REDIS_HOST=disabled REDIS_PORT=0 npx next build` green — shared 105kB, `next@15.5.23` retained, no `next@16` major
- Guardian verdicts: CLEAR
- Open drift items: none

