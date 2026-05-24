# CallNote Pro — Session Handoff

## Live URL
https://sales-call-notes.vercel.app

## GitHub
https://github.com/Poilsarr/sales-call-notes (branch main protected — 4 CI checks required)

---

## What's Been Built (all coded)

- 23 API routes (analyze, transcribe, summarize, billing, analytics, chat, calendar, slack, webhooks, CRM sync, history, team, competitive-intelligence)
- All frontend pages (landing, dashboard, billing, settings, team, integrations, features, pricing, sign-in/up, intelligence)
- Prisma schema — 13 models on Neon PostgreSQL
- Services: AI (analytics, diarization), CRM (HubSpot, Salesforce, Teams), Calendar, Slack, Webhooks, BullMQ queues, Competitive Intelligence
- Chrome extension (Manifest V3, Google Meet captions)
- PWA manifest + favicon + app icons (192, 512)

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
4. **Generate PNG icons** — run `bash public/generate-icons.sh` (needs ImageMagick, already installed)
5. **Chrome extension upload** — wire Google Meet caption capture to backend upload API
6. **Live transcription frontend** — SSE endpoint at `/api/transcribe/live` exists but no UI page
7. **Sentry** — error monitoring (optional)
8. **Competitive Intelligence test coverage** — add tests for `/api/competitive-intelligence` endpoint

## Key Files

| File | Purpose |
|---|---|
| `src/lib/plans.ts` | Plan definitions — update `paddlePriceId` after creating Paddle products |
| `src/lib/prisma.ts` | PrismaClient singleton (used by all routes) |
| `src/middleware.ts` | Clerk auth middleware + rate limiting (no more public API bypass) |
| `src/app/api/team/route.ts` | Team CRUD (list, invite, remove members) |
| `src/app/api/competitive-intelligence/route.ts` | GET endpoint — returns mentions + trends (scoped to user's team) |
| `src/app/app/intelligence/page.tsx` | Competitive Intelligence console UI |
| `src/components/app-sidebar.tsx` | Sidebar nav — Team + Intelligence items added |
| `src/lib/prompts/enrollment-calls.md` | AI prompt — `competitorsMentioned` extraction |
| `src/services/slack.ts` | Slack alerts (no longer accepts client webhook URL) |
| `prisma/schema.prisma` | 13 models — added `CompetitorMention`, `teamRole` on User |
| `next.config.mjs` | Clean config (bodyParser removed) |

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
