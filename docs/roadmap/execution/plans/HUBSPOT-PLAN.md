# HUBSPOT-PLAN — Live HubSpot OAuth test

Date: 2026-09-19. Goal: turn `/integrations` HubSpot card from `Setup Required` to live `Connected` + verified sync, without breaking existing 1040-test gate.

Canonical setup guide remains `docs/INTEGRATIONS.md:37-100`. This plan converges explore wave `2026-09-19` (3 agents).

## 1. Current state (verified)

- OAuth start/callback live: `src/app/api/integrations/route.ts:225-244` (auth-url), `:318-363` (exchange), `:579-671` (POST upsert, ADMIN-gated), `:485-546` (GET status).
- Sync live: `src/services/crm/hubspot.ts:25-115` (Contact+Deal+Note), token via `src/lib/integrations/token-refresh.ts:75-106`, storage `prisma/schema.prisma:201-215` (`Integration.config` encrypted JSON).
- UI today (`src/components/integrations-page-client.tsx:340-412`): signed-out → `/sign-in`; unconfigured → disabled Connect + `Credentials not set`; configured → `app.hubspot.com/oauth/authorize` → callback → `Connected`.
- Webhooks live receiver, deferred reconciliation: `src/app/api/webhooks/hubspot/route.ts:59-65`.
- `hubspot.config.yml:1` empty, unused. `HUBSPOT_REDIRECT_URI` in `.env.example:102-104` is doc-only, ignored by code.
- Tests live: `src/test/services/hubspot.test.ts`, `src/test/api/integrations.test.ts`, `src/test/webhook-signature.test.ts`. E2E only auth-gate (`e2e/hubspot-sync.spec.ts:3-6`).

## 2. User inputs blocking live test

1. HubSpot dev account + **Public** app named `Gauge`.
2. `HUBSPOT_CLIENT_ID` + `HUBSPOT_CLIENT_SECRET` → Vercel prod + `.env.local`.
3. Redirect URLs in HubSpot Auth tab (exact, no trailing slash):
   - `https://usegauge.vercel.app/integrations`
   - `http://localhost:3000/integrations`
4. Scopes checked (5, code truth `src/app/api/integrations/route.ts:65-71`): `crm.objects.contacts.read/write`, `crm.objects.deals.read/write`, `crm.objects.notes.write`.
5. `ENCRYPTION_KEY=$(openssl rand -base64 32)` in Vercel prod + `.env.local` (else tokens stored plaintext, `src/lib/integrations/config-crypto.ts:80-86`).
6. `NEXT_PUBLIC_APP_URL=https://usegauge.vercel.app` in Vercel prod.
7. Ensure `DEMO_INTEGRATIONS` **unset** in prod.
8. Clerk test creds `E2E_TEST_USER_EMAIL/PASSWORD` for signed-in smoke.
9. Neon: prod `DATABASE_URL?sslmode=require`, confirm `Integration @@unique([teamId,provider])` migration applied.

## 3. Pre-fix risks (do before live click)

| # | Fix | Files |
|---|---|---|
| R1 | `HUBSPOT_REDIRECT_URI` ignored — implement override like Slack `getSlackRedirectUri():290-294` or delete from `.env.example` + `scripts/check-env.ts:50` | `src/app/api/integrations/route.ts:94-96`, `.env.example:102-104` |
| R2/R3 | Scope drift — docs list 4, code needs 5 (`notes.write`); sandbox omits it too | `src/app/api/integrations/route.ts:65-71`, `docs/INTEGRATIONS.md:66-74`, `src/lib/integrations/dev-sandbox.ts:18-24` |
| R8 | `syncCall` 3 sequential writes, no idempotency, generic errors, empty-email fallback rejected by HubSpot | `src/services/crm/hubspot.ts:34-42,117-127` |
| R6/R7 | Refresh swallows failures, missing `expiresAt` reused forever | `src/lib/integrations/token-refresh.ts:37-46,91,102-105` |
| R9 | BullMQ `crm-sync` worker dead (no Clerk session, ignored accessToken) | `src/services/worker.ts:155-165`, `src/app/api/calls/[id]/sync-crm/route.ts:17-29` |

Defer: webhook reconciliation worker, `trackCrmSync*` wiring (`src/lib/analytics.ts:43-55` zero calls), entitlement gate (`src/lib/plans.ts`), Teams `not_supported` probe.

## 4. Execute wave (DISJOINT file sets)

- **Executor A — config/scope/redirect + docs**: `src/app/api/integrations/route.ts:94-96,65-71`, `src/lib/integrations/dev-sandbox.ts:18-24`, `docs/INTEGRATIONS.md`, `.env.example`, `scripts/check-env.ts`. Verify: `npx vitest run src/test/api/integrations.test.ts`.
- **Executor B — token/sync hardening + tests**: `src/lib/integrations/token-refresh.ts`, `src/services/crm/hubspot.ts`, `src/test/services/hubspot.test.ts`. Add: refresh 401 → `needs_reconnect`, propagate HubSpot error JSON, email validation, missing-expires TTL. Verify: `npx vitest run src/test/services/hubspot.test.ts`.

Orchestrator edits nothing in execute wave.

## 5. Live test procedure (user + orchestrator)

1. `npx tsx scripts/check-env.ts` green locally.
2. `npm run dev` → `/integrations` → HubSpot `Connect` → consent → `Connected + Updated date`.
3. `GET /api/integrations/[id]/test` healthy, `syncedAt` bump.
4. `POST /api/calls/[id]/sync-crm {provider:hubspot}` (ADMIN) → Contact+Deal+Note in HubSpot portal.
5. PostHog `crm_sync_success` (once wired) + Vercel logs clean.

## 6. Gate before push

`npx vitest run && npx next build` green, `npx tsc --noEmit`, `npm run lint`, `git status --short` clean (scoped adds only, never `git add -A`), single-concern commits, sequential pushes, CI green, row in `docs/roadmap/DEVELOPMENT_FRONTIER.md`.

Next: user supplies §2 keys, then trigger Execute wave.
