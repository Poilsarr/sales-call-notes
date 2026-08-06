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
- [x] orchestrator APPROVED S4 arc (MED-1..3 tracked, not fixed — scale
      triggers: pgvector at ~500 calls, keyless title-fallback, Upstash fail-open)

## S5 ✅ Transcription hardening (Groq-first short calls) — SHIPPED
Commit `603b91f`. Orchestrator-routed arc; scope: transcription-v2 + analyze
route + tests only. BYOK, recall/search, marketing copy untouched.

- [x] `selectModel` flipped from duration-based to provider-based:
      Groq available → `whisper-large-v3`, else `whisper-1` (duration no
      longer decides — large-v3 on Groq is ~$0.002/min vs ~$0.006 whisper-1)
- [x] analyze route: single `groqAvailable` heuristic (shared GROQ_API_KEY
      or BYOK groqKey) in preprocess-success and fallback branches
- [x] empty-bearer invariant verified unchanged (transcription-v2 tests, now
      13): no OpenAI or Groq client built without a resolved key; large-v3
      without Groq downgrades to whisper-1, whisper-1 without OpenAI throws
- [x] P0 hardening `91c5293`: Groq client timeout 30s / maxRetries 1 bounds
      outage escalation inside the 60s window; outage-direction tests added
- [x] output-shape stability: parser untouched; transcription-v2 tests green
- [x] hard gate: vitest 732/732 (88 files); `next build` exit 0
- [x] runtime smoke + TTFB: /api/analyze 401 at 9ms (auth gate fast),
      /dashboard 307 at 10ms; real transcription TTFB requires Clerk auth +
      Groq key — env-limited, verify post-deploy via the analyze smoke
- [x] orchestrator APPROVED S5 arc (`093b1b6` docs log; P0 done as MED-3,
      doc test count corrected to 13)

## S5 ✅ /vs/gong honest comparison page — SHIPPED
Commit `a11d07a`. Orchestrator-routed arc; scope: page + shared
vs-comparison + sitemap + tests only. Sequence-number collision with the
S5 row above (arc renumbering); the row "S5 /vs/gong page" at the top of
this file is this arc's todo.

- [x] page.tsx: hedged Gong figures only — every number traces to
      docs/roadmap/market-intel.md (R15) with (reported)/reportedly;
      Gauge figures 12/12 verified against src/lib/plans.ts
- [x] pricingFootnote (Gong-only): honest "Gong does not publish pricing"
      instead of the default "public pricing pages" text; other vs pages
      untouched (default footer byte-identical, trailing period restored
      via fragment + '.' node)
- [x] no latency claims ("60 seconds"/"30 seconds"); privacy wedge says
      "yours to delete" (soft-archive) — both pinned by tests
- [x] a11y fixes in shared component: SEV-1 header text-white→gray-900
      (1.07:1→9:1), SEV-2 CTA → #C94F17 (4.55:1, in-component only),
      MED hero subhead gray-600, footnotes gray-500; metadata description
      trimmed to 154 chars
- [x] hard gate: vitest 738/738 (88 files) incl. 17-test honesty suite;
      `next build` exit 0; smoke /vs/gong 200 TTFB 0.106s
- [x] verification cloud (Reality Checker SHIP-WITH-FIXES, A11y FIX-FIRST,
      Code Reviewer APPROVE) → all corrections applied → orchestrator
      re-verified gate independently → APPROVED (confidence 0.9)
- [x] tracked items written to DEVELOPMENT_FRONTIER.md: skip-link SEV-3
      (layout-level, own PR next arc), CTA orange token site-wide
      (design sign-off + own arc), dead data.metaDescription field (wire
      or delete)
