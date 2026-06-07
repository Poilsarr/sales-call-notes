# CallNote Pro — Development Frontier
## Master Plan: From 52% → 100% Production-Ready

> **For Hermes:** This is the master roadmap. Each level is gated.
> No level begins until the previous level passes ALL its checkpoints.
> Bite-sized tasks (TDD, ~2-5 min each) live inside the per-level plans
> in `docs/roadmap/levels/`. Use `subagent-driven-development` to execute.

---

## Executive Summary

| Metric | Today | After Frontier |
|---|---|---|
| Spec completion | ~62% | 100% |
| Honest "ships in prod" | ~52% | ~95% |
| Working features (no mocks) | ~70% | ~98% |
| Open critical issues | 11 | 0 |
| Test coverage | ~15 test files | 30+ test files |
| CI/CD | None | GitHub Actions |

**7 Levels · 30+ work items · 12 explicit "do-not-break" checkpoints · 6 honest "gate" reviews**

The principle: **never advance a level with a known break, mock-leak, or uncommitted debt.**

---

## How to Read This Document

- **LEVEL** = a phase of work, sequentially locked.
- **GATE** = an explicit pass/fail checkpoint at the end of a level. Cannot skip.
- **CHECK** = a "do-not-break" rule that must hold *throughout* all levels.
- **TASK** = a single unit of work inside a level. ~2-5 min when possible.
- **DEBT** = tech debt that, if left unaddressed, will block the next level.

---

## Cross-Cutting "Do-Not-Break" Checks (apply to EVERY level)

These rules govern ALL work, regardless of level. A PR is rejected if it violates any:

### CHECK-01: TypeScript Must Build Clean
```bash
cd /Users/kushagarhsingh/Desktop/com\ analayze/works/sales-call-notes
npx tsc --noEmit
```
**Expected:** exit 0, zero errors. If errors exist, fix before commit.

### CHECK-02: Tests Must Pass
```bash
npm test
```
**Expected:** all tests pass. If any test fails, fix or revert before moving on.

### CHECK-03: No New Mock Without `// TODO: REAL <reason>`
Every mock must have a comment explaining the blocker, the real path, and the unblock owner. Mock-without-explanation is forbidden.

### CHECK-04: No Secrets in Code
```bash
grep -rE "sk-[A-Za-z0-9]{20,}" src/ extension/ 2>/dev/null
grep -rE "Bearer [A-Za-z0-9._\\-+/=]{20,}" src/ 2>/dev/null
```
**Expected:** no matches (or only matches inside `.env.example`/test fixtures).

### CHECK-05: Sentry PII Scrubbing Not Bypassed
Any new `Sentry.captureException` or `Sentry.captureMessage` call must pass through `scrubValue` if it carries user data. Add a test in `src/test/sentry-config.test.ts`.

### CHECK-06: Clerk Auth Required on Protected Routes
Any new API route under `/api/calls`, `/api/integrations`, `/api/team`, `/api/billing` MUST be protected by middleware. Test by hitting without a session:
```bash
curl -X POST http://localhost:3000/api/<new-route> -d '{}'
# Expected: 401 Unauthorized
```

### CHECK-07: Rate Limit Applied to All New Public APIs
Public APIs (e.g. `/api/analyze`) must apply rate limiting via `rateLimitMiddleware`. New tier? Update `lib/plans.ts` AND add a test.

### CHECK-08: Prisma Schema Changes Require Migration
Any `schema.prisma` change MUST include:
```bash
npx prisma migrate dev --name <descriptive_name>
```
And the migration SQL must be reviewed. No `prisma db push` shortcuts in committed code.

### CHECK-09: Paddle / Stripe Webhook Signatures Verified
Any new webhook handler MUST verify the signature header before processing. Test with bad signature → 400.

### CHECK-10: Chrome Extension Manifest Versioning
Any change to `extension/manifest.json` requires a version bump and a CHANGELOG entry.

### CHECK-11: Bundle Size Watch
```bash
npx next build 2>&1 | grep -E "(First Load JS|Route)"
```
If any route exceeds 250KB First Load JS, level cannot close.

### CHECK-12: CSP Header Compatibility
Any new external service (script, image, connect) MUST be added to the `csp` array in `src/middleware.ts:27-40`. New domain without CSP entry = blocked at runtime.

---

## LEVEL 0 — Stop The Bleeding (Day 1, 4-6 hours)

