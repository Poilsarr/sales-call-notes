# INTEGRATIONS-FIX — PRD

Arc: Integrations repair + honest state. Owner: Lead Engineering Operator.
Status: approved for execution (Wave 1 pending).

## Problem statement

Three user-reported bugs describe one systemic defect: **the integrations
surface lies.**

| Bug | Root cause (verified file:line) |
|---|---|
| #1 blank page on HubSpot/Salesforce click | `/integrations` cards hard-code `router.replace("/settings?tab=crm")` / `<Link href="/settings?tab=crm">` (`integrations-page-client.tsx:45-47,348`); settings page has **no `crm` tab** (`settings/page.tsx:92,128-134`) → unknown tab renders empty content area |
| #1b directory cards do nothing | Settings "Integrations directory" cards are plain `<Card>` divs, no onClick/href (`settings/page.tsx:299-317`) |
| #2 "Failed to get calendar auth URL" | `connectCalendar` fetches `GET /api/calendar` expecting `data.authUrl`; `/api/calendar` **never returns authUrl** (returns `{events}`/`{upcoming,active}`, `api/calendar/route.ts:33-54`) → deterministic toast (`settings/page.tsx:150-161`) |
| #2b working Google flow unreachable | `GET /api/integrations?action=auth-url&provider=google_calendar` returns a real authUrl (`integrations/route.ts:466-467`) + full connect/callback/upsert exists — but no UI calls it; callback redirects `?google=connected` which the client ignores (`integrations-page-client.tsx:126-146`) |
| #3 "none work" | No-op "Sync CRM" toast (`integrations-page-client.tsx:358`), `calendarConnected` hardcoded `false` (`settings/page.tsx:108`), settings never fetches `/api/integrations`, static "live" badges (`settings/page.tsx:62-71`) |

Trust-and-activation killer: the first three clicks in integrations all
dead-end. Violates the product's honesty standard.

## User stories + acceptance criteria

**S1 — Connect a provider from /integrations.**
- AC1.1: HubSpot/Salesforce/Teams/Slack cards navigate to `/settings?tab=integrations` (assert via mocked router).
- AC1.2: `/settings?tab=crm` and any unknown tab render the general tab content — never empty. Iterate `["general","workspace","integrations","api-keys","security","crm","bogus"]`.
- AC1.3: No static "live" badge unless backed by server state.

**S2 — Connect Google Calendar from Settings.**
- AC2.1: `connectCalendar` calls `GET /api/integrations?action=auth-url&provider=google_calendar` and redirects to the returned authUrl.
- AC2.2: "Failed to get calendar auth URL" unreachable from this flow.
- AC2.3: Button state derives from real `google_calendar` Integration row.

**S3 — Every badge reflects reality.**
- AC3.1: Badge text computed from `GET /api/integrations` + configured state — never the static array.
- AC3.2: Per-provider status row: configured ✓/✗, connected ✓/✗, last syncedAt, "SANDBOX" tag when dev-sandbox active.
- AC3.3: `calendarConnected` derives from the row, not hardcoded `false`.

**S4 — Returning from Google OAuth.**
- AC4.1: `?google=connected` on `/integrations` → success toast + refetch.
- AC4.2: Unknown query params ignored without crashing.

**S5 — "Sync CRM" affordance.**
- AC5.1: No path toasts with no side effect. Button either does something real or honestly explains.

## Scope IN / DEFER

IN: P0 dead-ends (S1, S2), P1 honest state (S3), P2 affordances (S4, S5), P3 latent bugs.
DEFER: Zoom/Meet/Outlook/Zapier backends (no server code, no demand evidence), webhook reconciliation (no product-defined merge semantics), multi-instance per provider, CSP expansion, queue cleanup.

## Success metrics

- 0 dead-end routes (test-enumerated)
- 0 calendar auth-URL failures from UI flow
- 100% badges derive from server state
- 867 existing tests stay green; ~20+ new tests
- Zero AI/COGS cost — churn/support reduction is the return

## Honest boundary (needs user)

Live OAuth consent, token refresh, and real CRM sync are **UNPROVEN until the
user provisions real credentials**: Google OAuth client, HubSpot private-app
token, Salesforce connected app, Slack bot app, Teams Azure app (checklist in
PLAN). Dev-sandbox proves UX, not vendor compatibility.
