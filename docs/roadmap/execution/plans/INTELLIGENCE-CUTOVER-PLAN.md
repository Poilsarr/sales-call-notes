# INTELLIGENCE-CUTOVER-PLAN — Close GATE 2 (Level 2: Make The Intelligence Real)

Arc: Intelligence completion. One concern per executor; disjoint file sets.
Gate: `npx vitest run` + `npx tsc --noEmit` + `npx next build` (REDIS_HOST=disabled REDIS_PORT=0), then verification cloud (Code Reviewer / Reality Checker scoped), then single-concern commits.

## What's actually left (explore-wave evidence, 2026-08-12)

| # | Gap | Evidence |
|---|---|---|
| G1 | Deepgram diarization dead in prod: `if (process.env.VERCEL) throw` fires before `diarize()` | `src/app/api/analyze/route.ts:205` |
| G2 | `DIARIZATION_PROVIDER` flag never implemented (doc-only) | `docs/roadmap/DIARIZATION_DECISION.md:66,78`; 0 refs in src/ |
| G3 | `detect_language` not sent to Deepgram | `src/services/ai/diarization.ts:38` (only model/diarize/smart_format) |
| G4 | `DEEPGRAM_API_KEY` missing from Sentry redaction lists | `sentry.server.config.ts:6-19`, `sentry.edge.config.ts:6-17` (decision doc :69 requires it) |
| G5 | Dead Python scripts still present: `src/services/ai/scripts/diarize.py`, `detect_lang.py` (decision doc :67 says delete) | both files exist, uncalled |
| G6 | No real-fixture diarization proof (decision doc :70-71 requires replay assertion) | only mocked `src/test/diarization-integration.test.ts` |
| G7 | Langfuse wrapper defined but never wired: `wrapClient` imported nowhere | `src/lib/langfuse.ts:22-30`; factory `createOpenAIClient` is the single chokepoint (`src/lib/openai-client.ts:14-21`) |
| G8 | Knowledge graph NEVER populated by the pipeline — only dead `worker.ts:63-96` + manual `/api/knowledge/ingest` write entities | analyze route only calls `indexCall` (embeddings) at `:427-433` |
| G9 | CallInsight fields never written: `sentimentScore/talkRatio/objections/topics` stay NULL; trends endpoint reads them | upsert at `analyze/route.ts:445-460` sets only salesScorecard/closeProbability/coachingNotes/personalization |
| G10 | `/api/analytics/health` (Task 2.8 second half) does not exist | only `trends/` under `src/app/api/analytics/` |

Satisfied already: GATE 2 #5 (972 tests, tsc in CI), #6 (0 `// TODO: REAL`).

## Executor A — diarization cutover + pipeline route (owns these files ONLY)

- `src/app/api/analyze/route.ts` — replace VERCEL guard (:205) with `DIARIZATION_PROVIDER === "deepgram" && DEEPGRAM_API_KEY set` gate; fail-soft to existing pause-gap fallback. Same file: G8 — after analysis succeeds, upsert `KnowledgeEntity`/`KnowledgeRelation` from analysis `keyEntities` (mirror `worker.ts:63-96` extraction shape; user-scoped; try/catch fail-soft). Same file: G9 — extend the CallInsight upsert to write `sentimentScore`, `objections`, `topics`, `talkRatio` IF the analysis output provides them (verify shape from `AnalysisService`/parser first; never fabricate).
- `src/services/ai/diarization.ts` — add `detect_language: true` to transcribeFile opts (:38).
- `sentry.server.config.ts` + `sentry.edge.config.ts` — add `DEEPGRAM_API_KEY` to SECRET_NAMES.
- Delete `src/services/ai/scripts/diarize.py`, `src/services/ai/scripts/detect_lang.py` (keep `redact_pii.py` — still used).
- `src/test/diarization-integration.test.ts` — extend mocked tests: detect_language:true assertion; DIARIZATION_PROVIDER gating behavior.
- New `scripts/prove-diarization.ts` (+ fixture via macOS `say` × 2 voices, ffmpeg concat) — REAL Deepgram call, asserts ≥2 distinct speaker labels, writes `scripts/.proof-diarization.json`. Skips with clear message when DEEPGRAM_API_KEY/fixture tools missing. Pattern: `scripts/prove-intel.ts`.
- `.env.example` — add `DIARIZATION_PROVIDER` entry; fix stale HF_TOKEN/TEMP comments.

## Executor B — observability + analytics health + docs (owns these files ONLY)

- `src/lib/openai-client.ts` — wrap the SDK client with `wrapClient` from `@/lib/langfuse` at construction (single chokepoint); add idempotency guard (skip re-wrap).
- `src/lib/langfuse.ts` — no behavior change unless needed for idempotency; fails closed already (:10-12).
- New `src/test/langfuse-trace.test.ts` — gated: mock `@/lib/secrets` with LANGFUSE keys → `createOpenAIClient` output exposes langfuse extension (flushAsync); without keys → plain client (fails closed).
- New `src/app/api/analytics/health/route.ts` — per-team aggregate: avg health score, calls/week, top objections (mirror `trends/route.ts` patterns: auth + rate limit + `aggregateTrends`-style helpers from `src/services/ai/trends.ts`).
- New test for the health route (mock auth + prisma per existing route-test patterns).
- `scripts/check-env.ts` — add optional LANGFUSE_* + DIARIZATION_PROVIDER entries.
- Docs (after gate): `docs/roadmap/DEVELOPMENT_FRONTIER.md` Recently-Shipped row + Level 2 → SHIPPED; `docs/roadmap/levels/LEVEL_2.md` status updates (2.2/2.7/2.8 + GATE 2 checklist results).

## Ordering & verification

1. Executor A + B in parallel (disjoint file sets).
2. Orchestrator gate: `npx vitest run`, `npx tsc --noEmit`, `REDIS_HOST=disabled REDIS_PORT=0 npx next build`.
3. Verification cloud (read-only): Code Reviewer (analyze route + langfuse wrap), Reality Checker (no fabricated CallInsight/KG claims — only fields the analysis output actually provides), Test Results Analyzer.
4. Apply corrections → re-gate → commits (2 single-concern commits: `feat(ai): diarization cutover + pipeline intel` and `feat(obs): langfuse wiring + analytics health`).

## Explicitly OUT of scope (recorded)

- Live-page Deepgram streaming (already real) — untouched.
- Removing the Python whisper spawns in `src/services/worker.ts:29-35` / `src/app/api/transcribe/route.ts:78-103` (transcription, not diarization; separate arc).
- `redact_pii.py`/Presidio — separate concern, still used.
- Langfuse userId threading through every service (scope creep; factory-level traceName only).
- Back-filling historical CallInsight rows.
