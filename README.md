# CallNote Pro

Turn sales call recordings into structured notes, action items, and
CRM-ready summaries in under 60 seconds.

**Production:** https://sales-call-notes.vercel.app
**Marketing:** https://callnotepro.com (custom domain — not yet attached)
**Repo:** https://github.com/Poilsarr/sales-call-notes

---

## What it does

1. **Upload** an MP3 / WAV / M4A, **record** in browser, or pipe a
   Google Meet call through our Chrome extension.
2. **Whisper** transcribes with auto speaker labels (Whisper Large V3;
   99+ languages).
3. **GPT-4 class analysis** extracts summary, action items, key
   decisions, MEDDIC/BANT/SPIN scorecard, competitor mentions.
4. **Push** to Slack, HubSpot, Salesforce, Microsoft Teams, Zapier,
   or any custom webhook.

Free tier: 300 transcription minutes/mo, no credit card.
Pro: $9/mo. Business: $29/mo. Enterprise: custom.

---

## Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind
- **Backend:** Next.js API routes, Node.js, BullMQ + Redis
- **DB:** Postgres (Neon) + Prisma
- **Auth:** Clerk (sessions + magic links + SSO)
- **Storage:** (planned Vercel Blob — audio currently deleted post-analysis)
- **AI:** OpenAI Whisper + GPT-4o (Groq fallback when quota exhausted)
- **Payments:** Paddle (subscription billing)
- **Realtime:** Server-Sent Events (live transcription)
- **Observability:** Sentry (errors) + Vercel Analytics (perf)
- **CI:** GitHub Actions — lint, build, test, Lighthouse preview,
  nightly Lighthouse against prod, post-deploy smoke

---

## Repo layout

```
/                    — public marketing site (home, pricing, features)
/app                 — auth-gated dashboard + recording app
/api                 — REST API (49 routes, see /api-docs)
/dashboard, /team,
/settings, /billing  — auth-gated team/workspace pages
/extension           — Chrome extension landing page + manifest link
/extension/          — Chrome extension source (Manifest v3)
/public              — static assets, manifest, robots, sitemap, sw.js
/src/lib             — shared utilities (auth, prisma, cache, secrets)
/src/services        — business logic (transcription, analysis, CRM, Slack, webhooks)
/src/test            — 65 unit test files (Vitest)
/e2e                 — Playwright tests (auto-skipped without Clerk creds)
/docs/roadmap        — LEVEL_*.md product specs + DEVELOPMENT_FRONTIER.md
/scripts             — k6 load test + convert script + extension icon generator
/.github/workflows   — ci.yml, lighthouse.yml, lighthouse-prod-nightly.yml, post-deploy-smoke.yml
```

See `CLAUDE.md` for the full agent handoff (workflow conventions,
Vercel stall recovery, hard rules, per-page access).

---

## Local dev

Requires Node 20+, Postgres (or Neon free tier), Redis (or Upstash free tier),
a Clerk dev account, an OpenAI key, and optionally Paddle / Groq.

```bash
git clone https://github.com/Poilsarr/sales-call-notes
cd sales-call-notes
npm install
cp .env.example .env.local   # then fill in keys
npx prisma generate
npx prisma db push
npx vitest run               # 541 tests
REDIS_HOST=disabled REDIS_PORT=0 npx next dev
```

Production build:
```bash
REDIS_HOST=disabled REDIS_PORT=0 npx next build
REDIS_HOST=disabled REDIS_PORT=0 npx next start -p 3100
```

---

## Testing

- **Unit:** `npx vitest run` — 65 files, 541 tests
- **E2E:** `npx playwright test` — auto-skipped without `E2E_TEST_USER_*` env
- **Load:** `BASE_URL=https://sales-call-notes.vercel.app k6 run scripts/load-test.js`
  - Live prod measurement (2026-06-24): home p95 = 345ms, demo p95 = 285ms,
    /api/calls p95 = 82ms, error rate 0% over 60s × 5 RPS

---

## Deploys

Every PR auto-deploys to a preview URL via Vercel.
Production deploys when PR is merged to `main`.
A nightly workflow runs Lighthouse against production
(`.github/workflows/lighthouse-prod-nightly.yml`).

The "Vercel context" status check on PRs sometimes hangs in
"PENDING" indefinitely even after deploy succeeds. Recovery:
merge `main` into the PR branch + retry `gh pr merge --admin --squash`.
See `CLAUDE.md` for the full recipe.

---

## Security posture

- All API routes auth-gated via Clerk middleware except
  `/api/health`, `/api/paddle/webhook`, `/api/webhooks/*`
  (signature-verified), and `/api/v1/*` (API-key auth).
- 65 endpoint exports, all protected.
- CSP set in middleware (currently `unsafe-inline` on scripts
  for Clerk — see `docs/security/todo-csp-nonce.md`).
- Rate limit middleware on top of explicit per-route limits.
- GDPR export tokens are HMAC-signed with `EXPORT_TOKEN_SECRET`.
- Sentry captures unhandled exceptions server-side only;
  client responses never leak raw `error.message`.

Report vulnerabilities to `security@callnotepro.com`.

---

## Status

See `docs/roadmap/DEVELOPMENT_FRONTIER.md` for the live product status.
Per-level feature specs live in `docs/roadmap/levels/LEVEL_0.md` …
`LEVEL_6.md`.

External blockers (require user's keys / accounts):
- OpenAI quota (real AI transcripts fall back to Groq when exhausted)
- pyannote/Deepgram (real diarization)
- Paddle live price IDs (live checkout)
- Zoom/Meet/Teams dev accounts (meeting bot)
- Clerk Enterprise tier (SSO)
- Neon paid backups (automated backups)

---

## License

Proprietary. All rights reserved.
© 2026 CallNote Pro.