# TRD — Technical Requirements & Decisions (Execution Arc)

## 0. Decisions made so far (do not break)

| # | Decision | Rationale | Status |
|---|---|---|---|
| D1 | Free tier copy = 300 min / 3 lifetime imports everywhere | `plans.ts:99,102` is truth; Groq key unconfirmed in prod → don't raise limits yet | Applied (S1) |
| D2 | Honesty framing on /vs pages: privacy is the differentiator, not free-tier size | Verifier CORRECTION-2; parity admitted in FAQ already | Applied (S1) |
| D3 | Paddle price IDs documented in `.env.example` | Local `.env.local` has all 8 vars; Vercel still needs them | Applied (S2) |
| D4 | BYOK Pro-gated via new `byok` FeatureId (free:false, pro/business/enterprise:true) | Reuses `checkFeatureAccess` + upgrade URL pattern | Applied (S3) |
| D5 | BYOK encryption = AES-256-GCM, master key `BYOK_MASTER_KEY` (sha-256 derived), payload `<iv>.<tag>.<cipher>` | Reversible crypto required (unlike API-key hashing); GCM authenticates tampering | Applied (S3) |
| D6 | BYOK storage = two nullable columns `byok_openai_key`, `byok_groq_key` (map to `byokOpenaiKey`/`byokGroqKey`) | Separate clear/save per provider; NULL = use shared keys | Applied (S3) |
| D7 | Migration generated offline (Neon unreachable: P1001) → hand-written idempotent SQL, `prisma generate` run locally | Vercel build runs `prisma migrate deploy`; dev DB needs `npx prisma migrate dev` when reachable | Applied (S3) |
| D8 | Service wiring via constructor opts (`TranscriptionServiceOptions`, `AnalysisServiceOptions`, `PostProcessingService(apiKey?)`, `indexCall(id, apiKey?)`) | No DI framework; matches existing constructor style | Applied (S3) |
| D9 | BYOK Groq key present → force `whisper-large-v3` (both ffmpeg and estimate paths in analyze route) | Groq cheap; paid whisper-1 pointless for BYOK-Groq users | Applied (S3) |
| D10 | BYOK save validation: `sk-`/`sk_` (OpenAI), `gsk_` (Groq), len ≥ 20 | Catches paste errors without burning a provider call | Applied (S3) |
| D11 | BYOK fail-soft: decrypt errors logged + skipped → shared keys | Wrong master key must not break user calls | Applied (S3) |
| D12 | Verification gate per sub-task: `npx vitest run` (621) → `npx next build` → parallel agent verification (code/UI/a11y/compat) → next sub-task | User mandate; CLAUDE.md gate + skills (verification-before-completion, dispatching-parallel-agents) | Active |

## 1. File map

| File | Responsibility | State |
|---|---|---|
| `prisma/schema.prisma` | User.byokOpenaiKey/byokGroqKey (map, nullable) | Modified |
| `prisma/migrations/20260805000000_add_byok_keys/migration.sql` | Idempotent ALTER TABLE | Created |
| `src/lib/byok.ts` | encryptSecret / decryptSecret / maskKey (AES-256-GCM) | Created |
| `src/lib/byok-resolver.ts` | getByokKeys(userId) → {openai?, groq?} fail-soft | Created |
| `src/lib/plans.ts` | `byok` FeatureId on pro/business/enterprise | Modified |
| `src/lib/entitlements.ts` | checkFeatureAccess reuse (unchanged) | Unchanged |
| `src/app/api/settings/byok/route.ts` | GET status + PUT save/remove, gate + validation | Created |
| `src/components/byok-settings.tsx` | Settings UI (pro-gated) | Created |
| `src/app/settings/page.tsx` | Render ByokSettings under API Keys tab | Modified |
| `src/services/ai/transcription-v2.ts` | Constructor opts {openaiKey, groqKey} | Modified |
| `src/services/ai/analysis.ts` | Constructor opts {openaiKey, groqKey} | Modified |
| `src/services/ai/post-processing.ts` | Constructor(apiKey?) | Modified |
| `src/services/ai/knowledge-graph.ts` | indexCall(callId, apiKey?) | Modified |
| `src/app/api/analyze/route.ts` | BYOK resolve + guard + model override + wiring | Modified |
| `src/test/byok.test.ts` | 7 crypto tests | Created |
| `.env.example` | Paddle price IDs + BYOK_MASTER_KEY docs | Modified |
| `src/app/vs/otter-ai/page.tsx` | Copy truth (300/3, privacy framing) | Modified |
| `src/app/vs/fireflies/page.tsx` | Copy truth (300/3) | Modified |
| `src/app/otter-alternative/page.tsx` | Copy truth (300/3) | Modified |
| `src/test/pricing-copy.test.ts` | +3 regression tests (600/unlimited/300) | Modified |

