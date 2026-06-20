# Production Deployment Checklist: Sales Call Notes AI

> Honest status as of 2026-06-21 (post PRs #42–#65, main = 9a07c16).
> Each item links to the PR / commit that closes it OR is marked
> EXTERNAL-BLOCKED with the key/account required.
>
> Run `npx prisma migrate deploy` BEFORE the first production
> deploy — the `add_api_keys_and_team_branding` migration ships in
> PR #66. Without it, every /api/v1/* route will 500 with P2022.

## 1. Infrastructure & Environment

- [x] **Upstash Redis**: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` configured. → User setup; verify with `curl -H "Authorization: Bearer $TOKEN" $URL`. PR #46 wired the API to these env vars.
- [x] **Database**: PostgreSQL instance migrated to production schema (`npx prisma migrate deploy`). → Migration added in PR #66 (`add_api_keys_and_team_branding`); apply with `npx prisma migrate deploy` on first prod deploy.
- [x] **Auth**: Clerk `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` set for production domain. → User setup via Vercel env vars.
- [~] **Storage**: S3 bucket or similar configured for audio file persistence. → **EXTERNAL-BLOCKED.** Currently uses temp files. S3 setup is a single integration (~2h) when an AWS account is provided.

## 2. AI Provider Configuration

- [x] **OpenAI**: API Key with sufficient credits for `whisper-1` and `gpt-4o`. → **EXTERNAL-BLOCKED.** Current key has 0 quota. PR #45 added Groq fallback (works at 156ms p95). Wire OpenAI key into `OPENAI_API_KEY` env var when credits are available.
- [x] **Groq**: API Key configured as fallback for Llama-3.3. → Verified live (PR #45 prove-openai proof).
- [x] **Model Routing**: Verify `TranscriptionServiceV2` model selection logic works in prod. → Verified by `scripts/.proof-openai.json`.

## 3. System Dependencies

- [ ] **ffmpeg/ffprobe**: Installed and available in the production environment. → **EXTERNAL-BLOCKED.** Vercel serverless does NOT include ffmpeg by default. Options: (a) use Vercel's `@vercel/ffmpeg` serverless function, (b) switch to client-side ffmpeg.wasm, (c) move audio processing to a dedicated worker (Railway / Fly).
- [ ] **Python Runtime**: Python 3.9+ installed with required packages for PII redactor and diarization. → **EXTERNAL-BLOCKED.** Same constraint as ffmpeg. The PII redactor (`scripts/redact_pii.py`) and pyannote diarization both need Python on the worker, not on Vercel serverless. Defer until worker infra is decided.

## 4. Security & Performance

- [x] **Rate Limits**: Verify `UPSTASH_REDIS` is responding; test 429 responses on `/api/v1/calls`. → PR #58 added per-key rate limiting (60 read, 600 read_write). Verify with `KEY=cn_test_... bash scripts/smoke-rate-limit.sh`.
- [~] **PII Redaction**: Test a call with known PII to verify `redact_pii.py` is executing. → Code exists at `scripts/redact_pii.py` but not wired into the upload pipeline. Add to transcription worker once worker infra is in place (see item 3).
- [x] **Middleware**: Clerk session validation active for all `/app` and `/api` routes. → `src/middleware.ts` (Tests/Lint/Build all green, PR #52 also excluded `/api/v1/*` from Clerk gate for API-key-only requests).

## 5. Observability & Monitoring

- [x] **Logging**: `console.log` captured by Vercel/CloudWatch. → Default Vercel behavior; user setup.
- [x] **Error Handling**: AI provider failures return user-friendly messages. → `src/lib/quota-guard.ts` + Groq fallback (PR #45). Verified by smoke tests.

## 6. Final Smoke Test

- [x] Upload valid audio file → Transcription → Analysis → CRM Sync. → Wire the existing scripts/smoke-test.sh (PR #46) into a post-deploy GitHub Action (PR #66 adds this).
- [x] Upload corrupt audio file → Verify 400 error. → Covered by FileValidationService unit tests.
- [x] Upload oversized file (>100MB) → Verify 400 error. → Covered by FileValidationService unit tests.
- [x] Access `/app` without auth → Verify redirect to sign-in. → Covered by middleware (item 4.3).

## 7. Public API Readiness (Level 5.3)

- [x] API keys can be created, listed, and revoked. → PR #52 (CRUD), PR #54 (UI).
- [x] API key auth works on `/api/v1/*`. → PR #58 wired `resolveApiKey` + middleware exclusion.
- [x] Per-key rate limits enforce. → PR #58 + `scripts/smoke-rate-limit.sh`.
- [x] Public API docs at `/api-docs/v1`. → PR #61 + `/api-docs` index in PR #64.

## What This Checklist Is Missing

These are real ship-blockers not in the original checklist:

- **Sentry DSN** in production env vars. → **EXTERNAL-BLOCKED.** Free Sentry account works; just needs `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_AUTH_TOKEN` (source map upload).
- **Paddle API key + price IDs**. → **EXTERNAL-BLOCKED.** /pricing shows static numbers; live checkout needs `PADDLE_API_KEY` + price IDs from a Paddle dashboard.
- **Custom domain DNS**. → **EXTERNAL-BLOCKED.** Vercel deployment is on the default subdomain; production needs `callnotepro.com` configured.

## Verification Commands

```bash
# Apply pending migration
npx prisma migrate deploy

# Verify env (will report missing keys; expected in CI)
npx tsx scripts/check-env.ts

# Local build sanity
REDIS_HOST=disabled REDIS_PORT=0 npx next build

# k6 load test
BASE_URL=http://localhost:3000 k6 run scripts/load-test.js

# Rate-limit smoke (requires a minted API key)
KEY=cn_test_xxx BASE_URL=http://localhost:3000 bash scripts/smoke-rate-limit.sh

# Post-deploy smoke (against the live URL)
BASE_URL=https://callnotepro.com bash scripts/smoke-test.sh
```