# CallNote Pro — Session Handoff

## Live URL
https://sales-call-notes.vercel.app

## GitHub
https://github.com/Poilsarr/sales-call-notes (branch main protected — 3 CI checks: Tests, Lint, Build)

---

## What's Been Built (all coded)

- 37 API routes (analyze, transcribe, summarize, billing, analytics, chat, calendar, slack, webhooks, CRM sync, history, team, competitive-intelligence, OAuth connect/callback for 5 providers, integration test, cron/weekly-digest, billing cancel)
- All frontend pages (landing, dashboard, billing, settings, team, integrations, features, pricing, sign-in/up, intelligence)
- Prisma schema — 15 models on Neon PostgreSQL
- Services: AI (analytics, diarization), CRM (HubSpot, Salesforce, Teams), Calendar, Slack (DMs, slash commands, digest), Webhooks, BullMQ queues, Competitive Intelligence, Meeting Bot, Billing
- Chrome extension (Manifest V3, Google Meet captions)
- PWA manifest + favicon + app icons (192, 512)

## Recent Work (Level 3 — Integrations That Pay)

### Workstream A — HubSpot + Salesforce token refresh (3.1/3.2)
- **Token refresh helper** (`src/lib/integrations/token-refresh.ts`) — reads Integration from DB, checks expiry, calls provider refresh endpoints, updates stored tokens. Supports HubSpot, Salesforce, Google, Teams, Slack.
- **HubSpotService** refactored — reads tokens from DB via `refreshIntegrationToken` instead of accepting `accessToken` param
- **SalesforceService** refactored — same pattern
- **Auto-sync** wired in worker.ts — after call analysis, syncs to HubSpot/Salesforce if integration enabled
- **Tests**: `src/test/services/hubspot.test.ts` (7 tests), `src/test/services/salesforce.test.ts` (8 tests)

### Workstream B — Google Calendar OAuth (3.3)
- `src/app/api/integrations/google/connect/route.ts` — Google OAuth redirect with nonce cookie
- `src/app/api/integrations/google/callback/route.ts` — code exchange, token storage, redirect
- `src/services/calendar.ts` — rewritten: `listEvents()`, `createEvent()`, `detectUpcomingMeetings()` with transcript parsing
- Google refresh added to `token-refresh.ts`
- Dev sandbox updated
- **Tests**: `src/test/services/calendar.test.ts`, `src/test/api/integrations-google.test.ts` (35 tests total across both)

### Workstream C — Teams OAuth + meeting bot stub (3.4/3.5)
- `src/app/api/integrations/teams/connect/route.ts` — Microsoft OAuth v2 redirect
- `src/app/api/integrations/teams/callback/route.ts` — code exchange, token storage via Microsoft Graph
- `src/services/teams.ts` — TeamsService with `listMeetings()`, `createMeeting()`, token refresh via MS Graph
- Existing `meeting-bot.ts` detects active/upcoming meetings from calendar events, formats reminders, detects platform (Zoom/Meet/Teams)
- **Tests**: `src/test/services/teams.test.ts` (8 tests), `src/test/api/integrations-teams.test.ts` (13 tests)

### Workstream D — Slack upgrade (3.6)
- `src/app/api/integrations/slack/connect/route.ts` — Slack OAuth redirect with `chat:write,commands,im:write` scopes
- `src/app/api/integrations/slack/callback/route.ts` — code exchange via `oauth.v2.access`
- `src/services/slack.ts` — rewritten: reads bot token from Integration model, `sendDirectMessage()` via `conversations.open` + `chat.postMessage`, DM to assignees
- `src/app/api/slack/commands/route.ts` — `/callnote <callId>` slash command with HMAC-SHA256 signature verification
- `src/app/api/cron/weekly-digest/route.ts` — cron endpoint protected by `CRON_SECRET`
- `src/services/slack-digest.ts` — weekly digest (past-7-day call stats per team)
- `prisma/schema.prisma` — added `slackUserId` to User model
- **Tests**: `src/test/services/slack.test.ts` (17 tests)

### Workstream E — Integration health check (3.7)
- `src/app/api/integrations/[id]/test/route.ts` — connection health check per provider (HubSpot: contacts endpoint, Salesforce: sobjects, Slack: auth.test, Teams: not_supported)
- **Tests**: `src/test/api/integrations.test.ts` updated (11 tests)

### Workstream F — Billing UX (3.8-3.11)
- `src/components/trial-banner.tsx` — color-coded trial expiry banner (amber 4-7d, orange 2-3d, red 0-1d) with localStorage dismiss
- `src/components/usage-display.tsx` — progress bar with color logic (red >100%, amber >=80%)
- `src/app/billing/page.tsx` — auto-renewal disclosure, usage display (call minutes, team members), cancel subscription with confirmation dialog
- `src/app/api/billing/cancel/route.ts` — POST cancel with Clerk auth, sets plan to FREE, logs cancellation
- `prisma/schema.prisma` — added `trialEndsAt` and `cancellationEffectiveDate` to User model
- **Tests**: `src/test/billing/trial-banner.test.tsx` (9 tests), `src/test/api/billing-cancel.test.ts` (4 tests)

