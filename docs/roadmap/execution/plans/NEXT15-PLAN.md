# NEXT15 — Next.js 15 upgrade arc

## Objective
Next 14.2.3 → 15.x + React 19 + Node 24 + ESLint 9 flat config. Absorbs all
deferred polish: Sentry stays (v10 already Next-15 peer-ready), no-img ×3
(optional), notFound soft-404 bug fixed by the upgrade itself. Single
verification pass, swarm execution (explore → plan → parallel executors → gate).

## Explore-wave facts (2 read-only agents, exact file:line)

### Build breakers (Next 15 async APIs)
- **cookies() — 8 sync sites, all route handlers, all will break:**
  - `src/app/api/integrations/route.ts:95,107`
  - `src/app/api/integrations/slack/connect/route.ts:37`
  - `src/app/api/integrations/slack/callback/route.ts:97`
  - `src/app/api/integrations/google/connect/route.ts:29`
  - `src/app/api/integrations/google/callback/route.ts:100`
  - `src/app/api/integrations/teams/connect/route.ts:24`
  - `src/app/api/integrations/teams/callback/route.ts:126`
  - Fix: `const cookieStore = await cookies();`
- **headers() — 1 site, already awaited** (`src/app/pricing/page.tsx:26`). Safe.
- **draftMode() — 0 sites.**
- **Page params (2):**
  - `src/app/share/[id]/page.tsx:9,12,34` — server page + generateMetadata,
    both destructure `params`. Fix: `Promise<{ id: string }>` + `await params`
    in both functions.
  - `src/app/app/calls/[id]/page.tsx:47` — CLIENT page, `params.id` used at
    62,100,118,146,178,375,392. Fix: type `params: Promise<{id: string}>`,
    `const { id } = React.use(params)` (React 19) — do NOT use useParams (never
    used in repo; React.use preserves existing pattern).
- **Route-handler params — 14 files / 17 handlers, sync pattern:**
  - `src/app/api/user/export/[jobId]/route.ts:9`
  - `src/app/api/history/[id]/route.ts:10,66,111,177`
  - `src/app/api/action-items/[id]/route.ts:16,73`
  - `src/app/api/integrations/[id]/test/route.ts:51`
  - `src/app/api/v1/keys/[id]/route.ts:14`
  - `src/app/api/calls/[id]/share/route.ts:6`
  - `src/app/api/calls/[id]/format-crm/route.ts:10`
  - `src/app/api/calls/[id]/route.ts:12`
  - `src/app/api/calls/[id]/sync-crm/route.ts:12`
  - `src/app/api/team/vocabulary/[id]/route.ts:29,73`
  - Precedent (already Promise-style, copy it): `src/app/api/knowledge/relations/[id]/route.ts:8,16`,
    `src/app/api/calls/[id]/restore/route.ts:12,19`
  - Fix pattern: `{ params }: { params: Promise<{ id: string }> }` +
    `const { id } = await params;`
- **Tests passing sync params (3 files):**
  - `src/test/api/history-title.test.ts:66`
  - `src/test/api/share-toggle-auth.test.ts:18,28,40`
  - `src/test/api/team-vocabulary-route.test.ts:156,178`
  - Fix: `params: Promise.resolve({ id })`
- **useSearchParams without Suspense (Next 15 build error):**
  - `src/app/settings/page.tsx:77` — no Suspense boundary
  - `src/app/app/record/page.tsx:33` — no Suspense boundary
  - `src/components/integrations-page-client.tsx:53` — ALREADY wrapped (:461-467). Safe.

### Deps (React 19 peer audit from node_modules)
- **BLOCKER: `lucide-react ^0.378.0`** — peer react only `^16.5.1||^17||^18`. Must bump
  to a version with `^19` peer (0.4xx+; keep icon names — check tsc after).
- OK as-is: @clerk/nextjs 5.7.6 (next ^15 rc + react >=19 beta), sonner 2.0.7,
  framer-motion 12.39, @gsap/react, shaders, @sentry/nextjs 10.56 (next ^15 rc),
  @vercel/analytics + speed-insights, geist, @testing-library/react 16.3.2.
- Must bump with upgrade: `@types/react ^18`→`^19`, `@types/react-dom ^18`→`^19`,
  `eslint ^8`→`^9`, `eslint-config-next 14.2.3`→`^15`, `@types/node ^20`→`^22`,
  `next 14.2.3`→`^15` (latest 15.x), `react ^18`→`^19`, `react-dom ^18`→`^19`.

### Tooling / infra
- **`next lint` is deprecated in 15 / removed in 16** — `package.json` lint script
  (`:9`) and `ci.yml` Lint job (`:75` `npm run lint`) must become `eslint .` with
  flat config `eslint.config.mjs` (FlatCompat extends next/core-web-vitals).
