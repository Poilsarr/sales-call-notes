# CallNote Pro — Session Handoff

## Live URL
https://sales-call-notes.vercel.app

## GitHub
https://github.com/Poilsarr/sales-call-notes (branch main protected — 3 CI checks: Tests, Lint, Build)

---

## What's Been Built (all coded)

- 23 API routes (analyze, transcribe, summarize, billing, analytics, chat, calendar, slack, webhooks, CRM sync, history, team, competitive-intelligence)
- All frontend pages (landing, dashboard, billing, settings, team, integrations, features, pricing, sign-in/up, intelligence)
- Prisma schema — 13 models on Neon PostgreSQL
- Services: AI (analytics, diarization), CRM (HubSpot, Salesforce, Teams), Calendar, Slack, Webhooks, BullMQ queues, Competitive Intelligence
- Chrome extension (Manifest V3, Google Meet captions)
- PWA manifest + favicon + app icons (192, 512)

## Recent Work (session #3 — parallel build batch + CI fix)

### Parallel workstream #1 (PR #23 — 4 worktrees, 0 conflicts)
- **Live transcription UI** — `src/app/app/live/page.tsx` (690 lines) + `src/app/api/calls/route.ts` + sidebar Live link
- **Chrome extension upload** — `extension/` (background.js, shared.js, popup.html, popup.js, manifest.json) + `src/lib/extension-upload.ts` + 22 new tests. Service worker uses Clerk `__session` cookie for auth, `chrome.alarms` for retry backoff
- **PNG icon set** — 12 new icons (16/32/72/96/128/144/152/192/384/512 + apple-touch 180 + 2 maskable) + `logo-maskable.svg`. Used rsvg-convert (ImageMagick 7 silently dropped SVG gradients). Updated `manifest.json` + layout `<link>` tags
- **Competitive Intelligence tests** — +10 tests, 84/84 total

### Parallel workstream #2 (PR #26 — 3 worktrees)
- **Sentry error monitoring** — `@sentry/nextjs` v10, 3 config files (client/server/edge) with PII scrubbing (emails, Clerk sessions, 12 server secrets, bearer tokens). No-op when `NEXT_PUBLIC_SENTRY_DSN` missing. `next.config.mjs` wrapped with `withSentryConfig` for source map upload. `src/lib/sentry.ts` `captureApiError` helper. 3 critical API routes (transcribe, analyze, billing) wired. `docs/SENTRY.md` setup guide. +6 tests
- **CI route improvements** — added `from`/`to` ISO date params, `limit` (1-200, default 50), `groupBy=week|month` for time-bucketed trend, 400 responses for invalid params, empty `competitor` normalized to no filter, plan gating (free users get 403 `PLAN_REQUIRED`). 13 → 41 tests in file
- **OAuth setup docs + dev sandbox** — comprehensive `.env.example` (32 vars, 11 groups), `docs/INTEGRATIONS.md` step-by-step for HubSpot/Salesforce/Teams, `scripts/check-env.ts` verification script, dev sandbox mode (NODE_ENV=development) returns fake creds. +10 tests for the env checker

### CI fix (PR #24)
- **Root cause**: Vercel CLI token cannot bypass Vercel's "Running Checks" gate — Deploy job failed with "1 failed" on every PR
- **Fix**: Removed CI deploy step entirely. Vercel GitHub App integration handles PR previews + production deploys automatically
- **Required checks**: Now `Tests`, `Lint`, `Build` only (3, not 4) — deploy is no longer a required gate
- **Files**: `.github/workflows/ci.yml` — `deploy:` job removed (87 lines down from 103)

### Integrations OAuth status (PR #22)
- API now returns `configured: boolean` per provider
- Page shows "Setup Required" amber badge + disables Connect button when env vars missing
- Dev sandbox (`NODE_ENV=development`) auto-mocks HubSpot/Salesforce/Teams creds for local testing
- Full setup guide at `docs/INTEGRATIONS.md`
- `npx tsx scripts/check-env.ts` reports which env vars are set vs missing

### Final test count: 128/128 across 18 files (was 84/84)
- Lint: 0 warnings, 0 errors
- Build: 36 routes, all compiling clean
- Production: https://sales-call-notes.vercel.app

## Recent Work (session #2 — massive security + quality overhaul)

