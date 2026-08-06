# S9 — Share sitemap

Source of truth: `docs/roadmap/execution/TRD.md` S9 (lines 81-84) + PRD R9.1.

## Scope (R9.1)

`/share/[id]` pages included in the sitemap, public share links only.

## Facts (Wave 1 research)

- No `sharedLink` field — share state is `Call.isPublic Boolean @default(false)` (schema.prisma:76). The share page's own gate is exactly `prisma.call.findUnique({ where: { id, isPublic: true } })` (src/app/share/[id]/page.tsx:16,38) → predicate for sitemap: `where: { isPublic: true }`, nothing else.
- The share page does NOT filter `archived` → do NOT add `archived: false` (would omit viewable rows; mirror viewability exactly).
- `src/app/sitemap.ts`: sync, static, hardcoded `SITE_URL = "https://usegauge.com"`, 24 hardcoded routes, `lastModified = now - 7 days` on all, mapped to `{ url, lastModified, changeFrequency, priority }`.
- No `robots.ts` — static `public/robots.txt` already references the sitemap and does not disallow `/share`; no robots change needed.
- No existing sitemap tests. Test mocking style: `vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))` (see src/test/api/share-toggle-auth.test.ts).
- Prisma client import: `@/lib/prisma`.

## Design decisions

1. Make `sitemap.ts` async. Add `export const revalidate = 3600` (ISR: regenerated hourly in prod, cached). 
2. Build-time DB access: with revalidate, Next prerenders the sitemap at build → locally there is NO Neon DB → the `findMany` would throw and fail `next build`. Wrap the DB query in try/catch: on failure, log and return the static routes only (build stays green; prod has the DB).
3. Append share entries: `prisma.call.findMany({ where: { isPublic: true }, select: { id: true, updatedAt: true }, take: 500 })` (take = sanity guard against unbounded sitemap). Each share row: `url: ${SITE_URL}/share/${id}`, `lastModified: updatedAt`, `changeFrequency: "weekly"`, `priority: 0.3`. Keep the 7-day heuristic for static routes.
4. Keep static route list + mapping untouched.

## Work packages

### P1 — `src/app/sitemap.ts`
- Convert to async; add `export const revalidate = 3600`.
- Extract `staticRoutes` array (unchanged content), build static entries, then try/catch DB fetch, append share entries on success, log on failure.

### P2 — `src/test/sitemap.test.ts` (new)
- Mock `@/lib/prisma` with `call.findMany` (vi.hoisted pattern).
- Tests: (a) returns 24 static URLs + N share URLs when findMany returns rows (assert `/share/abc123` present, SITE_URL prefix); (b) share row uses `updatedAt` as lastModified + weekly + 0.3; (c) findMany throws → still returns 24 static entries (no crash); (d) empty findMany → 24 static entries.

## Verification

1. `npx tsc --noEmit` green
2. `npx vitest run` full green (new sitemap tests pass)
3. `REDIS_HOST=disabled REDIS_PORT=0 npx next build > /tmp/build.log 2>&1; echo "exit=$?"` → 0 (proves the try/catch fallback works — no DB locally)
4. Smoke on 3104: `/sitemap.xml` 200 (static routes visible; share rows absent locally is EXPECTED — no Neon)
5. Commit + push main + frontier log

## Out of scope

- robots.txt changes (/share already crawlable)
- Archived calls in sitemap (page renders them → omit)
- Changing `SITE_URL` to env
- Anything in /api, /app, /dashboard
