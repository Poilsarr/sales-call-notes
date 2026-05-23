# CallNote Pro — Session Handoff

## Live URL
https://sales-call-notes.vercel.app

## GitHub
https://github.com/Poilsarr/sales-call-notes (branch main protected — 4 CI checks required)

---

## What's Been Built (all coded)

- 23 API routes (analyze, transcribe, summarize, billing, analytics, chat, calendar, slack, webhooks, CRM sync, history)
- All frontend pages (landing, dashboard, billing, settings, team, integrations, features, pricing, sign-in/up)
- Prisma schema — 12 models on Neon PostgreSQL
- Services: AI (analytics, diarization), CRM (HubSpot, Salesforce, Teams), Calendar, Slack, Webhooks, BullMQ queues
- Chrome extension (Manifest V3, Google Meet captions)
- PWA manifest + favicon + app icons (192, 512)

## Recent Work (this session)

- Switched SQLite → Neon PostgreSQL ✅
- Created Google OAuth + Calendar integration ✅ (client ID + secret in Vercel)
- Created Slack webhook integration ✅ (tested — ok response)
- Set up Upstash Redis rate limiting ✅ (10 req/min)
- Deployed to Vercel ✅ (connected to GitHub — auto-deploys on push)
- Git init'd + pushed to GitHub ✅
- Branch protection enabled (Tests, Lint, Build, Deploy must pass)
- Vercel Analytics installed ✅
- Created CI/CD pipeline (`.github/workflows/ci.yml`)
- Created Makefile + `scripts/setup.sh` + `scripts/deploy.sh` + `docker-compose.yml`
- Updated vitest testing infra — 17 tests passing
- Generated app icons + extension icons
- Created `src/app/sitemap.ts`, `extension/background.js`, `src/services/meeting-bot.ts`
- **Built Competitive Intelligence Engine** — Prisma model `CompetitorMention`, AI-powered competitor extraction in analysis prompt, storage in analyze pipeline, `/api/competitive-intelligence` endpoint, `/app/intelligence` frontend page with trend bars + mention feed, sidebar nav item, Slack alerts, feature flags in plans ✅
- **Fixed confidence always 0** — Whisper probability mapping now falls back to `confidence` field or 0.95 default for non-OpenAI providers ✅

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
3. **Stripe billing** — create Pro + Business plan products in Stripe, paste Price IDs into `src/lib/plans.ts`
4. **Generate PNG icons** — run `bash public/generate-icons.sh` (needs ImageMagick, already installed)
5. **Sentry** — error monitoring (optional)
6. **Email notifications** — Resend (optional)
7. **Competitive Intelligence test coverage** — add tests for `/api/competitive-intelligence` endpoint

## Key Files

| File | Purpose |
|---|---|
| `src/lib/plans.ts` | Plan definitions — update `stripePriceId` after creating Stripe products |
| `.env.local` | Local env vars (gitignored) |
| `.env` | `DATABASE_URL` for Prisma CLI (gitignored) |
| `src/app/layout.tsx` | Root layout — metadata, icons, analytics |
| `Makefile` | `make setup`, `make test`, `make deploy` |
| `.github/workflows/ci.yml` | CI/CD pipeline |
| `src/app/api/competitive-intelligence/route.ts` | GET endpoint — returns mentions + trends |
| `src/app/app/intelligence/page.tsx` | Competitive Intelligence console UI |
| `src/components/app-sidebar.tsx` | Sidebar nav — Intelligence item added |
| `src/lib/prompts/enrollment-calls.md` | AI prompt — `competitorsMentioned` extraction added |
| `src/services/slack.ts` | `sendCompetitorAlert()` method for competitor alerts |
| `prisma/schema.prisma` | `CompetitorMention` model added |

## Commands

```bash
# Local dev
npm run dev

# Deploy
git push                          # triggers CI/CD → auto-deploys
vercel --prod --yes               # manual deploy

# Test
npx vitest run

# Generate icons (after ImageMagick install)
bash public/generate-icons.sh
```
