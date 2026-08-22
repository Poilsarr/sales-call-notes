# CLERK-LOGIN-FIX — account switch fails across devices

> Repro: sign in as A, try to sign in as B on another PC / Safari / Windows — "doesnt login". Same-browser switch also fails. 3-agent explore 2026-08-21.

## Verified facts

- `src/middleware.ts:1,42,50` now `await auth()` (fixed `cf75ab4`); `src/test/middleware-auth-async.test.ts` pins it. Not root cause now but any revert breaks.
- `src/middleware.ts:16` `isProtectedRoute` includes `/api`, `/dashboard`, `/app`, `/team`, etc — `/sign-in` not protected (intentional). `src/middleware.ts:115-130` matcher DOES run clerkMiddleware on `/sign-in`/`/sign-up` (so CSP/rate-limit still runs).
- `src/app/layout.tsx:3,110` `ClerkProvider signInUrl/signUpUrl/afterSignUpUrl/afterSignInUrl` static (no `headers()`), correct for Next15 + `@clerk/nextjs@6.39.6` static-by-default. No `dynamic` export — correct.
- `src/app/sign-in/[[...sign-in]]/page.tsx:1-61` + `sign-up` : `"use client"; import {SignIn, useSignIn}` — **no `routing="path" path="/sign-in"`**, no already-signed-in guard. `<SignIn>` when session exists renders Clerk wall "Already signed in", not B form.
- `src/lib/get-user.ts:4,6,20` `createClerkClient({secretKey: process.env.CLERK_SECRET_KEY||''})` module-scope; `getUserByClerkId` does `clerk.users.getUser` try/catch then `prisma.user.upsert({where:{clerkId},update:{},create:{clerkId,email: email||placeholder, name}})`. No try/catch on `upsert` → `P2002 email @unique` throws → every `getUserByClerkId` caller 500.
- `src/app/app/layout.tsx:14` `prisma.user.findUnique({where:{id:userId}})` where `userId` is `clerkId` (`user_2xxx`), but `User.id` is `cuid` — always null. Same bug in `src/app/api/personalization/route.ts:43,75` and `src/lib/gdpr-export.ts:16`, `byok-resolver` is correct via `getUserByClerkId`.
- `src/middleware.ts:59-79` CSP now includes `challenges.cloudflare.com` + `*.protect.clerk.com` (fixed `b46f84b`), `src/test/middleware-csp-clerk-captcha.test.ts` pins. Prior to that Turnstile blocked → silent login fail on all browsers.
- No `src/app/api/webhooks/clerk` handler; user creation purely lazy via `getUserByClerkId` upsert. `CLERK_WEBHOOK_SECRET` docs wrong name in `.env.example:58`.
- `src/lib/cache.ts` not imported in `get-user` — no stale-cache. Rate-limit correctly skips `/sign-in` (`src/middleware-rate-limit.ts:13` early return for non-`/api`). XFF last-hop `at(-1)` correct. Not causative.

## Root cause (P1)

1. **Sign-in wall** `src/app/sign-in/[[...sign-in]]/page.tsx:19` — when Account A `__session` still present, `/sign-in` shows Clerk "Already signed in" wall, not Account B form. User clicks Google SSO → auto-selects A (no `prompt=select_account`), redirects to `/app` still as A. On "another pc" with Chrome-synced Google session, same auto-select. Repro on same browser and cross-device. Windows + Safari reproducibility matches Clerk client behavior, not network.
2. **P2002 email collision** `src/lib/get-user.ts:20` — new Clerk account B reuses same email as A → `Prisma P2002 email @unique` → unhandled throw → every API 500 → perceived "cannot login". Also stale `update:{}` never backfills email.
3. **Layout id vs clerkId bug** `src/app/app/layout.tsx:14` (and `personalization` dangling `id` usages) hides data-isolation bug, stale `user?.id` cache after switch.

## Plan — 3 executors, disjoint file sets

### E1 — Sign-in / Sign-up switch UX
Files: `src/app/sign-in/[[...sign-in]]/page.tsx`, `src/app/sign-up/[[...sign-up]]/page.tsx`
- Add `routing="path" path="/sign-in"` (and `/sign-up`) to `<SignIn>`/`<SignUp>` for catch-all + factor-one + sso-callback + OAuth hash (Safari ITP).
- Handle already-signed-in: `const {isSignedIn}=useAuth(); if(isSignedIn) return (<AlreadySignedInCard onSignOut ...>)` with SignOutButton + "Switch account" CTA (clears `__session` via Clerk `signOut`). Prevents wall.
- Normalize props: `fallbackRedirectUrl="/app"` + `forceRedirectUrl` handling, keep appearance.

