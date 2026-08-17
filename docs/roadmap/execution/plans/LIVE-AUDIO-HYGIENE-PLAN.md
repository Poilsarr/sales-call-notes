# LIVE-AUDIO-HYGIENE-PLAN

Status: ready for execution
Date: 2026-08-17
Arc: activate live diarization + close doc hygiene debt + Paddle 5.6 code fixes

## Objective

1. Turn on REAL Deepgram diarization in production (Level 2 gate item; one env var missing).
2. Close documentation hygiene debt from the transcription arc (CLAUDE.md convention 0: docs row per arc).
3. Fix the real Paddle checkout defects found in exploration (5.6 "Pricing Page Real").

## Facts (explore wave, evidence-backed)

- `DEEPGRAM_API_KEY` IS set (Preview+Production, 29d). `DIARIZATION_PROVIDER` is NOT set anywhere — the ONLY missing piece. Code, tests, proof, Sentry redaction all shipped (INTELLIGENCE-CUTOVER arc, 08-12).
- Gate: `src/app/api/analyze/route.ts:207` requires BOTH `DIARIZATION_PROVIDER==='deepgram'` AND `DEEPGRAM_API_KEY`; else fail-soft pause-gap fallback.
- Frontier "Recently Shipped" table has NO rows for commits `83332e4` (ECONNRESET fix), `c8606cf` (chunking), `107f1cc` (32kbps) — CLAUDE.md:34-35 violated. The two TRANSCRIBE plans are orphaned (not linked). Tracked item "skip-link no-op pages P2" (frontier:101) is RESOLVED in code but unmarked. LEVEL_3.md:151 + LEVEL_5.md:152 footers stale (dated 2026-06-21). CLAUDE.md test counts (531) + external-blocked line stale (1040 tests now; diarization live).
- Paddle: all 8 `PADDLE_*` vars set (31d, all envs). Pricing page checkout code-done (server-injected price IDs). REAL BUG: `src/components/upgrade-prompt.tsx` (client) imports `PLANS` from `@/lib/plans` → `process.env.PADDLE_*` undefined client-side → placeholder `pri_pro_monthly` checkout opens. `/api/billing/checkout` is dead code (nothing calls it). `/api/paddle/webhook` has ZERO tests (most security-sensitive billing surface). LEVEL_5.md:96 planned `src/test/billing-paddle.test.ts` missing.

## Workstream A — Diarization LIVE (orchestrator, no code)

1. `vercel env add DIARIZATION_PROVIDER production` (value `deepgram`); same for preview (parity with DEEPGRAM_API_KEY).
2. Verify locally (if `.env.local` has DEEPGRAM_API_KEY): `npx tsx --env-file=.env.local scripts/prove-diarization.ts` → expect 2 speakers, exit 0.
3. Gate: `npx vitest run src/test/diarization-integration.test.ts src/test/api/analyze-byok-route.test.ts` (both-set path pins `diarize` called once).
4. Runtime verify on prod after deploy: upload a real call (user) OR confirm via `/api/analytics/health` side-effect — user-assisted.

## Workstream B — Doc hygiene (executor, docs only)

Files: `docs/roadmap/DEVELOPMENT_FRONTIER.md`, `docs/roadmap/levels/LEVEL_3.md`, `docs/roadmap/levels/LEVEL_5.md`, `CLAUDE.md` (root), `docs/roadmap/GLM51_VALIDATION.md` (note only).

