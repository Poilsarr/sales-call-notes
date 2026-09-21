# AUTH-REDIRECT-PLAN — Signed-in bounce to /sign-in

Date: 2026-09-21. Bug: signed-in user clicks Integrations → lands on /sign-in "already signed in" → Go to app → retry works.

## Root cause (explore wave, 2 agents)

Two layers destroy intent on cold navigation:

1. **Server** `src/middleware.ts:62-69`: `auth()` returns null on first load (cold `__session`, ITP, key-pair mismatch) → `307 /sign-in` with no return URL. Matcher `128-145` lists only `/integrations/:path*` (no bare path, unlike `/sign-in` + `/sign-in/:path*`), so protection is inconsistent.
2. **Client** `src/components/integrations-page-client.tsx:45-47`: first `authLoaded && !isSignedIn=false` irreversibly `router.replace("/sign-in")`, no return URL, no retry. By `/sign-in` render the session is valid → `AlreadySignedInCard` (`src/app/sign-in/[[...sign-in]]/page.tsx:82-97`) instead of form.
3. Same unguarded pattern in `src/app/team/page.tsx:131-132` and `src/app/team/performance/page.tsx:55-56` (`401 → router.replace`, no `authLoaded` check). `src/components/pricing-client.tsx:217-219` reads `clerkLoaded` but doesn't use it.

## Fix (minimal, intent-preserving)

- Preserve original path: redirect to `/sign-in?redirect_url=<path>` on both layers.
- `/sign-in` honors `redirect_url` for already-signed-in users (auto-continue to it, default `/app`).
- Matcher: add bare paths (`/integrations`, `/dashboard`, `/app`, `/team`, `/settings`, `/billing`) alongside `:path*` forms.
- Team 401 handlers: only redirect when signed-out is confirmed (`authLoaded && !isSignedIn`); transient 401 → toast + retry, not bounce.
- Pricing: gate checkout redirect on `clerkLoaded`.

## Execute wave (DISJOINT file sets)

- **Executor A — server**: `src/middleware.ts` only (matcher bare paths + `redirect_url` preserve). Verify: `npx tsc --noEmit`, existing middleware tests if any, `git diff --stat` shows only that file.
- **Executor B — integrations + sign-in**: `src/components/integrations-page-client.tsx` (return URL + settle-retry) + `src/app/sign-in/[[...sign-in]]/page.tsx` (honor `redirect_url`) + its test `src/components/integrations-page-client.test.tsx`. Verify: `npx vitest run src/components/integrations-page-client.test.tsx`.
- **Executor C — team + pricing**: `src/app/team/page.tsx`, `src/app/team/performance/page.tsx`, `src/components/pricing-client.tsx` (+ their tests). Verify: `npx vitest run` on touched suites.

Orchestrator edits nothing in execute wave.

## Gate before push

`npx vitest run && npx next build` green, `npx tsc --noEmit`, `npm run lint`, `git status --short` clean (scoped adds only), single-concern commit, CI green, row in `docs/roadmap/DEVELOPMENT_FRONTIER.md`. Manual proof: signed-in cold load of `/integrations` stays; signed-out still bounces with return to `/integrations` after login.