> **Why this is first:** Per memory, OpenAI calls fail with ECONNRESET and quota-exceeded. The codebase runs on mocks. Every other level assumes real AI calls work. Fix the foundation or nothing else matters.

### Goals
1. Real OpenAI connectivity (no mocks in production path)
2. Real database (Postgres or durable alternative)
3. Audit log of every mock remaining in the codebase

### Tasks

**Task 0.1 — Mock Inventory**
- File: `docs/roadmap/MOCK_INVENTORY.md` (new)
- Run: `grep -rn "MOCK\|mock\|fallback" src/ extension/ | grep -v node_modules | grep -v ".test."`
- Document each mock: file, line, what it fakes, what's needed to make it real.
- Commit.

**Task 0.2 — OpenAI Connectivity Diagnostic**
- Create: `scripts/diagnose-openai.ts`
- Test: 3 scenarios (real call, retry, backoff) with timing.
- Output: structured report — does it work? what's the error?
- Commit.

**Task 0.3 — Real OpenAI Path With Retry**
- Modify: `src/services/ai/transcription.ts` and `analysis.ts`
- Add: exponential backoff (3 retries, 2s/4s/8s).
- Add: structured error wrapping so caller knows if it's retryable.
- Test: `src/services/ai/transcription.test.ts` must include a "real network failure → retry → success" test using a mock fetch.
- Commit.

**Task 0.4 — Quota Guard**
- Create: `src/lib/quota-guard.ts`
- Behavior: when OpenAI returns 429, surface user-friendly error + log to Sentry with `quota_exceeded` tag.
- Wire into both `transcribe/route.ts` and `analyze/route.ts`.
- Test: `src/test/quota-guard.test.ts`.
- Commit.

**Task 0.5 — Choose Real DB**
- Decision needed: Neon (free Postgres), Supabase, or local Docker.
- If Neon: add `DATABASE_URL` to `.env.local`, run `npx prisma migrate deploy`, verify `npx prisma studio` connects.
- If Docker: spin up `docker-compose up -d postgres` (already in repo at `docker-compose.yml`).
- Commit `.env.example` update.

**Task 0.6 — Migrate All `prisma.user.findUnique` Patterns to Real DB**
- Run: `npx prisma migrate dev --name init_real_db`
- Verify: `npx prisma studio` shows tables.
- Add to `package.json`: `"db:studio": "prisma studio"`, `"db:migrate": "prisma migrate dev"`.
- Commit.

### GATE 0 — Cannot pass until ALL of:
- [ ] `npx tsc --noEmit` clean
- [ ] `npm test` green
- [ ] One real OpenAI call succeeds end-to-end (record transcript, return analysis)
- [ ] `MOCK_INVENTORY.md` exists and reviewed
- [ ] Real DB connection verified
- [ ] No `// TODO: REAL` comments without owner + ticket

---

## LEVEL 1 — Lock The Perimeter (Days 2-3, ~16 hours)

> **Why this is second:** Security, RBAC, and observability are leaking. Without these, you can't safely add features in higher levels without breaking user trust.

### Goals
1. RBAC enforced on every protected endpoint
2. GDPR data export + deletion endpoints
3. Audit log writes on sensitive actions
4. Action items API (missing from spec)

### Tasks

**Task 1.1 — RBAC Middleware**
- Create: `src/lib/rbac.ts` — `requireRole(userId, teamId, minRole)` helper.
- Roles: OWNER > ADMIN > MEMBER > VIEWER.
- Test: `src/test/rbac.test.ts` with 4 role × 5 endpoint matrix.

**Task 1.2 — Enforce RBAC on Existing Routes**
- Modify: every file in `src/app/api/calls/[id]/`, `src/app/api/team/`, `src/app/api/integrations/`.
- For each: read current user, fetch role, fail with 403 if insufficient.
- Test: each route gets a "viewer cannot delete" test.

**Task 1.3 — Action Items API (Spec Gap)**
- Create: `src/app/api/action-items/route.ts` (GET, POST).
- Create: `src/app/api/action-items/[id]/route.ts` (PUT, DELETE).
- Mirror spec from `docs/fullstack-architecture.md:287-292`.
- Test: `src/test/action-items.test.ts`.