1. Frontier table: add 3 rows (83332e4 / c8606cf / 107f1cc) in table style, linking the TRANSCRIBE plans; fix heading `## Recently Shipped (PRs #42–#80)` → `#42–#141 + later` (or "Session log (main)").
2. Frontier tracked items: mark skip-link no-op pages (line 101) `*RESOLVED*` (evidence: `<main id="main">` on all 5 pages, shipped in POLISH arc).
3. LEVEL_3.md: refresh footer (line 151-154): 6/7 tasks shipped (Slack, Google Calendar, Salesforce PKCE, ADMIN gates, AES-256-GCM tokens, integration test endpoint); meeting bot still BLOCKED (Zoom/Meet/Teams accounts); update "Last verified" to 2026-08-17; add ✅ markers to shipped tasks 3.1/3.2/3.3/3.6/3.7 + GATE 3 checks.
4. LEVEL_5.md: refresh footer (line 152-154): all shipped except 5.2 SSO (Clerk Enterprise) + 5.6 live checkout (env set 31d; code fixes in Workstream C; live/sandbox verification blocked on user's Paddle account); "Last verified" 2026-08-17; ✅ markers on 5.1/5.3/5.4/5.5/5.7.
5. CLAUDE.md: update test counts (`531 tests across 64 files` → `1040 tests across 127 files`), fix external-blocked line (`pyannote / Deepgram key → real diarization` → diarization LIVE; keep Zoom/Meet/Teams, HubSpot/Salesforce sandbox, Clerk Enterprise, Paddle live-credential confirm, Neon paid), update "Recent arc (PRs #62-#80)" → reference latest (post #141 + transcription arc).
6. GLM51_VALIDATION.md:19: note ffmpeg now shipped via ffmpeg-static (c8606cf) — add `(stale: ffmpeg-static shipped 08-16)`.
7. Verify: `git diff` review only — no tests affected. Commit message: `chore(docs): frontier + level checklists + CLAUDE.md hygiene (transcription arc, diarization live, paddle status)`.

## Workstream C — Paddle 5.6 code fixes (executor, code + tests)

Files: `src/components/upgrade-prompt.tsx`, `src/app/app/calls/page.tsx`, `src/app/app/intelligence/page.tsx`, `src/lib/plans.ts` (only if needed), NEW `src/test/billing-paddle.test.ts`.

1. Fix upgrade-prompt placeholder price IDs: follow the pricing-page pattern — server consumers (`calls/page.tsx`, `intelligence/page.tsx`) read `process.env.PADDLE_PRO_PRICE_ID` etc. server-side and pass the real price IDs (or a `priceIds` prop built from `buildTiers()` in `src/lib/pricing-tiers.ts`) into `<UpgradePrompt>`. Client component must NOT read `process.env.PADDLE_*` (undefined client-side) and must NOT import `PLANS`/`requirePriceId`. Keep behavior identical otherwise (tier → month/year priceId per cycle).
2. NEW `src/test/billing-paddle.test.ts` per LEVEL_5.md:96, Vitest, mock `@/lib/paddle` + prisma:
   - webhook: bad signature → 401 (mock `webhooks.unmarshal` throw)
   - `subscription.created` → plan mapping from price ID (pro/business), user linked via customData.clerkUserId, prisma.user.update fields (paddleCustomerId, paddleSubscriptionId, subscriptionStatus, subscriptionPlan, plan, credits)
   - dedup: same status twice → no second update
   - `subscription.canceled` → plan FREE + credits 5
   - `transaction.completed` (no subscriptionId) → credits 999
3. `/api/billing/checkout` disposition: verify truly unreferenced (grep `billing/checkout` across src/); if unreferenced, DELETE the route + its tests if any (none exist); if referenced, fix instead. Report evidence.
4. Verify: `npx vitest run src/test/billing-paddle.test.ts` + `npx vitest run` (full) + `npx tsc --noEmit` + `npx next build`.
5. Commit message: `fix(billing): real price IDs in upgrade prompt + paddle webhook/checkout test coverage`.

## Order & parallelism

- A (orchestrator, env) — start immediately, parallel with B and C.
- B and C: parallel executors on disjoint file sets.
- Gate after B+C: full `npx vitest run` + `npx tsc --noEmit` + `npx next build`; then `git status --short` clean (leave graphify-out wip untouched), sequential pushes, Vercel deploy green.
- Deploy carries Workstream A env? No — env changes apply to new deployments; the push from B/C triggers one deploy that also picks up `DIARIZATION_PROVIDER`.

## Verification matrix

| Item | Check |
|---|---|
| Diarization live | `vercel env ls` shows DIARIZATION_PROVIDER; prove-diarization OK (if local key); analyze-byok test both-set path green |
| Docs | git diff review; no test impact |
| Paddle fix | billing-paddle.test.ts green; upgrade-prompt shows real price IDs in client bundle (grep built file for `pri_pro_monthly` absence is NOT enough — assert component props wiring) |
| Full gate | 1040+ tests, tsc, build, deploy Ready |

## Out of scope

- Live/sandbox Paddle credential verification (user's Paddle dashboard — user action)
- Paddle webhook URL config in Paddle dashboard (user action)
- Playwright signed-in visual audit (needs Clerk test creds — separate arc)
- Deepgram timeout/retry config, temp-WAV cleanup-on-failure, CI wiring of prove-diarization (tracked as follow-ups)