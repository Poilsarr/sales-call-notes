# SECURITY-HARDENING-PLAN

> Arc A of ARCS-BACKLOG.md. Closes audit blockers 1–3 + trust copy (ship
> order item 1). Established 2026-08-19 after the Codex audit + this
> session's verification wave. Guardian protocol applies (see
> ARC-CONTEXT-GUARDIAN.md).

## Verified facts (explore wave, 08-19, all evidence file:line)

**W-A Uploads:**
- Legacy multipart `POST /api/analyze` stores audio PUBLIC — `blobPut(..., { access: 'public' })` at `src/app/api/analyze/route.ts:109-112`; `audioUrl` persisted at `route.ts:396`. The ONLY public `put()` in the repo. Record flow ≤4MB and file-picker ≤4MB route here (`src/app/app/record/page.tsx:158-174, 263-279`; threshold `BLOB_LIMIT_MB = 4` `page.tsx:152,260`).
- Blob is written BEFORE validation: `route.ts:108` blobPut precedes the 100MB `FileValidationService` check (`route.ts:120-124`, cap at `src/services/validation/file-validation.ts:25`) and the 25MB transcription cap (`src/services/ai/transcription-v2.ts:8,74-87`). Non-WAV 25-100MB files are stored public, fail transcription, orphaned.
- Free-tier 30MB cap exists ONLY on the presigned path (`src/app/api/upload-url/route.ts:9-14,49-51`, client-claimed `fileSize`) — never applies to multipart. Presigned path uses `access: 'private'` (`route.ts:83-87`) but is "currently broken" per `docs/diagnostics/upload-pattern-error.md`.
- Free-plan blob cleanup at `analyze/route.ts:601-609` is gated on `isBlobUpload && plan === "free"`; the legacy branch sets `isBlobUpload = false` (`route.ts:64`) → legacy public blobs NEVER cleaned. Cleanup also leaves a dangling `audioUrl` (blob gone, URL retained → `/api/calls/[id]/audio` 502).
- Raw `audioUrl` returned in `GET /api/calls` (`route.ts:59-72`), `GET /api/calls/[id]` (`route.ts:29-54`), `GET /api/history/[id]` (`route.ts:52-53`), GDPR export (`src/lib/gdpr-export.ts:32`). `/api/v1/calls` already excludes it (`route.ts:72-79`).
- Audio proxy `GET /api/calls/[id]/audio` (`src/app/api/calls/[id]/audio/route.ts:22-83`) is auth-gated (`canAccessCall` `:44`) and fetches with `Authorization: Bearer <blob token>` (`:61-64`) — works for PRIVATE blobs too. `isTrustedBlobUrl` allowlist accepts `.public` hostnames by design (`src/lib/blob-url.ts:34,42-58`).

**W-B Deletion:**
- Call delete = `DELETE /api/history/[id]` (`src/app/api/history/[id]/route.ts:180-215`): deletes DB rows (`:197-204`) but NEVER the blob. No UI consumer currently calls it.
- Account delete = `POST /api/user/delete` (`src/app/api/user/delete/route.ts:8-54`): soft-deletes 6 PII fields (`:19-29`), enqueues hard delete via `enqueueUserDelete` (`:36` → `src/services/queue.ts:79-83`). Consumer `userDeleteWorker` (`src/services/worker.ts:207-252`) is NEVER instantiated (zero importers, no script/cron/function) → jobs sit in Redis forever, hard delete never runs.
- Even if the worker ran it would FAIL: `tx.call.deleteMany` (`worker.ts:234`) hits FK RESTRICT from `ActionItem_callId_fkey`, `Decision_callId_fkey`, `NextStep_callId_fkey`, `Speaker_callId_fkey`, `Analytics_callId_fkey` (`prisma/migrations/20260501000000_init/migration.sql:283-291`) and `Call_userId_fkey` RESTRICT (`20260806000002_schema_reconcile/migration.sql:49`) → P2003 rollback. Children must be deleted BEFORE calls.
- Only blob `del()` in the app: `analyze/route.ts:604`. `deleteBlob` helper (`src/lib/blob.ts:24-30`) has ZERO callers.
- Orphans surviving BOTH deletes: Vercel Blob audio (all paid + all legacy), `KnowledgeEntity`/`KnowledgeRelation` rows (no User relation; `userId` String + `calls` String[]), `RateLimit` rows (dead model), BYOK keys (`User.byokOpenaiKey/byokGroqKey` omitted from anonymization `route.ts:19-29`), and effectively ALL account data (worker never runs).