**Task 1.4 — GDPR Data Export**
- Create: `src/app/api/user/export/route.ts` — returns JSON of all user-owned records.
- Async: returns a job ID; the actual export runs in `services/queue.ts` (add `exportQueue`).
- Email link when ready (use Resend or Postmark).
- Test: `src/test/user-export.test.ts`.

**Task 1.5 — GDPR Right-to-Delete**
- Create: `src/app/api/user/delete/route.ts` — 7-day soft-delete, then hard-delete via cron.
- Hard-delete worker in `services/worker.ts` (extend existing).
- Test: data actually gone after hard-delete.

**Task 1.6 — Audit Log Wiring**
- Audit log model already exists. Wire writes to: login, call-delete, integration-add/remove, team-member-add/remove, billing-change.
- Use `lib/audit-logger.ts` (already exists).
- Test: each audited action creates a row.

**Task 1.7 — Per-Provider Webhook Receivers (Spec Gap)**
- Create: `src/app/api/webhooks/hubspot/route.ts` — verify HubSpot signature, dedupe by eventId.
- Create: `src/app/api/webhooks/salesforce/route.ts` — verify Salesforce signed request.
- Test: bad signature → 400, good signature → 200, replay → 200 (idempotent).

### GATE 1 — Cannot pass until ALL of:
- [ ] Viewer cannot delete a team call (403 verified)
- [ ] `GET /api/action-items` returns user's items
- [ ] `GET /api/user/export` returns downloadable JSON
- [ ] `POST /api/user/delete` schedules soft-delete
- [ ] HubSpot webhook rejects bad signature
- [ ] Every sensitive action creates an `AuditLog` row
- [ ] `npx tsc --noEmit` and `npm test` both green

---

## LEVEL 2 — Make The Intelligence Real (Days 4-7, ~32 hours)

> **Why this is third:** Speaker diarization is a heuristic stub. Analysis is a single LLM call. The product's core value is "smarter than a transcript" — without real intelligence, you have a glorified recorder.

### Goals
1. Real speaker diarization (or honest "Speaker A/B" labeling)
2. Multi-stage analysis pipeline (extract → classify → score)
3. Knowledge graph populated and queryable
4. Personalization engine

### Tasks

**Task 2.1 — Diarization: Pick the Path**
- Decision: integrate `pyannote.audio` (Python microservice) OR use AssemblyAI/Deepgram diarization API.
- Recommendation: Deepgram nova-2 (cheaper, faster, no Python).
- Document choice in `docs/roadmap/DIARIZATION_DECISION.md`.

**Task 2.2 — Diarization Integration**
- Modify: `src/services/ai/diarization.ts`
- Replace heuristic with Deepgram call (or expose honest "Speaker 1/2" labels).
- Update schema: `Speaker.label` now stores real names when confident.
- Test: `diarization.test.ts` (use recorded fixture).

**Task 2.3 — Multi-Stage Analysis**
- Modify: `src/services/ai/analysis.ts`
- Stage 1: extract action items, decisions, next steps.
- Stage 2: score call (BANT, MEDDIC, or custom).
- Stage 3: enrich with `CallInsight` row.
- Test: full pipeline on fixture, assert schema.

**Task 2.4 — Objection Detection**
- Modify: `src/services/ai/analytics.ts`
- Add: objection classifier (rule-based + LLM fallback).
- Persist to `Analytics.objections` (JSON array of `{text, type, timestamp}`).
- Test: `analytics.test.ts` extended.

**Task 2.5 — Knowledge Graph Population**
- Modify: `src/services/ai/knowledge-graph.ts`
- On call completion: extract entities (people, companies, products, money, dates), insert into graph.
- New model: `KnowledgeEntity`, `KnowledgeRelation` — add to `schema.prisma` with migration.
- Test: graph query "what companies did user X mention last month?" returns expected.

**Task 2.6 — Personalization**
- Modify: `src/services/ai/personalization.ts`
- Track: which action items user acts on, which summaries they re-read, which coaching tips they apply.
- Feed back: into future analysis prompts as user-context.
- Test: `personalization.test.ts`.

**Task 2.7 — Langfuse Tracing (deps installed, not wired)**
- Modify: `src/services/ai/transcription.ts` and `analysis.ts`
- Wrap LLM calls with Langfuse trace, capturing prompt, response, latency, cost.
- Test: trace appears in Langfuse dashboard.

