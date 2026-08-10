# INTEGRATIONS-FIX-PLAN — Execution plan

PRD: `INTEGRATIONS-FIX-PRD.md` · TRD: `INTEGRATIONS-FIX-TRD.md`
Gate: vitest (867 + new green) + `REDIS_HOST=disabled REDIS_PORT=0 npx next build` + `git status --short` clean before every push.

## Serial chokepoints (one executor per wave, never parallel-edit)

- `src/components/integrations-page-client.tsx` (P0.1, P1.2, P2.1, P2.2)
- `src/app/settings/page.tsx` (P0.2, P0.3 mount, P1.2)

## Wave 1 — P0 dead-ends (3 disjoint executors)

| # | Item | Files |
|---|---|---|
| P0.1 | Cards navigate to `/settings?tab=integrations`; kill no-op "Sync CRM" toast | `integrations-page-client.tsx:45-47,348,358` + NEW `integrations-page-client.test.tsx` |
| P0.2 | Unknown-tab guard (`tab==="crm"`/bogus → render general); strip static "live" badges until P1 computes them | `settings/page.tsx:92,128-134,62-71,299-317` + NEW `settings/page.test.tsx` |
| P0.3 | NEW `src/components/settings/integrations-panel.tsx`: extracted "Connected apps" + "Integrations directory", working calendar connect → `/api/integrations?action=auth-url&provider=google_calendar` | NEW panel + panel test |

Wave 1 PR: "fix integrations dead-ends (blank settings, calendar auth URL)".

## Wave 2 — P1 honest state

| # | Item | Files |
|---|---|---|
| P1.1 | GET list + `?action=status` per-provider `{configured, connected, sandbox}` | `api/integrations/route.ts` (verify-first) + `src/test/api/integrations.test.ts` |
| P1.2 | Panel + page consume real status; `calendarConnected` from row; static array deleted | panel, `settings/page.tsx`, `integrations-page-client.tsx` |
| P1.3 | NEW health panel (configured/connected/lastSync/sandbox) | `integration-health.tsx` |

Wave 2 PR: "integrations state honesty" (+ docs PROVEN/UNPROVEN matrix).

## Wave 3 — P2 affordances

| # | Item | Files |
|---|---|---|
| P2.1 | `?google=connected` toast + refetch; `google_calendar` in SupportedProvider | `integrations-page-client.tsx` |
| P2.2 | Sync CRM honest affordance (navigate to call detail, real `/api/calls/[id]/sync-crm` path) | `integrations-page-client.tsx` + call detail |
| P2.3 | Slack channel config from `config` JSON (default `#general`) | `src/services/slack.ts` + services test |

Wave 3 PR: "working sync affordances".

## Wave 4 — P3 hygiene (own PRs)

| # | Item |
|---|---|
| P3.1 | `[id]/test` provider dispatch (unknown → 400; google_calendar → calendar check) + ADMIN gate + rate limit |
| P3.2 | `.env.example` truth: `/api/calendar/callback` → `/api/integrations/google/callback`; document `GOOGLE_REDIRECT_URI`; ZOOM_/ZAPIER_ "not implemented" + `check-env-script.test.ts` |
| P3.3 | `@@unique([teamId, provider])` + dedupe migration (own PR, DB-gated; check prod duplicates first — BLOCKER if present) |
| P3.4 | Salesforce PKCE (S256) + RBAC symmetry (ADMIN on 3 connect + 3 callback) + google connect ID+SECRET + dev-sandbox VERCEL guard + token encryption `config-crypto.ts` (lazy migration) |

Wave 4 PRs: 4a latent fixes, 4b env example, 4c unique constraint, 4d security (PKCE/RBAC/encryption/sandbox).

## Risks

Sandbox/prod divergence (test both NODE_ENV branches; SANDBOX tag in UI);
no live-credential proof (PROVEN/UNPROVEN matrix in docs; provisioning
checklist below); settings extraction regression (write page test before
extraction); unique migration on live Neon (dedupe first, user-gated);
jsdom window.location redirect assertion (assert fetch URL instead).

## User provisioning checklist (after P1)

Google OAuth client → GOOGLE_CLIENT_ID/SECRET + GOOGLE_REDIRECT_URI;
HubSpot private-app token → HUBSPOT_*; Salesforce connected app → SALESFORCE_*;
Slack bot app → SLACK_*; Teams Azure app (optional) → TEAMS_*; then live smoke
each provider: consent → callback → toast → Integration row + syncedAt.