**W-C Rate limiting:**
- Primitive `src/lib/rate-limit.ts`: LIMITS `default 60/min, analyze 5/hr, api 100/min, oauth 10/hr, search 30/min` (`:9-15`). FOUR fail-open gates: no creds → null (`:24-26`); init error swallowed (`:38-41`); `rateLimit()` returns `{success:true}` on missing creds AND on catch (`:48,61-63,65-70`); `checkRateLimit()` returns success on `!rl` and catch (`:75,80-83`).
- Middleware gate `src/middleware-rate-limit.ts`: keyed on FIRST XFF entry (`:20` — client-spoofable; Vercel appends real IP LAST). `/api/transcribe/live` skipped entirely (`:27-29`). Type selection `:31-36`.
- `/api/v1` limits cosmetic: `src/lib/api-rate-limit.ts` LIMITS `read 60 / read_write 600` (`:22-25`) only feed returned numbers; enforcement is `checkRateLimit(redisKey, "api")` = 100/min regardless (`:49`). Key rotation evades (no per-user cap on `POST /api/v1/keys`, `src/app/api/v1/keys/route.ts:39-75`). Clerk-session fallback on `/api/v1/calls` (`route.ts:48-56`) has NO per-user limit. Fail-open deliberate: `api-rate-limit.ts:9-10`.
- Phantom public routes: `/api/v1/transcribe` + `/api/v1/competitive-intelligence` in `isPublicApi` (`src/middleware.ts:14,16`) but no route files exist → would be unauthenticated if ever added.
- Encryption: 64-hex `ENCRYPTION_KEY` decodes correctly — hex branch `src/lib/integrations/config-crypto.ts:53-54` (base64 branch can't misfire: 48 ≠ 32 bytes). `decryptConfig` fail-open-to-null is documented design (`:29-32,117-124,141-146`). OAuth `config` is AES-256-GCM envelope when key set (`integrations/route.ts:617,626`), plaintext when absent. Doc mismatch: `scripts/check-env.ts:96` + `.env.example:160` document base64 only.

## Workstreams

### W-A — Private uploads + validation ordering (audit blocker 1) — HIGH
Files: `src/app/api/analyze/route.ts`, `src/lib/blob-url.ts`, `src/app/api/calls/route.ts`, `src/app/api/calls/[id]/route.ts`, `src/app/api/history/[id]/route.ts` (payload only).
1. Legacy multipart `blobPut` → `access: 'private'` (with `addRandomSuffix` kept). Record ≤4MB flow becomes private automatically.
2. Reorder: run `FileValidationService` (100MB) + plan-cap check BEFORE the blob write. Apply the same plan caps as `upload-url/route.ts:9-14` (free 30 / pro 200 / business 500 / enterprise 500) to the multipart branch, server-side (no client-claimed size).
3. Set `isBlobUpload = true` for the legacy branch (it IS a blob upload) so free-plan cleanup `:601-609` applies; ensure failure paths after blob write also delete the blob.
4. Null `Call.audioUrl` when the free-plan cleanup deletes the blob (`:601-609`) — kills the dangling 502.
5. Strip raw `audioUrl` from `GET /api/calls` list payload (player already uses the auth-gated proxy `calls/[id]/page.tsx:69`). Keep it in `[id]` detail + GDPR export (functional need) — private blobs are unreadable without the token anyway. NOTE (review 08-19): `GET /api/history` list already excludes audioUrl (history/route.ts:61-79) — verify-only there. NOTE: `GET /api/calls` is cached 60s (calls/route.ts:40-44) — stale payloads may serve the field up to TTL; acceptable, note in test.
6. `isTrustedBlobUrl`: keep `.public` acceptance for LEGACY rows (compat: existing calls must keep playing), add comment. New writes are private.
Tests: multipart upload stores private (mock blobPut assert access), validation-before-store ordering, free-plan cleanup nulls audioUrl, list payload has no audioUrl, plan cap on multipart.

### W-B — Deletion purge (audit blocker 2) — HIGH
Files: `src/app/api/history/[id]/route.ts`, `src/app/api/user/delete/route.ts`, `src/services/queue.ts` (call site only).
1. `DELETE /api/history/[id]`: fetch `call.audioUrl` first, `blobDel` it (try/catch — log + continue so row deletion is never blocked by a blob outage), then existing row deletes. Null-guard when `audioUrl` is null.
2. `POST /api/user/delete`: replace the enqueue with an INLINE hard-delete transaction (private-beta volumes; removes the dead-consumer failure mode entirely):
   a. Fetch all `audioUrl`s for the user's calls; `blobDel` each (best-effort, logged).
   b. Transaction, FK-ordered: `callComment` → `callInsight` → `actionItem` → `decision` → `nextStep` → `speaker` → `analytics` → `competitorMention` → `call` → `apiKey` → `notification` → `knowledgeEntity`/`knowledgeRelation` (by `userId` string — verify the field stores user id, not clerkId, at `analyze/route.ts:440-474` write site) → `rateLimit` rows → team-owned (`vocabularyEntry`, `integration`, `team`) → `user`.
   c. ALSO null `byokOpenaiKey`/`byokGroqKey` in the soft-delete anonymization (`route.ts:19-29`).
   d. Remove the `enqueueUserDelete` call (`route.ts:36`); keep queue exports intact (worker.ts untouched — out of scope, noted as debt).
3. AuditLog rows: keep (legal record by design).
Tests: call delete removes blob (mock blobDel, assert called with URL), user delete purges all models in FK order (mock prisma tx sequence), BYOK keys nulled, blob failure doesn't block deletion, enqueue removed.

### W-C — Rate-limit hardening (audit blocker 3) — MEDIUM
Files: `src/middleware-rate-limit.ts`, `src/app/api/transcribe/live/route.ts`, `src/lib/api-rate-limit.ts`, `src/app/api/v1/keys/route.ts`, `src/app/api/v1/calls/route.ts`, `src/middleware.ts`, `scripts/check-env.ts`, `.env.example`.
1. XFF spoofing: key on LAST XFF entry (`split(",").at(-1)`, Vercel appends real IP last) with `x-real-ip` fallback; keep `"anonymous"` as last resort.
2. `/api/transcribe/live`: add in-route `checkRateLimit` keyed on the Clerk `userId` — `live:${userId}` **120/min** (browser POSTs per speech event; extension already caps client-side at 250/batch, `src/lib/extension-upload.ts:7` — a 10/min cap would break real speech; revisit via beta telemetry).
3. `/api/v1` honest enforcement (review-verified 08-19: `src/lib/rate-limit.ts` LIMITS has NO `read`/`read_write` keys — `getRatelimit` would fall back to `default` 60/min, so read_write would silently ship as 60 not 600): add `read: 60, read_write: 600` to LIMITS in `src/lib/rate-limit.ts` (executor 3's allowlist now includes it), and `api-rate-limit.ts:49` passes the per-scope type to `checkRateLimit` instead of the hardcoded `"api"`. Per-user cap on `POST /api/v1/keys` (`v1keys:${userId}` 5/hr). Clerk-session fallback on `/api/v1/calls`: per-user limit (`v1session:${userId}` 60/min).
4. Phantom public routes: remove `/api/v1/transcribe` + `/api/v1/competitive-intelligence` from `isPublicApi` (`src/middleware.ts:14,16`) until real routes exist (they 404 today).
5. Fail-open posture: KEEP (documented deliberate design, `api-rate-limit.ts:9-10`), but add Sentry capture when the limiter is unavailable (currently `console.warn` only, `rate-limit.ts:81`) so outages are visible. Document the posture in the code comment.
6. Doc: `scripts/check-env.ts:96` + `.env.example:160` — document that a 64-char hex key is accepted (code supports it, `config-crypto.ts:53-54`).
Tests: XFF last-hop keying, live-route limiter, v1 read=60/read_write=600 enforcement, key-creation cap, session-fallback cap, middleware public-route list, hex key doc paths.

### W-D — Data-processing trust page (ship-order item 1) — LOW
Files: NEW `src/app/privacy/page.tsx`, `src/components/site-footer.tsx`, `src/middleware.ts` (matcher public list), `src/components/features-page-client.tsx` (enterprise-security copy check).
1. New public `/privacy` page: discloses cloud processors (Groq, OpenAI, Deepgram, Vercel Blob, Upstash, Neon), states audio/transcripts are cloud-processed (no "local" claims), never used to train models, retention + export (`/api/export` GDPR) + deletion controls (`/settings`). No SOC2/ISO claims.
2. Footer link ("Privacy") + middleware matcher public-list entry + any nav references.
3. Check `/features#enterprise-security` copy for residual "local processing" language (footer label already fixed in `4e38488`; verify section body).
Tests: page renders + public (middleware matcher), footer link present, features copy grep.

## Execution (swarm, disjoint file sets)

| Executor | Files | Commit |
|---|---|---|
| 1 (W-A) | analyze/route.ts, blob-url.ts, calls/route.ts, calls/[id]/route.ts, history/[id]/route.ts (payload only) | `fix(uploads): private blobs + validate-before-store + free-plan cleanup` |
| 2 (W-B) | history/[id]/route.ts, user/delete/route.ts, queue.ts (call site) | `fix(deletion): purge blobs + inline hard-delete` |
| 3 (W-C) | middleware-rate-limit.ts, transcribe/live/route.ts, api-rate-limit.ts, v1/keys/route.ts, v1/calls/route.ts, middleware.ts, check-env.ts, .env.example | `fix(rate-limit): XFF last-hop, v1 scope limits, live limiter` |
| 4 (W-D) | privacy/page.tsx (new), site-footer.tsx, middleware.ts (matcher), features-page-client.tsx | `feat(privacy): data-processing page` |

NOTE: `src/middleware.ts` touched by BOTH executors 3 and 4 — split: executor 3 owns the `isPublicApi` list + matcher public list; executor 4 adds ONLY the `/privacy` matcher entry. Executor 4 lands LAST to avoid merge conflicts, or executor 3 leaves a comment marker. Orchestrator resolves the conflict (single file, small edits).

Overlap: `history/[id]/route.ts` in executors 1 (payload strip) and 2 (blob purge) — executor 1 strips audioUrl from the LIST endpoint only (`GET /api/history`), executor 2 owns `[id]` route. Verify: the list endpoint is `src/app/api/history/route.ts`, NOT `[id]` — executor 1's file list is corrected below.

**CORRECTED disjoint sets:**
| Executor | Files |
|---|---|
| 1 (W-A) | analyze/route.ts, blob-url.ts, calls/route.ts, calls/[id]/route.ts, history/route.ts (list payload), gdpr-export.ts (leave as-is — export needs URL; no change) |
| 2 (W-B) | history/[id]/route.ts, user/delete/route.ts, queue.ts (call site) |
| 3 (W-C) | middleware-rate-limit.ts, transcribe/live/route.ts, api-rate-limit.ts, rate-limit.ts (LIMITS read/read_write), v1/keys/route.ts, v1/calls/route.ts, middleware.ts (isPublicApi only), check-env.ts, .env.example | `fix(rate-limit): XFF last-hop, v1 scope limits, live limiter` |
| 4 (W-D) | privacy/page.tsx (new), site-footer.tsx, middleware.ts (matcher entry ONLY — single-line edit, orchestrated after 3), features-page-client.tsx |

## Gate & ship
1. Per-executor: `npx vitest run <their test files>` + `npx tsc --noEmit`.
2. Orchestrator full gate: `npx vitest run` (1048 + new tests — exact count pinned from run output at gate) + `npx tsc --noEmit` + `REDIS_HOST=disabled REDIS_PORT=0 npx next build` (bundle-gate: proof NOT regenerated this arc — B-arc owns that).
3. Guardian checkpoint BEFORE commits (ARC-CONTEXT-GUARDIAN.md): allowlist compliance, claim-vs-diff, secrets scan (`sk-`, `gsk_`, `sig_`, `rediss://`, 64-hex in diffs), test-count honesty.
4. Four commits, sequential push, CI green per commit.
5. Docs: frontier rows (4 commits), ARCS-BACKLOG status updates, this plan's Plan status section.

## Out of scope (debt, tracked in ARCS-BACKLOG)
- `userDeleteWorker`/`transcriptionWorker` remain uninstantiated (queue.ts exports kept; worker.ts untouched).
- KG `calls[]` array scrub on call delete (KnowledgeEntity/KnowledgeRelation store non-FK call id strings — orphaned refs survive W-B; debt row).
- Presigned upload path "broken" (`docs/diagnostics/upload-pattern-error.md`) — separate fix.
- Bundle re-baseline (arc B); dependency upgrades (arc C); sandbox verification (arc D, blocked on user).
- No single-call audio purge UI (debt item added to frontier).
- A5 (extension ingest): covered — transcript-only paths carry no audio; the 25MB guard + W-A reorder cover the only audio paths. No extra work.

## Plan status
- Last verified checkpoint: commits 90d1386, 4c19608, 8423975, f4a7935 pushed to main 08-19; deploy gauge-knfr7qkm7 Ready; CI + React Doctor green; 1100/1100 tests; tsc clean; build 88/88 pages; local prod-mode smoke of /privacy verified.
- Guardian verdicts: 1st checkpoint (pre-commit) — CLEAR on all 24 claims except graphify-out/* modified (pre-existing user wip, left untouched, not staged); empty-verdict run replaced by re-run.
- Open drift items: settings toast copy stale (frontier row); KG calls[] scrub (frontier row); presigned path still broken (frontier row); bundle proof NOT regenerated this arc (arc B owns it).