### Security Fixes (15 issues)
- **Auth lockdown**: Clerk auth added to 8 unprotected API routes (chat, billing, history, analytics, slack, webhooks, transcribe, summarize) — previously any endpoint could be called with any userId
- **Command injection (RCE)**: Fixed in transcribe route + worker.ts — filename interpolation → `sys.argv[1]` pattern
- **SSRF prevention**: Webhook URLs validated HTTPS-only
- **IDOR fixes**: Team DELETE verifies member belongs to same team; competitive intelligence rejects cross-team queries
- **Data exfiltration**: Slack webhook URL no longer accepted from client
- **Token leak**: Calendar access token moved from query param to Authorization header
- **Rate limit hardening**: Uses `req.ip` + user-based keying instead of spoofable `x-forwarded-for`
- **Paddle webhook idempotency**: Dedup by subscription status
- **hasFeature logic bug**: numeric ≠ boolean true
- **Slack competitor alert URL**: Uses real call ID, not literal `[id]`

### Frontend Fixes (12 issues)
- Sign-out button wired in app sidebar
- Nav active state fixed for sub-routes (`startsWith` matching)
- `aria-current="page"` on active nav links
- `<a>` → `<Link>` in root layout
- Error states + catch handlers on 4 pages
- `toast.promise` false-success on 4xx fixed
- Calendar connection no longer fakes success on failure
- Chat sidebar auto-scroll + unique keys
- 0 healthScore no longer renders "N/A"
- Email validation on team invite
- Recording cleanup on unmount
- Landing page dead `liveText` + console.log removed
- Billing: upgrade success screen, free plan guard

### Code Quality
- **PrismaClient singleton** (`src/lib/prisma.ts`) — prevents connection pool exhaustion in 12 route/service files
- Non-functional `api.bodyParser` config removed from `next.config.mjs`
- Chrome extension: MutationObserver scoped to container, storage capped at 500, sender.id verified
- Auto-caption consent check via localStorage
- Lint: 0 warnings, 0 errors
- Tests: 32/32 passing across 7 files
- Build: 36 routes, all compiling clean

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

## What's Still Left

1. **Switch Clerk to Production** — need a custom domain first (Clerk blocks `*.vercel.app` in production)
2. **Buy domain** — Namecheap (e.g., callnotepro.com)
3. **Create Paddle products** — create Pro + Business plan products in Paddle Dashboard, paste price IDs into `src/lib/plans.ts`, merge PR #2 (Paddle billing, 571+81 lines)
4. **Add OAuth env vars** — `HUBSPOT_CLIENT_ID`/`HUBSPOT_CLIENT_SECRET`, `SALESFORCE_CLIENT_ID`/`SALESFORCE_CLIENT_SECRET`, `TEAMS_CLIENT_ID`/`TEAMS_CLIENT_SECRET` (or `MICROSOFT_*`) to Vercel + GitHub secrets. Follow `docs/INTEGRATIONS.md` for step-by-step setup. Verify with `npx tsx scripts/check-env.ts`.
5. **Sentry** — create Sentry project, add `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` to Vercel + GitHub secrets. Follow `docs/SENTRY.md`. Code is ready, no-op when DSN missing.

## Key Files

| File | Purpose |
|---|---|
| `src/lib/plans.ts` | Plan definitions — update `paddlePriceId` after creating Paddle products |
| `src/lib/prisma.ts` | PrismaClient singleton (used by all routes) |
| `src/lib/sentry.ts` | Sentry captureApiError(route, error, context?) helper |
| `src/lib/integrations/dev-sandbox.ts` | Dev-only fake OAuth creds when NODE_ENV=development |
| `src/middleware.ts` | Clerk auth + Sentry capture on auth failure |
| `sentry.{client,server,edge}.config.ts` | Sentry SDK init (no-op when DSN missing) |
| `src/app/global-error.tsx`, `src/app/app/error.tsx` | Error boundaries |
| `src/app/api/team/route.ts` | Team CRUD (list, invite, remove members) |
| `src/app/api/competitive-intelligence/route.ts` | GET — mentions + time-bucketed trend (from/to, limit, groupBy=week\|month, plan-gated) |
| `src/app/app/intelligence/page.tsx` | Competitive Intelligence console UI |
| `src/app/app/live/page.tsx` | Live transcription page (MediaRecorder + SSE) |
| `src/app/api/calls/route.ts` | Call persistence (used by live page + extension finalize) |
| `extension/` | Chrome extension (manifest.json, background.js, shared.js, popup.html/js) |
| `src/lib/extension-upload.ts` | Server-side extension payload validation + sanitization |
| `src/components/app-sidebar.tsx` | Sidebar nav — Team + Intelligence + Live items |
| `src/lib/prompts/enrollment-calls.md` | AI prompt — `competitorsMentioned` extraction |
| `src/services/slack.ts` | Slack alerts (no longer accepts client webhook URL) |
| `prisma/schema.prisma` | 13 models — added `CompetitorMention`, `teamRole` on User |
| `next.config.mjs` | Clean config (bodyParser removed) + withSentryConfig |
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