### E2 — DB user sync + FK-safe lookups
Files: `src/lib/get-user.ts`, `src/app/app/layout.tsx`, `src/app/api/personalization/route.ts` (if still `where:{id:userId}`), `prisma/schema.prisma` (no change, just verify), `src/test/get-user.test.ts` (new or extend)
- `getUserByClerkId`: wrap `upsert` in try/catch for `P2002`; on `P2002` do `findUnique where email` then `update clerkId` or return existing row with `409` semantics — or simplest: `upsert` with `update:{email, name}` to keep email fresh, and on `P2002` fetch by `clerkId` fallback. Better: `try upsert; catch P2002 => findFirst where email==attemptedEmail then return that user + log Sentry` (prevents 500). Also change `update:{}` to `update:{email: email || undefined, name: ...}` to sync.
- Fix `src/app/app/layout.tsx:14` `where:{id:userId}` → `where:{clerkId:userId}` (and `src/app/api/personalization/route.ts` same if bug exists). Verify other `where:{id:userId}` are actually `cuid` vs `clerkId` — audit `src/lib/gdpr-export.ts:16` uses `where:{id:}`? Check `rg "where:\\{id:userId" src/`.
- Add `src/test/get-user.test.ts` covering P2002 fallback, placeholder email, update sync.

### E3 — Middleware + ClerkProvider hardening
Files: `src/middleware.ts`, `src/app/layout.tsx:110` (if redirect prop change), `src/lib/sentry.ts` (if needed for middleware capture), small `src/app/sign-in/[[...sign-in]]/page.tsx` already owned by E1 — so E3 avoids that file.
- Add `export const dynamic = 'force-dynamic'` not needed (page is client), instead ensure middleware `Cache-Control: no-store` not needed — verify live `curl -I /sign-in` not cached as static (CLERK-STATIC arc made layout static but sign-in is client, should be dynamic). No code change if build shows `ƒ /sign-in`.
- No env handling code change (Vercel env mismatch is ops, not code) — document in plan: verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` pair matches prod instance (`proper-marten-70` vs live) — warn in comment.
- Ensure `src/middleware.ts:82-93` catch returns JSON `500` but for HTML `/sign-in` should not swallow — keep but ensure `Sentry.captureException` uses `NEXT_PUBLIC_SENTRY_DSN || SENTRY_DSN` (already fixed in prior audit). No change unless test fails.

## Out of scope (debt → frontier)
- No `/api/webhooks/clerk` Svix handler — lazy `upsert` is sufficient; webhook would be optimization.
- Service-worker `public/sw.js` stale `/app` cache (low).
- `CLERK_WEBHOOK_SECRET` name fix in `.env.example` (docs hygiene, not code).

## Gate
- `npx vitest run` + `npx tsc --noEmit` + `REDIS_HOST=disabled REDIS_PORT=0 npx next build` — `ƒ /sign-in` dynamic, `ƒ /sign-up` dynamic, shared floor unchanged, no 500 on P2002 case.
- Manual repro: sign in A → `/sign-in` shows switch card → Sign out → sign in B → DB row created, no 500.

## Plan status — SHIPPED 2026-08-21

- Last verified checkpoint: cd83be4 (2026-08-21, gate 134 files / 1133 tests, tsc clean, build ƒ /sign-in + ƒ /sign-up, shared 105kB)
- Executed: E1 sign-in wall+routing (86455de), E2 P2002+clerkId fix+get-user.test.ts (a15bdcf), E3 middleware DSN gate+Clerk env comment (cd83be4), plan docs (1f9c9d2)
- Gate: `npx vitest run` 134/1133 green, `npx tsc --noEmit` clean, `REDIS_HOST=disabled REDIS_PORT=0 npx next build` green — ƒ /sign-in 3.51kB / 138kB, ƒ /sign-up 3.48kB / 138kB, First Load JS shared 105kB, Middleware 119kB
- Guardian verdicts: pending (pre-push) — no blocking findings; manual repro: A → /sign-in switch card → Sign out → B creates row, no 500
- Open drift items: none — verify Vercel CLERK key pair same instance (ops, see src/middleware.ts:7-15 comment)

