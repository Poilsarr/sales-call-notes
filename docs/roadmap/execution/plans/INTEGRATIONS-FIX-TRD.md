# INTEGRATIONS-FIX — TRD (System Design + Security Review)

Author: Software Architect. Ground truth verified against source at session time.

## As-is architecture

```
Browser (Clerk-gated): /integrations · /settings?tab=*
   │  fetch/JSON                          │ 302 with ?code&state
   ▼                                     ▼
Next.js 15.5 (middleware: Clerk, rate-limit, CSP)
  OAuth hub route.ts (auth-url L454, POST exchange L504, DELETE L593, GET statuses L475)
  Direct flows: google/slack/teams connect+callback
  /api/calendar (events only, never authUrl) · /api/calls/[id]/sync-crm · /api/webhooks*
  lib/integrations (token-refresh, dev-sandbox) · services/crm/* + slack/teams/calendar/webhooks
  Prisma Integration model (schema.prisma:195-208) — config JSON blob
```

## OAuth state machine (as-built)

Initiate (nonce cookie `oauth_<provider>`, httpOnly+secure+sameSite=lax, 300s) →
provider consent → callback (state prefix + nonce check) → exchange → upsert →
use (refreshIntegrationToken: cached if unexpired, else refresh grant) →
re-auth on 401.

Flaws found: teams dual flows (different redirect URIs); nonce checked before
ADMIN check (cookie burn on 403); no "needs_reconnect" surfaced to UI; google
callback embeds raw exception text in redirect URL.

## Data model review (Integration)

- **G1 MAJOR:** no `@@unique([teamId, provider])` → concurrent callbacks create
  duplicate rows → **double CRM writes** (analyze L476-479 iterates both),
  ambiguous refresh (findFirst picks arbitrary row). Check prod for duplicates
  before migration; treat as BLOCKER if present.
- **G2 MAJOR (security):** tokens stored **plaintext** in `config` JSON. Fix:
  AES-256-GCM envelope (`v1:nonce:ciphertext`) via `ENCRYPTION_KEY`, lazy
  migration (legacy plaintext read + re-encrypt on write/refresh). ~3 write
  sites, ~6 read sites.
- Multi-instance (2 orgs/workspaces) unsupported — codified by unique
  constraint; escape hatch `externalAccountId` documented, not built.
- `enabled` semantics: DELETE nulls config (forces re-auth) — good.

## Security findings

Correct already: nonce cookies, state binding (`provider:nonce`), env-derived
redirect_uri (no open-redirect), tokens never returned to browser, webhook
HMAC + AuditLog dedupe, rate limit on hub POST.

- **G11 MAJOR:** direct connect/callback routes (slack/teams/google) require
  only `auth()` — a **member** can overwrite team credentials; only ADMINS can
  disconnect. Fix: `requireRole(...,"ADMIN")` on all 3 connect + 3 callback
  routes, before code exchange, redirect `/integrations?error=forbidden`.
- **G5 MAJOR:** docs/INTEGRATIONS.md:105,134 document Salesforce PKCE; code
  sends `client_secret` and no `code_verifier` (route.ts:341-347). Fix: S256
  verifier in `oauth_salesforce` cookie + `code_challenge` + `code_verifier`.
- **G3 MAJOR:** `[id]/test` unknown providers fall through to Slack check
  (test/route.ts:118-124) — a `google_calendar` row would hit `slack.com`.
  Fix: explicit per-provider dispatch, unknown → 400.
- **G6 MAJOR:** dev-sandbox keys off `NODE_ENV=development` alone
  (dev-sandbox.ts:70-72) — silently fakes creds in preview envs. Fix: require
  `VERCEL !== "1"` and no real creds (or explicit `ENABLE_DEV_SANDBOX`).
- **G7 MINOR:** google connect checks ID only; isProviderConfigured needs
  ID+SECRET (route.ts:42-44 vs google/connect:19-25).
- **G10 MAJOR (feature):** settings calendar connect targets `/api/calendar`
  for authUrl that never exists; `?google=connected` unhandled.
- **G13 MAJOR (product):** "Sync CRM" toast-only no-op.
- MINOR: G4 Slack hardcoded `#general` (slack.ts:109); G9 CSP missing
  slack/google (server-side only — fine); G12 teams dual flows; G14 dead
  `crmSyncQueue`/token-in-job-payload; G15 sync-crm lacks `enabled` filter.

## Target architecture for this arc

1. Schema `@@unique([teamId, provider])` + dedupe migration (keep newest row).
2. Token encryption helper `lib/integrations/config-crypto.ts` + lazy
   migration at all write/read sites.
3. `[id]/test` explicit provider dispatch (google_calendar → calendar check,
   teams → not_supported, unknown → 400), ADMIN gate + rate limit.
4. Salesforce PKCE (S256) in cookie + exchange.
5. RBAC symmetry: ADMIN on all connect/callback routes.
6. Dev-sandbox hardening (VERCEL guard / opt-in).
7. Google connect consistency (ID+SECRET), env docs truth, redirect-URI docs.
8. Settings single source of truth: fetch `/api/integrations` once; connect →
   `/api/integrations?action=auth-url&provider=google_calendar`; handle
   `?google=connected` + `google_*` errors; add `google_calendar` to
   SupportedProvider.
9. Sync CRM honest affordance (per-call sync on call detail is the real path).

## Security review of proposed changes

Nonce contract preserved on all routes; PKCE adds verifier to the same cookie
(no new cookie, stronger binding); encryption key server-env only, decrypted
config never crosses HTTP boundary; ADMIN check before exchange → no code burn
for forbidden users; redirect_uri remains env-derived; test route stays
team-scoped + gains ADMIN + rate limit.

## Deferred (reasons)

Webhook reconciliation (needs data-contract design), Zoom/Meet/Outlook/Zapier
(no server code; full feature arcs), multi-instance (product decision first),
CSP expansion (server-side traffic unaffected), queue cleanup (hygiene),
Slack channel-picker UI (plumbing lands, picker is follow-up), syncedAt
semantics split (cosmetic).