**Task 2.8 — Trend & Health Analytics Endpoints (Spec Gap)**
- Create: `src/app/api/analytics/trends/route.ts` — time-series of health scores.
- Create: `src/app/api/analytics/health/route.ts` — per-team aggregate.
- Test: each returns valid time series.

### GATE 2 — Cannot pass until ALL of:
- [ ] Real diarization labels appear in UI (no more random "Speaker A")
- [ ] `CallInsight` populated for a fresh call
- [ ] Knowledge graph queryable via API
- [ ] Langfuse dashboard shows traces
- [ ] `npm test` green, `tsc` clean
- [ ] No new mock without `// TODO: REAL`

---

## LEVEL 3 — The Integrations That Pay (Days 8-11, ~32 hours)

> **Why this is fourth:** CRM sync is the #1 conversion reason users pay. Without real OAuth flows and meeting-bot recording, you're not enterprise-ready.

### Goals
1. Real OAuth flows for HubSpot, Salesforce, Google (calendar)
2. Zoom/Meet/Teams bot recording (not just browser extension)
3. Slack notifications working end-to-end

### Tasks

**Task 3.1 — HubSpot OAuth**
- Create: `src/app/api/integrations/hubspot/connect/route.ts` (initiates OAuth)
- Create: `src/app/api/integrations/hubspot/callback/route.ts` (handles redirect)
- Store tokens in `Integration.config` (encrypted with `lib/secrets.ts`).
- Test: full OAuth round-trip against HubSpot sandbox.

**Task 3.2 — Salesforce OAuth**
- Same pattern as 3.1 for Salesforce.
- Use Connected App with PKCE.

**Task 3.3 — Google Calendar OAuth**
- Same pattern for `services/calendar.ts`.
- Test: events flow into calendar sync.

**Task 3.4 — Meeting Bot — Pick the Path**
- Decision: Recall.ai (paid, fast), or DIY with Playwright + audio capture (free, fragile).
- Recommendation: Recall.ai for v1, build DIY if unit economics demand.
- Document in `docs/roadmap/MEETING_BOT_DECISION.md`.

**Task 3.5 — Meeting Bot Integration**
- Create: `src/services/meeting-bot-provider.ts` (Recall.ai adapter)
- Modify: `src/services/calendar.ts` — when meeting starts, dispatch bot.
- Modify: `src/services/queue.ts` — add `meetingBotQueue`.
- Test: scheduled meeting → bot joins → recording lands in `Call`.

**Task 3.6 — Slack Notifications (deps exist, partial wiring)**
- Modify: `src/services/slack.ts` — full message templates, button interactions.
- Test: action item assigned → DM to assignee.
- Test: weekly digest cron job (add to `services/worker.ts`).

**Task 3.7 — Integration Test Endpoint**
- Create: `src/app/api/integrations/[id]/test/route.ts` (spec gap)
- Verifies connection is live, tokens valid.
- Returns: `{status, provider, lastSyncAt, errors}`.
- Test: stale token → returns error with re-auth link.

### GATE 3 — Cannot pass until ALL of:
- [ ] HubSpot OAuth round-trip works in dev
- [ ] Salesforce OAuth round-trip works in dev
- [ ] Meeting bot joins a test Zoom call and records audio
- [ ] Slack DM arrives when action item assigned
- [ ] Integration test endpoint reports status correctly
- [ ] All secrets stored via `lib/secrets.ts`, not raw env

---

## LEVEL 4 — Performance & Reliability (Days 12-14, ~24 hours)

> **Why this is fifth:** Without perf budgets, you can't sell "fast" as a feature. Without tests, you can't keep the lights on.

### Goals
1. P95 API response < 200ms (spec target)
2. Transcription of 5-min audio < 30s (spec target)
3. E2E test coverage of critical paths
4. CI/CD that runs on every PR

### Tasks

**Task 4.1 — Add Caching to Read-Heavy Endpoints**
- Modify: `src/app/api/calls/route.ts` (GET) — cache list with Upstash Redis.
- TTL: 60s for list, 5min for individual call.
- Test: second call within TTL is faster (assert mock fetch not called).

**Task 4.2 — Optimize Transcription Path**
- Move Whisper call to streaming (chunked upload).
- Show progress via `live-transcription-bus.ts` (already exists).
- Test: 5-min audio completes < 30s.

