# EXECUTIVE SEQUENCE — do not reorder; every box has a gate

## THE AGENT CLOUD GATE (every sub-task, no exceptions)

1. **Hard evidence first** (local, reproducible):
   - `npx vitest run` — full suite green
   - `REDIS_HOST=disabled REDIS_PORT=0 npx next build` — exit 0
   - Runtime smoke: `REDIS_HOST=disabled REDIS_PORT=0 npx next start -p 3100`
     in background, curl the touched public routes + `/api/health`, assert
     status codes and capture TTFB (latency evidence)
2. **Verification cloud** (parallel, read-only specialists, each with a
   scoped mandate + explicit "report only, no edits"):
   - Code Reviewer — correctness, security, runtime errors, race conditions
   - Frontend Developer — hydration, client/server boundaries, UI regressions
   - Accessibility Auditor — WCAG 2.1 AA on changed components
   - Performance Benchmarker — bundle/latency, next build + route manifest
   - Reality Checker — every new copy claim vs plans.ts/behavior truth
   - Test Results Analyzer — coverage gaps, missing scenarios, weak regexes
3. **Orchestrator** — one persistent Lead Engineering Operator session
   (resumed via task_id across sub-tasks). Consumes every verifier report,
   predicts downstream risks of each proposed fix, prescribes the exact
   correction set, and either APPROVES advancing or sends the batch back.
4. **Apply corrections** → re-run the hard gate → light re-verify only the
   changed files → orchestrator sign-off → single-concern commit → advance.
5. Rule: **no sub-task is "done" until the orchestrator says so**, and no
   marketing claim ships without the Reality Checker seeing it.

## S1 ✅ Copy truth pass (300/3) — BUILD-VERIFIED PENDING
- [x] otter-ai page: 7,12,26,32,38,69,78 fixed (600min→300, unlimited→3)
- [x] fireflies page: 7,30,36,64,76 fixed (storage claims → honest, round 2)
- [x] otter-alternative: free row fixed
- [x] regression tests +3 (pricing-copy.test.ts, 6 green)
- [x] full suite 621 green
- [x] round-2 fixes: demo-carousel 1,200 not "unlimited minutes";
      free-plan-banner "4x more minutes" not "unlimited calls"; claim-surface
      tests now cover 8 surfaces + both banners (11 green)
- [ ] build + agent verification (below)

## S2 ✅ Paddle env docs — BUILD-VERIFIED PENDING
- [x] .env.example: 4 price-ID vars documented
- [ ] USER-BLOCKED: Vercel prod env vars + sandbox E2E

## S3 🔄 BYOK — IMPLEMENTED, VERIFICATION PENDING
- [x] schema + migration (idempotent, offline)
- [x] prisma generate
- [x] src/lib/byok.ts crypto (7 tests green)
- [x] src/lib/byok-resolver.ts
- [x] plans.ts `byok` feature flag
- [x] api/settings/byok route (GET/PUT, gate, validation)
- [x] byok-settings.tsx UI + settings page wiring
- [x] transcription-v2 / analysis / post-processing / knowledge-graph wiring
- [x] analyze route: resolve, guard, model override, wiring
- [x] round-1 fixes: setAAD IV binding, isPlausibleKey extraction, no
      key-leak Groq client, Toaster, a11y pass, loadError retry
- [x] round-2 tests: byok.test.ts 21, byok-resolver.test.ts 4,
      api/byok-route.test.ts 12 (vi.hoisted pattern) — all green
- [ ] hard gate + agent cloud (below)

## S4 Transcription hardening (Groq-first short calls)
- [ ] flip selectModel short-call branch → whisper-large-v3
- [ ] route default-model logic (Groq available → large-v3, else whisper-1)
- [ ] update/add tests (audio-preprocessing + route heuristic)
- [ ] GATE: vitest → build → agents

## S5 /vs/gong page
- [ ] page.tsx with verified numbers only (market-intel.md)
- [ ] GATE: vitest → build → agents (copy truth agent)

## S6 Security page extension
- [ ] 20-point checklist + sub-processors + no-training clause
- [ ] GATE: vitest → build → agents (a11y + content)

## S7 Team custom vocabulary
- [ ] model + migration + CRUD + prompt injection + settings UI
- [ ] GATE: vitest → build → agents

## S8 Action items first-class
- [ ] migration (timestamp) + prompt + route + serializers
- [ ] review page chips + CSV export column
- [ ] GATE: vitest → build → agents

## S9 Share-link sitemap
- [ ] public share rows in sitemap
- [ ] GATE: vitest → build → agents

## S10 RAG chat top-5 retrieval
- [ ] chat context uses findSimilarCalls top-5
- [ ] GATE: vitest → build → agents

## S11 Ship
- [ ] full gate, git status clean, single-concern commits per sub-task
- [ ] update docs/roadmap/DEVELOPMENT_FRONTIER.md "Recently Shipped"
- [ ] PR + merge flow per CLAUDE.md (admin squash, Vercel context hang
      recovery documented)

## S4 (agent arc) ✅ Dashboard semantic recall — SHIPPED
Note: distinct from the S4 transcription-hardening row above (that row
belongs to an earlier sequence; the agent arc renumbered). Commits on main:
`c4b50bc` (empty-bearer blocker) → `3768731` feat(recall) → `98c90ef` fix(recall).

- [x] `POST /api/calls/search` — 401 unauth, 400 invalid query, 429
      rate-limit (search: 30/min), 503 generic body (real error server-logged),
      results never include transcript; `degraded` true only when a user BYOK
      key actually dropped; 60s cache; `[recall]` metering log
- [x] `searchByQuery` — parallel vector + title queries, title floor 0.95
      with dedupe (never silently cut by limit), `includeTranscript` param
      (only `/api/chat` passes true)
- [x] CallSearch component — race-safe (requestId), a11y live region holds
      only status text, results in `<section aria-label="Search results">`,
      retry carries pending state, server messages rendered verbatim
- [x] dashboard AI-assistant input labelled (`label htmlFor` + aria-label)
- [x] hard gate: vitest 730/730 (88 files) green; `next build` exit 0
- [x] runtime smoke: /api/calls/search 401 unauth, /dashboard 307 Clerk gate
- [x] orchestrator review findings applied in `98c90ef` (code review SEV-HIGHs,
      a11y, perf, Reality Checker kill-criterion metering)
- [ ] orchestrator sign-off ruling for S4 arc → then S5 (transcription
      hardening or /vs/gong per orchestrator's sequence)
