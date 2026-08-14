# LIGHTHOUSE-CI-TRD — Technical design

Companion to LIGHTHOUSE-CI-PRD.md. All file:line refs verified by the explore wave.

## T1. `.lighthouserc.js` (rewrite)

- **collect**
  - `startServerCommand: "npx next start -p 3200"` (unchanged)
  - `startServerReadyPattern: "Ready"` — matches Next 15.5 `✓ Ready in …` (R3). lhci compiles it as a case-insensitive regex over stdout chunks (`@lhci/utils/src/child-process-helper.js:41-47`).
  - `url`: `/`, `/api-docs`, `/security`, `/privacy`, `/vs/gong` — the five routes that are static, DB-free at request time, timer-free, and renderable with dummy CI keys (R6 exclusion list).
  - `numberOfRuns: 1` (deterministic categories dominate; keeps PR time < ~6 min).
  - `settings`: `preset: "desktop"`, `chromeFlags: "--no-sandbox --headless=new"` (unchanged).
- **assert** — matrix (final numbers = shipped `.lighthouserc.js`, grounded in the 2026-08-14 local proof LHRs; error = job-fail):

  | Assertion | Level | Threshold | Rationale |
  |---|---|---|---|
  | `categories:accessibility` | error | 0.85 | deterministic-ish; local 91-96 (Clerk CDN variance headroom) |
  | `categories:seo` | **warn** | 0.90 | local 92; blocked from hard-gating by the meta-in-body bug (tracked P1) |
  | `categories:best-practices` | error | 0.70 | local 74; failures are Clerk-env artifacts (third-party-cookies, errors-in-console, inspector-issues) — monitor on first CI run |
  | `categories:performance` | error | 0.85 | local 95-100; catches big regressions, tolerant of clerk-js variance |
  | `total-byte-weight` | error | 900,000 B | local max 806,707 B (~11% headroom) |
  | `largest-contentful-paint` | error | 2500 ms | local 745-808 ms; 2500 is the standard "good" desktop threshold (≈3× proof max) |
  | `cumulative-layout-shift` | error | 0.15 | local 0.000-0.113 (the 0.113 is the loading-fallback swap on `/`) |
  | `total-blocking-time` | warn | 200 ms | local 0; clerk-js hydration variance — warn only |
  | `unused-javascript`, `uses-responsive-images`, `offscreen-images`, `unused-css-rules` | warn | lhci default (≥0.9) | unchanged (R4 duplicate removed) |

- **upload**: `target: "temporary-public-storage"` (unchanged; public report URL in job log; needs no token — 474b50c precedent).

## T2. `.github/workflows/lighthouse.yml` (rewrite)

- Add `workflow_dispatch` (verify on main without a PR) + `permissions: contents: read` + `timeout-minutes: 25`.
- Build step env **mirrors the proven-green ci.yml Build job** (R1), plus the repo's Redis-off convention (R2):

  ```yaml
  env:
    REDIS_HOST: disabled
    REDIS_PORT: 0
    NEXT_PUBLIC_APP_URL: ${{ vars.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' }}
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY || 'sk-dummy' }}
    GROQ_API_KEY: ${{ secrets.GROQ_API_KEY || 'gsk_dummy' }}
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_dummy' }}
    CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY || 'sk_test_dummy' }}
    UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_REDIS_REST_URL || 'https://dummy.upstash.io' }}
    UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_REDIS_REST_TOKEN || 'dummy' }}
  ```

- Steps: checkout → setup-node 24 (npm cache) → `npm ci` → `npx prisma generate` (explicit; postinstall covers it but explicit is deterministic per NEXT15-PLAN note) → `npx next build` → `npx lhci autorun`. **No ad-hoc `npm install @lhci/cli`** (R5).

## T3. `package.json` / `package-lock.json`

- Add `"@lhci/cli": "^0.15.1"` to devDependencies (already installed locally via yarnpkg mirror; lockfile `resolved` URLs normalized to registry.npmjs.org so GH runners hit the canonical registry).
- `perf:lighthouse: "lhci autorun"` script already exists — unchanged.

## T4. `.gitignore`

- Add `.lighthouseci/` (lhci filesystem-upload artifact dir; keeps `git add -A` clean — P1 from LEO verdict).

## T5. Docs

- `docs/roadmap/PERF_BUDGETS.md`: add "Lighthouse Score Budgets" section (categories + URLs + thresholds, run command).
- `docs/roadmap/DEVELOPMENT_FRONTIER.md`: mark tracked item "Lighthouse CI workflow (soft-warn)" done + Recently-Shipped row (post-merge); note the queue.ts/status-client follow-ups in Tracked items.
- Plan docs: this PRD/TRD/PLAN trio.

## T6. Explicitly out of scope (recorded for follow-up)

- `src/services/queue.ts` lazy-guard for `REDIS_HOST=disabled` (prod-hardening, own arc).
- `src/components/status-client.tsx:84` `data?.db === "ok"` bug (compares object to string → always "degraded"; UI fix, own arc).
- `/features` flake fixes (canvas RAF, `Math.random()` waveform, GSAP-gated LCP).
- Migration history incident (restored + quarantined per DB-optimizer/LEO verdict; integration migration to be regenerated in a DB-gated arc).