**Task 4.3 — Add E2E Tests (Playwright)**
- Install: `@playwright/test` as dev dep.
- Create: `e2e/` directory.
- Tests:
  - Sign up → upload MP3 → see transcript
  - Sign in → view history → delete call
  - Connect HubSpot sandbox → sync call → see note in HubSpot
- Wire: `npm run e2e`.

**Task 4.4 — GitHub Actions CI**
- Create: `.github/workflows/ci.yml`
- Steps: install → tsc → vitest → playwright → sentry release.
- Required status check on `main`.
- Add badge to README.

**Task 4.5 — Load Test (k6)**
- Create: `scripts/load-test.js`
- Scenario: 100 concurrent users, 5 req/s sustained, for 5 minutes.
- Target: p95 < 200ms, error rate < 0.1%.
- Run on staging before beta.

**Task 4.6 — Bundle Size Audit**
- Run: `npx next build` and check `Route (KB)` table.
- For any route > 250KB First Load: code-split or lazy-load.
- Document target: `docs/roadmap/PERF_BUDGETS.md`.

**Task 4.7 — SLO Dashboard**
- Add Vercel Analytics custom events for: transcription-latency, analysis-latency, crm-sync-success-rate.
- Test: events appear in Vercel dashboard.

### GATE 4 — Cannot pass until ALL of:
- [ ] `GET /api/calls` cached (second call < 50ms)
- [ ] 5-min audio transcription < 30s in load test
- [ ] 3+ Playwright E2E tests pass
- [ ] CI green on a sample PR
- [ ] Load test passes targets
- [ ] All routes under 250KB First Load JS

---

## LEVEL 5 — Sell The Product (Days 15-18, ~32 hours)

> **Why this is sixth:** Per memory, the $199/month price point is a concern. The product needs to *look* and *be* enterprise to justify that price.

### Goals
1. White-label / team branding
2. Enterprise SSO (SAML 2.0) — spec promises
3. Public API for power users
4. Marketing site polish

### Tasks

**Task 5.1 — Team Branding**
- Schema: add `Team.brandColor`, `Team.logoUrl`.
- UI: sidebar header pulls from team settings.
- Test: team A's branding renders for team A's users only.

**Task 5.2 — SAML SSO (Clerk Organizations)**
- Enable: Clerk Enterprise feature for SSO.
- Test: IdP-initiated login works for an org.

**Task 5.3 — Public API + API Keys**
- Create: `src/app/api/v1/` (versioned).
- Create: `src/app/api/v1/keys/route.ts` — generate scoped keys.
- Modify: `src/middleware.ts` — accept API key in `Authorization: Bearer`.
- Test: API key works, revoked key does not.

**Task 5.4 — Marketing Site (Home, Pricing, Features)**
- All pages exist; check conversion.
- Add: customer logos, social proof, ROI calculator.
- Test: Lighthouse score > 90 for performance and SEO.

**Task 5.5 — Onboarding Flow**
- Create: `src/app/onboarding/page.tsx` — 3-step (welcome → upload sample → see results).
- Reduce time-to-value to < 2 minutes.
- Test: new user reaches "first transcript" without help.

**Task 5.6 — Pricing Page Real**
- Verify: Paddle webhook → entitlement upgrade → plan enforced.
- Add: usage-based billing (per-call overage) if Paddle supports.
- Test: upgrade from Free → Pro unlocks limits.

**Task 5.7 — Documentation Site**
- `docs/INTEGRATIONS.md` exists; expand with screenshots.
- Add: `docs/API.md` auto-generated from route handlers (use `zod-to-openapi` or similar).
- Test: every public endpoint documented.

### GATE 5 — Cannot pass until ALL of:
- [ ] Team branding works in UI
- [ ] SSO login works (test IdP)
- [ ] API key auth works for `/api/v1/`
- [ ] Lighthouse score > 90 on home, pricing, features
- [ ] New user onboarding < 2 min
- [ ] Paddle upgrade → plan enforcement works

---

## LEVEL 6 — Production Hardening (Days 19-21, ~24 hours)

> **Why this is last:** Beta launch readiness. Compliance, disaster recovery, monitoring.

### Goals
1. SOC2-readiness documentation
2. Backup + recovery procedure
3. Production monitoring wired
4. Incident response runbook

### Tasks

**Task 6.1 — Database Backups**
- Neon/Supabase: enable point-in-time recovery (PITR).
- Document restore procedure in `docs/operations/RESTORE.md`.
- Test: restore from 24h-old snapshot.