### Final test count: 328/328 across 40 files
- Lint: 0 warnings, 0 errors
- Build: 37 routes, all compiling clean
- 7 commits on main (Google, Teams, Billing, lint fix + prior Level 3 batch)

## Env Vars Configured (in Vercel + GitHub secrets)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL |
| `OPENAI_API_KEY` | OpenAI |
| `GROQ_API_KEY` | Groq |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk (test mode) |
| `CLERK_SECRET_KEY` | Clerk (test mode) |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `SLACK_WEBHOOK_URL` | Slack |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Upstash |
| `NEXT_PUBLIC_APP_URL` | https://sales-call-notes.vercel.app |

Env vars still needed: `HUBSPOT_CLIENT_ID/SECRET`, `SALESFORCE_CLIENT_ID/SECRET`, `TEAMS_CLIENT_ID/SECRET` (or `MICROSOFT_*`), `SLACK_CLIENT_ID/SECRET/SIGNING_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_SENTRY_DSN`.

## What's Still Left

1. **Switch Clerk to Production** — need a custom domain first (Clerk blocks `*.vercel.app` in production)
2. **Buy domain** — Namecheap (e.g., callnotepro.com)
3. **Create Paddle products** — create Pro + Business plan products in Paddle Dashboard, paste price IDs into `src/lib/plans.ts`, merge PR #2 (Paddle billing)
4. **Add remaining OAuth env vars** to Vercel + GitHub secrets
5. **Sentry** — create Sentry project, add `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` to Vercel + GitHub secrets. Follow `docs/SENTRY.md`. Code is ready, no-op when DSN missing.
6. **OpenAI connectivity** — still flaky (ECONNRESET/quota) — quota-guard exists but live calls untested

## Key Files

| File | Purpose |
|---|---|
| `src/lib/plans.ts` | Plan definitions — update `paddlePriceId` after creating Paddle products |
| `src/lib/prisma.ts` | PrismaClient singleton (used by all routes) |
| `src/lib/sentry.ts` | Sentry captureApiError(route, error, context?) helper |
| `src/lib/integrations/dev-sandbox.ts` | Dev-only fake OAuth creds when NODE_ENV=development |
| `src/lib/integrations/token-refresh.ts` | Shared OAuth token refresh for HubSpot, Salesforce, Google, Teams |
| `src/middleware.ts` | Clerk auth + CSP headers + route protection |
| `src/services/crm/hubspot.ts` | HubSpot CRM sync (reads tokens from DB) |
| `src/services/crm/salesforce.ts` | Salesforce CRM sync (reads tokens from DB) |
| `src/services/calendar.ts` | Google Calendar events + meeting detection |
| `src/services/teams.ts` | Microsoft Teams meetings via Graph API |
| `src/services/slack.ts` | Slack DMs, webhook, bot token auth |
| `src/services/slack-digest.ts` | Weekly Slack digest cron |
| `src/services/meeting-bot.ts` | Meeting detection, reminders, platform detection |
| `src/components/trial-banner.tsx` | Trial expiry banner (color-coded, dismissible) |
| `src/components/usage-display.tsx` | Usage progress bars |
| `src/app/api/billing/cancel/route.ts` | Subscription cancellation endpoint |
| `src/app/api/integrations/[id]/test/route.ts` | Integration health check endpoint |
| `src/app/api/slack/commands/route.ts` | `/callnote` slash command handler |
| `src/app/api/cron/weekly-digest/route.ts` | Weekly digest cron (CRON_SECRET protected) |
| `src/app/api/integrations/google/connect|callback/route.ts` | Google Calendar OAuth |
| `src/app/api/integrations/teams/connect|callback/route.ts` | Microsoft Teams OAuth |
| `src/app/api/integrations/slack/connect|callback/route.ts` | Slack OAuth |
| `src/app/integrations/page.tsx` | Integrations UI (all 5 providers live) |
| `src/app/billing/page.tsx` | Billing page with usage, cancellation, auto-renewal |
| `prisma/schema.prisma` | 15 models — added `slackUserId`, `trialEndsAt`, `cancellationEffectiveDate` on User |
| `.env.example` | 32 env vars across 11 groups, all documented |
| `docs/INTEGRATIONS.md` | Step-by-step OAuth setup for HubSpot/Salesforce/Teams |
| `docs/SENTRY.md` | Sentry setup guide |
| `scripts/check-env.ts` | Env var verification (run: `npx tsx scripts/check-env.ts`) |
| `.github/workflows/ci.yml` | 3 CI jobs: Tests, Lint, Build. Deploy via Vercel GitHub App |

## Commands

```bash
# Local dev
npm run dev

# Deploy (via PR)
git checkout -b feature-branch && git push origin feature-branch
gh pr create --base main --head feature-branch

# Test + lint + build (CI does this)
npx vitest run && npx next lint && npx next build

# Generate icons (after ImageMagick install)
bash public/generate-icons.sh
```