## 2. Remaining sub-task designs

### S4 Transcription hardening
- `audio-preprocessing.selectModel(duration)` — flip short-call branch to
  `whisper-large-v3` (Groq). Keep `whisper-1` only as explicit fallback.
- Route: default model when Groq key exists (shared or BYOK) →
  `whisper-large-v3`; only fall back to `whisper-1` if Groq unavailable.
- Tests: `audio-preprocessing.test.ts` + route-level heuristic tests.

### S5 /vs/gong
- New `src/app/vs/gong/page.tsx`, `ComparisonData` shape identical to
  otter-ai. Slot into `vs-comparison.tsx` (no component changes).
- Numbers (verified in market-intel): Gong $1,300–1,600/user/yr listed
  rates, platform fees, 25–56% price hikes, no free tier, per-seat min.
  Every claim sourced or hedged ("reported").

### S6 Security page
- `/security` exists (`src/app/security/page.tsx`, HSTS etc.) → extend
  into 20-point checklist + sub-processor table + no-training clause.
  Styling mirrors /privacy /terms (`space-y-8 text-[14px]`).

### S7 Vocabulary
- `TeamVocabulary` model: `id, teamId, term, canonical, context, createdAt`
- `src/lib/vocabulary.ts` — fetch/CRUD; prompt assembly helper.
- Inject into post-processing + analysis system prompts as a glossary
  block; capped (e.g. top 50 terms, joined).
- Settings UI section + `checkFeatureAccess(..., "team_workspace")` gate.

### S8 Action items
- Migration: `ALTER TABLE "ActionItem" ADD COLUMN IF NOT EXISTS "timestamp" DOUBLE PRECISION`.
- `b2b-sales` prompt (prompts-registry) gains per-item `timestamp` field;
  route maps `item.timestamp ?? null`; serializer includes it.
- Review page chips `Jump to 12:34` (seek via existing transcript viewer
  if it exposes seek; else render timestamp text only).
- CSV export column appended (existing export path + test update).

### S9 Share sitemap
- `src/app/sitemap.ts` (or existing sitemap file) adds public
  `/share/<id>` rows where `Call.sharedLink`/share record is public.
  Guard: only rows with public share flag.

### S10 RAG chat
- Chat route currently builds context; upgrade to top-5
  `findSimilarCalls` retrieval (knowledge-graph cosine sim) + embed user
  query via `text-embedding-3-small`. BYOK-aware embedding call.

## 3. Env vars (new)

| Var | Required | Notes |
|---|---|---|
| `BYOK_MASTER_KEY` | for /api/settings/byok | `openssl rand -base64 32`; rotation invalidates stored keys |
| `PADDLE_PRO_PRICE_ID` (+_ANNUAL, BUSINESS, _ANNUAL) | checkout/webhooks | documented in .env.example now |

## 4. Testing strategy

- Unit: crypto (done, 7 tests), copy regression (done, 3 tests), model
  selection, vocabulary prompt assembly, action-item serializers.
- Route-level: BYOK gate 403 for free plan, 400 bad key shapes
  (mocked auth + prisma where feasible; existing route test patterns).
- E2E: auth-gated, requires Clerk test creds (user-blocked) — mark
  explicitly in verification reports, never fake it.
