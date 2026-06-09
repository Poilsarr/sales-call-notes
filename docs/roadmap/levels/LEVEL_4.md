# LEVEL 4 — Performance & Reliability
## Detailed Bite-Sized Tasks

**Pre-reqs:** GATE 3 closed.
**Goal:** P95 < 200ms, 5-min transcribe < 30s, E2E tests, CI/CD.
**Gate:** See `DEVELOPMENT_FRONTIER.md` GATE 4.

---

## Task 4.1 — Cache Read-Heavy Endpoints

**Files:**
- Modify: `src/app/api/calls/route.ts` (GET)
- Modify: `src/app/api/calls/[id]/route.ts` (GET)
- Create: `src/lib/cache.ts`
- Create: `src/test/cache.test.ts`

**Steps:**
1. Test: 2nd call within TTL hits cache (mocked).
2. Implement: Upstash Redis with `cache.get/set`.
3. Cache invalidation on PUT/DELETE.
4. Commit: `feat(api): Redis cache for call list + detail`.

---

## Task 4.2 — Stream Transcription

**Files:**
- Modify: `src/services/ai/transcription.ts`
- Modify: `src/app/api/transcribe/live/route.ts` (SSE)
- Create: `src/test/transcription-stream.test.ts`

**Steps:**
1. Test: chunks stream to OpenAI, partial results emit via SSE.
2. Implement: chunked upload (5s segments).
3. Use existing `lib/live-transcription-bus.ts`.
4. Measure: 5-min audio completes in < 30s.
5. Commit: `feat(ai): chunked streaming transcription with SSE progress`.

---

## Task 4.3 — E2E Tests (Playwright)

**Files:**
- Create: `e2e/` directory
- Create: `playwright.config.ts`
- Create: `e2e/upload-transcribe.spec.ts`
- Create: `e2e/team-management.spec.ts`
- Create: `e2e/hubspot-sync.spec.ts`

**Steps:**
1. Install: `npm i -D @playwright/test`.
2. Config: chromium + webkit, baseURL from env.
3. Tests:
   - Sign up → upload MP3 → see transcript
   - Team owner invites member, member accepts
   - Connect HubSpot sandbox → sync call → verify in HubSpot
4. Add: `npm run e2e`.
5. Commit: `test(e2e): Playwright suite for critical paths`.

---

## Task 4.4 — GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

**Steps:**
1. Workflow: install → typecheck → test → e2e → sentry release.
2. Required check on `main`.
3. Test: open sample PR, verify CI runs.
4. Commit: `chore(ci): GitHub Actions workflow`.

```yaml
name: CI
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx prisma generate
      - run: npx tsc --noEmit
      - run: npm test
      - run: npx playwright install --with-deps
      - run: npm run e2e
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          OPENAI_API_KEY: ${{ secrets.TEST_OPENAI_KEY }}
```

---

## Task 4.5 — Load Test (k6)

**Files:**
- Create: `scripts/load-test.js`
- Create: `docs/roadmap/LOAD_TEST_RESULTS.md`

**Steps:**
1. Install k6 locally.
2. Scenario: 100 concurrent VUs, 5 RPS, 5 min duration.
3. Target endpoints: `/api/calls`, `/api/calls/:id`, `/api/analyze`.
4. Record: p50, p95, p99, error rate.
5. Target: p95 < 200ms, error < 0.1%.
6. Commit: `test(perf): k6 load test scenario + baseline results`.

---

## Task 4.6 — Bundle Size Audit

**Files:**
- Create: `docs/roadmap/PERF_BUDGETS.md`
- Create: `scripts/bundle-audit.sh`

**Steps:**
1. Run: `npx next build`.
2. Parse `Route (KB)` table.
3. For any route > 250KB First Load JS: code-split.
4. Document budgets per route.
5. Wire: `npm run perf:audit`.
6. Commit: `chore(perf): bundle size audit + per-route budgets`.

---

## Task 4.7 — SLO Dashboard Events

**Files:**
- Modify: `src/lib/analytics.ts`
- Create: `src/test/slo-events.test.ts`

**Steps:**
1. Add: `trackSLO(metric, value, tags)` → Vercel Analytics custom event.
2. Instrument: transcription latency, analysis latency, CRM sync success rate.
3. Test: events appear in Vercel dashboard.
4. Commit: `feat(obs): SLO custom events for Vercel Analytics`.

---

## GATE 4 — Final Checks

```bash
# 1. Cache works
# Hit /api/calls twice in < 60s, verify 2nd is faster (check logs)

# 2. 5-min transcribe < 30s
npx tsx scripts/measure-transcribe.ts test-5min.mp3
# Expected: < 30s

# 3. E2E tests pass
npm run e2e
# Expected: all green

# 4. CI green on sample PR
# Open a test PR, verify Actions run

# 5. Load test passes
k6 run scripts/load-test.js
# Expected: p95 < 200ms, error < 0.1%

# 6. All routes < 250KB First Load
npm run perf:audit
# Expected: no red lines
```

When all 6 pass, **GATE 4 is closed**. Move to LEVEL 5.