- **Dual lockfiles**: `package-lock.json` v3 (operative, npm ci) + `pnpm-lock.yaml`
  v9 + `pnpm-workspace.yaml` (drift hazard) → DELETE the pnpm pair, keep npm.
- **next.config.mjs:8** `experimental.serverComponentsExternalPackages` →
  top-level `serverExternalPackages` (Next 15 name). @vercel/blob undici quirk
  comment at :5-6 stays relevant.
- **Node 24**: `engines: "node": "22.x"` → `"24.x"` (package.json), `ci.yml`
  `node-version: 22` → 24 (×3), `lighthouse.yml` → 24. Vercel picks 24 up via
  engines automatically. (Local dev runs Node 25 — npm warns EBADENGINE, benign.)
- **Sentry**: NO instrumentation.ts (confirmed). @sentry/nextjs 10.56 supports
  next ^15; the classic 3-file setup (sentry.client/server/edge.config.ts) remains
  supported → **no Sentry change** this arc. next.config.mjs withSentryConfig stays.
- **Middleware**: `src/middleware.ts` (132 lines, Clerk 5 clerkMiddleware + Upstash
  rate limit + CSP + Sentry capture) — unchanged on Next 15 (proxy.ts is Next 16).
  No action.
- **lighthouse.yml** builds with `npx next build` (no prisma generate) — revalidate
  under Next 15; add `npx prisma generate` if the build fails.
- **React Doctor / vitest / playwright** — no config changes expected.

### Soft-404 workarounds (verified safe to KEEP after upgrade)
- `src/app/share/[id]/page.tsx:23-26` double-notFound workaround + comment — keep
  (still correct on 15: throwing notFound() in generateMetadata sets 404).
- `src/app/not-found.tsx:4-9` noindex metadata — keep (harmless belt-and-braces).

## Wave 0 (orchestrator setup — mechanical, deterministic)
1. package.json: bump `next@^15`, `react@^19`, `react-dom@^19`, `@types/react@^19`,
   `@types/react-dom@^19`, `@types/node@^22`, `eslint@^9`, `eslint-config-next@^15`,
   `lucide-react` (latest with react-19 peer), `engines.node: "24.x"`.
2. `npm install` (updates package-lock.json). Verify `npm ls next react react-dom`.
3. Delete `pnpm-lock.yaml`, `pnpm-workspace.yaml`.

## Wave 1 — parallel executors (disjoint file sets)
### Executor A — async-API migration (all files above in sections 1a/1d/1e/1g)
Owns: 7 integration route files, history/action-items/v1-keys/calls/*/vocabulary/export
route files, share/[id]/page.tsx, app/calls/[id]/page.tsx, 3 test files.
Verify: `npx tsc --noEmit` + `npx vitest run src/test/api` on its files + full suite.

### Executor B — tooling + Suspense (all files in sections Tooling + searchParams)
Owns: `eslint.config.mjs` (new, FlatCompat), `.eslintrc.json` (delete),
`package.json` lint script, `ci.yml` Lint job + node-version 24, `lighthouse.yml`
node 24, `next.config.mjs` serverExternalPackages, `src/app/settings/page.tsx`,
`src/app/app/record/page.tsx` (Suspense wrap).
Verify: `npx eslint .` 0 errors, `npx tsc --noEmit`, `npx vitest run` (targeted).

## Wave 2 — gate (orchestrator)
1. `npx tsc --noEmit`
2. `npx eslint .` — 0 errors (warnings: deferred no-img ×3 acceptable)
3. `npx vitest run` — 832+ passing
4. `REDIS_HOST=disabled REDIS_PORT=0 npx next build` — exit 0; verify soft-404
   fix: share/[id] with a bogus id returns 404 (route smoke via `next start`)
5. Smoke: / /pricing /features /changelog /roadmap /no-bot /sitemap.xml 200;
   share bogus id → 404 (NEW: was 200 on 14.2.3)
6. Commit order (single-concern, sequential push, CI green between):
   `chore(deps)` → `feat(next15)` async API migration → `chore(tooling)` eslint
   flat + node 24 → `docs(roadmap)`. (Fine to batch push after one full green
   local gate; watch cancellation policy.)

## Out of scope
- no-img-element ×3 (still deferred; note in docs)
- Turbopack build (webpack default; evaluate in a later arc)
- Next 16 (proxy.ts, PPR defaults) — not this arc
- packageManager field (npm is de-facto PM via lockfile + CI)

## Back-out plan
`git revert` per single-concern commit; deps revert via `git checkout`
package.json + package-lock.json; no schema/DB changes in this arc.
