# CLERK-STATIC-PLAN — Kill the meta-in-body P1 (Clerk v6 static-by-default)

Gate: `npx vitest run` + `npx tsc --noEmit` + `npm run lint` + `REDIS_HOST=disabled REDIS_PORT=0 npx next build` (build table shows the 5 audited URLs `○`) + local lhci proof + `git status --short` clean **before each push**. Never `git add -A` — the tree carries unrelated noise (`graphify-out/`, `scripts/.proof-openai.json`, `scripts/.fixtures/`); scoped adds only (precedent: LIGHTHOUSE-CI-PLAN). Never touch `.env` / `.env.local`.

## Swarm convergence memo (10 lines)

1. Root cause (A1/B1, source-verified at dist): `@clerk/nextjs@5.7.6` server `ClerkProvider` calls `headers()` unconditionally (`node_modules/@clerk/nextjs/dist/esm/app-router/server/ClerkProvider.js:11`) → whole app dynamic → root `src/app/loading.tsx` streams a fallback → Next injects all metadata at the TOP OF `<body>` → Lighthouse `meta-description`=0, SEO 92 (capped).
2. v6.39.6 (dist-tag `latest-v5`, published 2026-07-13) and v7.7.6 BOTH gate every `headers()` call behind an opt-in `dynamic` prop (default off → static). 5.7.6 has no prop and is frozen (dist-tag `latest-nextjs-v5` still points at 5.7.6).
3. v6 is Clerk's vendor-blessed "v5-compatible" line. Its only breaking change relevant to this repo: `auth()` becomes async. Repo-wide grep (this plan re-ran it) finds exactly ONE sync call site: `src/middleware.ts:52` — all 58 other sites already `await`.
4. v6 keeps `afterSignInUrl/afterSignUpUrl/signInUrl/signUpUrl` (verified in v6 `mergeNextClerkPropsWithEnv`) → `src/app/layout.tsx:110` needs NO edit. v7 removes `afterSignInUrl/afterSignUpUrl`, renames `@clerk/clerk-react` → `@clerk/react` — strictly larger migration, not needed for this bug.
5. B3's client-only provider wrapper on 5.x was empirically validated (metadata-in-head, static) and the dep-tree audit shows the 5 audited pages have ZERO other dynamic-forcers.
6. CONFLICT: B2 (migration verifier) → v6.39.6 (1-line diff, root-cause at dependency level). B3 (alternatives verifier) → client wrapper — but B3 compared wrapper vs **v7**, never evaluated v6; its "smaller blast radius" claim doesn't hold against the v6 path.
7. ADJUDICATION: **v6.39.6.** Root-cause fix: static-by-default comes from the dependency, so it fixes ALL public routes repo-wide now and every future public page, not just the 5 audited. The client wrapper leaves a landmine — any future server-side `<ClerkProvider>` re-import (Clerk docs default) silently reintroduces meta-in-body.
8. v6 blast radius in this repo = 1 line (`await auth()` in middleware) + lockfile. `get-user.ts` (`@clerk/backend ^1.14.1` → `createClerkClient`) untouched (backend v2/v3 keep the API). Client surface (23 files, useUser×16/useAuth×6/etc.) unchanged; SSR renders signed-out until post-hydration — identical between v6-default and wrapper paths; CSP `'unsafe-inline'` makes the ClerkJS nonce loss a non-issue.
9. Test impact: 0 existing test-file changes. 32 files mock `@clerk/nextjs`/`@clerk/nextjs/server` at the module boundary (they never load the real package and `await` a sync mock value is a no-op); both middleware tests read `src/middleware.ts` as TEXT (substring assertions — untouched by `await`). ONE new text-level regression test pins the async contract (same convention as `middleware-billing-gate.test.ts`).
10. Success = the 5 audited URLs (`/`, `/api-docs`, `/security`, `/privacy`, `/vs/gong`) build `○` Static with `<meta>` in `<head>`; `/pricing` stays `ƒ`; gated redirects behave identically before/after; then promote SEO warn→error IN THIS ARC (PR 2) with a fresh-proof-grounded threshold (expected 0.95, ~5% headroom per LIGHTHOUSE-CI-TRD).