**Task 6.2 — Sentry Release Tracking**
- Wire: `Sentry.setRelease(process.env.VERCEL_GIT_COMMIT_SHA)`.
- Test: errors in v0.1.0 vs v0.1.1 distinguishable in dashboard.

**Task 6.3 — Uptime Monitoring**
- Add: Better Stack or UptimeRobot check on `/api/health`.
- Test: alert fires when service is down.

**Task 6.4 — Error Budget Alerts**
- Sentry alert: error rate > 0.5% for 5 min → PagerDuty/Discord.
- Test: inject error, verify alert fires.

**Task 6.5 — Compliance Docs (SOC2-prep)**
- Create: `docs/compliance/SOC2_READINESS.md` — gaps and owners.
- Create: `docs/compliance/DPA.md` — data processing addendum template.
- Create: `docs/compliance/SECURITY.md` — public-facing security page.

**Task 6.6 — Incident Runbook**
- Create: `docs/operations/RUNBOOK.md` — common incidents, on-call steps.
- Test: simulate OpenAI outage, follow runbook, recover.

**Task 6.7 — Production Smoke Test Script**
- Create: `scripts/smoke-test.sh` — hits 20 critical endpoints.
- Wire: runs post-deploy in CI.
- Test: blocks deploy if any endpoint fails.

### GATE 6 — Cannot pass until ALL of:
- [ ] DB backup verified restorable
- [ ] Uptime monitoring active
- [ ] Sentry releases tagged
- [ ] Error rate alert fires in test
- [ ] Compliance docs reviewed
- [ ] Smoke test green on staging

---

## Honest Tradeoffs (Things We Are NOT Building)

Documenting explicitly so we don't scope-creep:

1. **Mobile apps** — PWA only. Native iOS/Android = v2.
2. **On-premise deployment** — Cloud-only. Enterprise self-host = v2.
3. **Custom ML model training** — Using Deepgram/Whisper/OpenAI. Training = v3.
4. **Multi-language UI** — English only. i18n = v2.
5. **HIPAA** — Mentioned in spec, not built. Optional v2 with BAA.
6. **Real-time multi-user cursors** — Single-user live mode. Collab = v2.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| OpenAI quota / cost spike | High | Level 0 quota guard + cost alert at $X/day |
| Postgres connection limits on serverless | Med | Use Neon pooled connection, PgBouncer |
| Deepgram API cost | Med | Cache transcripts forever, dedupe by audio hash |
| Chrome extension review delays | Med | Plan v1.1 extension updates 2 weeks ahead |
| BullMQ worker not running in Vercel | High | Use Upstash QStash instead OR self-host worker |
| Clerk Enterprise pricing | Med | Confirm pricing before promising SSO |

---

## Success Criteria — "Done"

The product is **100% on the frontier** when:

- [ ] All 7 levels have passed their gates
- [ ] Zero `// TODO: REAL` mocks in production path
- [ ] All 12 cross-cutting checks pass on `main`
- [ ] Beta launch checklist (`DEPLOYMENT_CHECKLIST.md`) fully checked
- [ ] ARR target Q4 2026 = $100K (per spec) — on track
- [ ] 30-day retention > 60% (per spec) — on track

---

## Per-Level Plan Index

Detailed bite-sized task plans live here (created as we go):

- `docs/roadmap/levels/LEVEL_0.md` — Stop The Bleeding
- `docs/roadmap/levels/LEVEL_1.md` — Lock The Perimeter
- `docs/roadmap/levels/LEVEL_2.md` — Make The Intelligence Real
- `docs/roadmap/levels/LEVEL_3.md` — The Integrations That Pay
- `docs/roadmap/levels/LEVEL_4.md` — Performance & Reliability
- `docs/roadmap/levels/LEVEL_5.md` — Sell The Product
- `docs/roadmap/levels/LEVEL_6.md` — Production Hardening

Each level plan has: pre-reqs, exact file paths, copy-paste commands, expected outputs, commit messages, gate criteria.

---

## Review Cadence

- **Daily:** 15-min standup — what shipped, what's blocked, any CHECK violation.
- **Per level:** Gate review before next level starts. Requires green CI + green tests + Sentry clean.
- **Per quarter:** Roadmap review — adjust based on user feedback, ARR, retention.

---

**The Frontier is locked. No level starts without the previous one's gate passed. No check is skipped.**