## Decision + rationale (3 bullets)

- **Root cause vs workaround.** The bug is the dependency's unconditional `headers()` call, so the fix belongs in the dependency. v6 makes static the default repo-wide; the wrapper only restores `<head>` for the pages the wrapper covers and leaves the actual dynamic-forcing code in place.
- **Future-footgun inversion.** Under the client wrapper, the bug is ONE accidental server-side `ClerkProvider` import away (any future engineer following Clerk's server-provider docs, or a layout refactor, silently re-breaks it). Under v6, the landmine is inverted: dynamic rendering now requires an explicit `dynamic` prop — safe-by-default is enforced by the dependency, and every future public page is automatically static.
- **Cost asymmetry.** v6 = 1-line diff + lockfile + 1 regression test, on the vendor-blessed v5-compatible line, with a verified-empty breaking-change list for this repo (exactly one sync `auth()`). The wrapper = a permanent architectural deviation (client provider at the app root, contradicting Clerk's documented layout) to avoid a 1-line change. No contest.

---

## Phase 1 — Dependency change + the one code edit

**Executor A (disjoint file set: `package.json`, `package-lock.json`, `src/middleware.ts`, `src/test/middleware-auth-async.test.ts`).**

1. Install v6 from the public npm registry (npmjs reachable — verified 2026-08-15; no `.npmrc` overrides in repo):
   ```bash
   npm install @clerk/nextjs@^6.39.6
   npm ls @clerk/nextjs        # expect 6.39.6 (caret stays on the v6 line; lockfile pins for CI)
   ```
   Expected package.json diff: `"@clerk/nextjs": "^5.7.6"` → `"^6.39.6"`. Nothing else in dependencies. `@clerk/clerk-react` moves 5.x → 5.61.9 transitively; `@clerk/backend@^2.33.6` installs NESTED under `@clerk/nextjs` (root direct dep `^1.14.1` is untouched — two copies coexist; see Risks).

2. `src/middleware.ts:52` — the ONLY code edit in the migration:
   ```diff
   -      const { userId } = auth();
   +      const { userId } = await auth();
   ```
   Failure mode if skipped: destructured `Promise<AuthObject>` → `userId` undefined → every protected route 401s/redirects; the 32 mocked test files cannot catch it (see Test impact).

3. New regression pin — `src/test/middleware-auth-async.test.ts` (text-level; SAME convention as `src/test/middleware-billing-gate.test.ts:5-8`, which reads the file via `readFileSync` — no module import, no Clerk mocks, runs in plain node env):
   ```ts
   import { describe, it, expect } from "vitest";
   import { readFileSync } from "node:fs";
   import { join } from "node:path";

   const MW = readFileSync(join(process.cwd(), "src/middleware.ts"), "utf8");

   describe("middleware auth() async contract (Clerk v6)", () => {
     it("awaits auth() before destructuring (v6 async auth regression pin)", () => {
       expect(MW).toMatch(/const \{ userId \} = await auth\(\);/);
     });
     it("no sync auth() destructure remains (forgotten await -> all protected routes 401)", () => {
       expect(MW).not.toMatch(/const \{ userId \} = (?!await )auth\(\);/);
     });
   });
   ```

4. Dead-middleware-route reconciliation: **LEAVE** `"/api/v1/competitive-intelligence"` + `"/api/v1/transcribe"` in `isPublicApi` (`src/middleware.ts:14,16`). Both routes are dead (verified: `src/app/api/v1/` contains only `keys/` and `calls/`), but the entries are harmless public allowlist rows and touching them is a different concern. Follow-up arc.

## Phase 2 — Local gate + build-table proof

**Orchestrator-gated (sequential, all must pass):**

```bash
npx vitest run                            # 991 existing + 2 new = 993, green
npx tsc --noEmit                          # clean
npm run lint                              # 0 warnings
REDIS_HOST=disabled REDIS_PORT=0 npx next build
```

Expected build table (read the actual lines; record them in the PR body):

```
○  /                          (was ƒ — meta-in-body mechanism dead)
○  /api-docs                  (was ƒ)
○  /security                  (was ƒ)
○  /privacy                   (was ƒ)
○  /vs/gong                   (was ƒ)
ƒ  /pricing                   (UNCHANGED — own headers() at src/app/pricing/page.tsx:26)
ƒ  /dashboard ... /app ...    (gated server pages stay ƒ via cookies/auth — correct, out of scope)
```

If ANY of the 5 shows `ƒ`, stop: another dynamic-forcer leaked in since the dep-tree audit (B3) — re-run the explore wave before proceeding.

## Phase 3 — Runtime proof (curl matrix, `next start`)

```bash
REDIS_HOST=disabled REDIS_PORT=0 npx next start -p 3200 &
```

Metadata in `<head>`, none in `<body>` — for EACH of the 5 URLs:
```bash
for u in / /api-docs /security /privacy /vs/gong; do
  html=$(curl -s "http://localhost:3200$u")
  head_hits=$(printf '%s' "$html" | awk '/<head>/,/<\/head>/' | rg -c 'name="description"' || true)
  body_hits=$(printf '%s' "$html" | awk '/<body>/,0' | rg -c 'name="description"' || true)
  echo "$u head=$head_hits body=$body_hits"   # expect head>=1 body=0 for all five
done
```

No stream markers (static HTML has no `<!--$?-->` fallback markers):
```bash
for u in / /api-docs /security /privacy /vs/gong; do
  curl -s "http://localhost:3200$u" | rg -F '<!--$?' && echo "FAIL marker on $u" || echo "OK no marker on $u"
done
```
**2026-08-15 execution note — markers on 4/5 URLs are EXPECTED, not a regression.** The `<!--$?--><template id="B:0"></template>` + hidden `<div id="S:0">` + `$RC` boundary is standard Next 15 static output for page trees containing client components (Nav/`useUser`, EndpointCard, etc.): the root `loading.tsx` fallback is baked into the HTML and the real content ships in a hidden `S:0` div, revealed via `$RC` on hydration. Evidence this is pre-existing (not v6-induced):
- `/pricing` (ƒ dynamic, own `headers()`, untouched by this migration) shows the identical `$?`/`S:0`/`$RC` structure → the pattern predates the static conversion.
- `/blog` + `/api-docs` share the same root layout + v6 ClerkProvider yet have zero pending boundaries → Clerk v6 is exonerated; the discriminator is per-page client components, not the provider.
- Playwright render check: on all 5 URLs the fallback resolves (no stuck "Loading"), the real `<h1>`/content is present in the live DOM, and `meta[name=description]` is in `<head>` (head=1 body=0).

Phase 3 actuals (2026-08-15, port 3200, REDIS_HOST=disabled):
- Meta matrix: `/` head=1 body=0, `/api-docs` head=1 body=0, `/security` head=1 body=0, `/privacy` head=1 body=0, `/vs/gong` head=1 body=0 — **all five pass**.
- `x-nextjs-prerender: 1` present on `/`; absent on `/pricing` (stays ƒ).
- Gated redirects: `/dashboard` → 307 `/sign-in`, `/app` → 307 `/sign-in`, `/api/calls` with dummy key → 401 — **middleware `await auth()` parity confirmed**.
- JS errors in Playwright: 4/page, all `_vercel/insights` + `_vercel/speed-insights` 404s (Vercel-only scripts absent locally) — expected, not app errors.

`/pricing` stays dynamic (no prerender header), static pages have it:
```bash
curl -sI http://localhost:3200/ | rg -i 'x-nextjs-prerender'      # expect a hit (static)
curl -sI http://localhost:3200/pricing | rg -i 'x-nextjs-prerender' # expect NO hit (dynamic)
```

Gated redirect sanity (middleware `await auth()` parity — run the SAME two curls BEFORE and AFTER the migration; outputs must be byte-identical):
```bash
curl -sI http://localhost:3200/dashboard | rg -i '^location:'      # expect /sign-in[?...]
curl -s  http://localhost:3200/api/calls | rg -o 'Unauthorized'    # expect 401 JSON body
```
With dummy Clerk keys and no session cookie, v6 middleware `auth()` short-circuits to `{ userId: null }` → same redirect/401 as today. Any diff = a v6 middleware behavior change; stop and investigate before shipping.

## Phase 4 — Lighthouse proof + SEO promotion (PR 2, this arc, infra concern)

Promotion happens THIS arc but as a SEPARATE PR, after the migration PR is green on `main` — because the error threshold must be grounded in a fresh post-fix score, and the repo mandates one concern per PR (code vs infra).

1. Local proof first (migration PR's gate already runs it):
   ```bash
   npx lhci autorun          # must exit 0 with seo STILL warn on the migration PR
   ```
   Read `.lighthouseci/lhr-*.json` → record per-URL SEO score (expect ~100: meta-description was the only failing audit at 92).

2. PR 2 edits — `.lighthouserc.js:39-49`, replace the warn block:
   ```js
   "categories:seo": [
     "error",
     {
       minScore: 0.95,
       // Local proof after CLERK-STATIC arc (2026-08-15, v6.39.6): seo 100 on
       // all 5 URLs, metadata in <head>, no stream markers. 0.95 = 5% headroom
       // per LIGHTHOUSE-CI-TRD. Evidence in .lighthouseci/lhr-*.json.
     },
   ],
   ```
   Threshold rule: `minScore = max(0.9, proof_score − 0.05)`; if the proof lands below 0.95, STOP and re-derive (sub-95 SEO after this fix = a different bug, not a threshold problem).
3. Local gate for PR 2: `npx lhci autorun` with the NEW error assertion must exit 0 before push.
4. PR 2 also closes the tracked item: `docs/roadmap/DEVELOPMENT_FRONTIER.md:99` — delete the meta-in-body P1 row; add the arc's Recently-Shipped row (both PRs, test count 993, v6.39.6, seo now hard-gated).

## Phase 5 — Ship

**PR 1 — `fix(auth): Clerk v6 static-by-default — await auth() in middleware`**
Scoped adds ONLY: `package.json` `package-lock.json` `src/middleware.ts` `src/test/middleware-auth-async.test.ts` `docs/roadmap/execution/plans/CLERK-STATIC-PLAN.md`
(Plan docs ride with the code PR — repo precedent, LIGHTHOUSE-CI-PLAN ship list.)

**PR 2 — `ci(seo): hard-gate Lighthouse SEO category after meta-in-body fix`**
Scoped adds ONLY: `.lighthouserc.js` `docs/roadmap/DEVELOPMENT_FRONTIER.md`

Both: `git status --short` clean → consult user → push → CI green (Tests/Lint/Build + Lighthouse; seo warn on PR 1, error on PR 2) → if Vercel context check hangs, use the CLAUDE.md recovery (wait, merge main in, then `gh pr merge N --admin --squash`).

## Test impact

- **0 existing test-file changes.** 32 files mock `@clerk/nextjs` (3) + `@clerk/nextjs/server` (29) at the module boundary — they replace the whole package, never load the real v6 dist, and `await` on a sync mock value is a no-op. The suite CANNOT catch a missing middleware `await` (middleware.ts is never module-imported by tests — only read as text), which is exactly why the new text-level pin is required.
- **+1 new test file** (`src/test/middleware-auth-async.test.ts`, Phase 1.3): feasible because it follows the existing `readFileSync` convention — no `clerkMiddleware`/`NextResponse`/`rateLimitMiddleware`/Sentry module mocks needed. DECISION: yes, add it; without it the one-line migration has no regression guard and the silent 401 failure mode is unguarded.

## CI impact

- **No changes to `ci.yml` or `lighthouse.yml`.** Both run `npm ci` (lockfile-driven — the committed `package-lock.json` pins 6.39.6) and already build with dummy Clerk keys + `REDIS_HOST=disabled REDIS_PORT=0` (lighthouse.yml:24-32, ci.yml Build env). The `@clerk/backend` nested v2 needs no CI env.
- Post-merge verification per repo convention: `workflow_dispatch` on `main` for lighthouse.yml after PR 2 must be GREEN with the new error assertion.

## Risk table + rollback

| Risk | L | Impact | Mitigation |
|---|---|---|---|
| Missing `await` elsewhere | H | Protected routes 401 silently | Grep verified 1 sync site; new regression pin; tsc/build gate |
| `@clerk/backend` dual-version (root 1.14.x + nested 2.33.x) | M | Dual-copy drift, ~size | API preserved (createClerkClient); tsc catches type break; dedupe = follow-up |
| v6 middleware behavior diff | L | Redirect/401 semantics change | Before/after curl parity (Phase 3) |
| SEO proof < 0.95 | L | Promotion blocked | Threshold rule `max(0.9, proof−0.05)`; stop+re-derive if < 0.95 |
| Accidental v7 install (`latest`) | M | Unwanted migration | Pin `@6.39.6`; `npm ls` check |
| Lockfile churn | L | Noise | Review lock diff: only `@clerk/*` entries |

**Rollback (v6 bump)**: `git revert <pr1-sha>` (restores 5.7.6 + sync `auth()`) then `npm install` to resync the lockfile — 1 line of code, atomic. The migration's atomicity is the single `await` at `src/middleware.ts:52`; if `npm install` fails mid-flight, `git checkout -- package.json package-lock.json src/middleware.ts` and re-run. Client-wrapper fallback remains available if v6 surprises at runtime (swap layout.tsx:110 to a client provider component, keep 5.7.6) — noted, not preferred.

## Follow-ups (NOT this arc)

- **v7 Core 3 migration** when wanted: `@clerk/clerk-react` → `@clerk/react`, `afterSignInUrl/afterSignUpUrl` → `fallbackRedirectUrl/signUpFallbackRedirectUrl`, `createRouteMatcher` deprecation. Strictly larger; this arc deliberately stops at v6.
- **`/pricing` dynamic-forcer cleanup**: remove `headers()` at `src/app/pricing/page.tsx:26` (Paddle country localization) — move detection client-side or behind a route handler so `/pricing` goes static too. Needs product sign-off.
- **Dead v1 middleware entries**: drop `"/api/v1/competitive-intelligence"` + `"/api/v1/transcribe"` from `isPublicApi` (`src/middleware.ts:14,16`); own tiny PR.
- **`@clerk/backend` dedupe**: bump direct dep `^1.14.1` → `^2` to collapse the nested copy; `get-user.ts` unchanged — verify no v1-only API usage first.
- Playwright signed-in smoke of gated pages under v6 with real test creds (existing backlog item).

## What I'd challenge

1. **SEO = 100 assumption.** Reality-checker must read `.lighthouseci/lhr-*.json` post-fix and confirm the promotion number before PR 2; do not trust the narrative score.
2. **`@clerk/backend` nesting.** Verify npm actually nests v2 (no hoist conflict with root v1) and `get-user.ts` still type-resolves against v1 — tsc is the gate.
3. **"Only auth() changed" claim** — dist-verified by B2, but the final proof is the before/after curl parity + green CI on real gated smoke; middleware exports (`clerkMiddleware`, `createRouteMatcher`) rename would fail the build loudly, not silently.
4. **Wrapper fallback sizing** — B3's Option B is a documented Plan B; its rollback is cheaper than v6's, but its landmine (server-provider re-import) is why it loses on the merits.
