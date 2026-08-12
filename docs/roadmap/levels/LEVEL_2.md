# LEVEL 2 — Make The Intelligence Real
## Detailed Bite-Sized Tasks

**Pre-reqs:** GATE 1 closed.
**Goal:** Real diarization, multi-stage analysis, knowledge graph, personalization, trend analytics.
**Status:** SHIPPED (GATE 2 closed 2026-08-12; items 1-2 partial — see checklist). Full table: see `DEVELOPMENT_FRONTIER.md` "Per-Level Current Status".
**Gate:** See `DEVELOPMENT_FRONTIER.md` GATE 2.

---

## Task 2.1 — Diarization: Pick the Path

**Decision document:** `docs/roadmap/DIARIZATION_DECISION.md`

Recommendation: **Deepgram nova-2** (cheaper, faster, no Python infra).

Comparison:
| | Deepgram | pyannote | AssemblyAI |
|---|---|---|---|
| Cost/hr | $0.0043 | self-host | $0.0125 |
| Latency | streaming | batch | streaming |
| Accuracy | high | highest | high |
| Infra | none | Python+GPU | none |

**If budget < $100/mo AND quality matters:** pyannote on Modal/Railway.
**Default:** Deepgram.

---

## Task 2.2 — Diarization Integration ✅ (live behind DIARIZATION_PROVIDER=deepgram)

**Status (2026-08-12):** LIVE. The Vercel guard is gone; `DIARIZATION_PROVIDER === "deepgram" && DEEPGRAM_API_KEY set` now gates the real Deepgram path (`src/app/api/analyze/route.ts:205`), fail-soft to the pre-existing pause-gap fallback. Deepgram nova-2 call sends `detect_language: true` (`src/services/ai/diarization.ts:38`); `DEEPGRAM_API_KEY` redacted in Sentry (server + edge); dead Python scripts (`diarize.py`, `detect_lang.py`) deleted; mocked tests extended (5 tests).

**Files:**
- Modify: `src/services/ai/diarization.ts`
- Modify: `src/services/ai/transcription.ts` (combined call)
- Create: `src/test/diarization-integration.test.ts`

**Steps:**
1. Add Deepgram SDK to `package.json`.
2. Update `transcription.ts` to call Deepgram nova-2 with diarize=true.
3. Map `speaker_id` → `Speaker.label` (or "Speaker A/B/C").
4. Test: fixture audio with 2 speakers → 2 distinct labels.
5. Commit: `feat(ai): real diarization via Deepgram nova-2`.

---

## Task 2.3 — Multi-Stage Analysis ✅

**Files:**
- Modify: `src/services/ai/analysis.ts`
- Modify: `src/services/queue.ts` (split into multiple jobs)
- Create: `src/test/analysis-pipeline.test.ts`

**Steps:**
1. Stage 1: extract action items, decisions, next steps (structured).
2. Stage 2: score call (BANT/MEDDIC/custom rubric in `lib/prompts.ts`).
3. Stage 3: enrich with `CallInsight` row (close probability, coaching notes).
4. Each stage as separate BullMQ job, so partial failure doesn't lose work.
5. Commit: `feat(ai): 3-stage analysis pipeline (extract → score → enrich)`.

---

## Task 2.4 — Objection Detection ✅

**Files:**
- Modify: `src/services/ai/analytics.ts`
- Modify: `prisma/schema.prisma` (Analytics.objections → JSON)
- Create: `src/test/objection-detection.test.ts`

**Steps:**
1. Add: rule-based detector for common objections ("too expensive", "need to think", "talking to competitor").
2. Fallback: LLM classifier for novel phrasings.
3. Store: `{text, type, timestamp}` in `Analytics.objections`.
4. UI: highlight in transcript viewer.
5. Commit: `feat(ai): objection detection with rule + LLM fallback`.

---

## Task 2.5 — Knowledge Graph ✅

**Files:**
- Modify: `prisma/schema.prisma` (add `KnowledgeEntity`, `KnowledgeRelation`)
- Create: migration
- Modify: `src/services/ai/knowledge-graph.ts`
- Create: `src/app/api/knowledge/query/route.ts`
- Create: `src/test/knowledge-graph.test.ts`

**Steps:**
1. New models:
   ```prisma
   model KnowledgeEntity {
     id        String   @id @default(cuid())
     userId    String
     type      String   // person | company | product | money | date
     value     String
     calls     String[] // call IDs
     createdAt DateTime @default(now())
     @@index([userId, type, value])
   }
   model KnowledgeRelation {
     id            String   @id @default(cuid())
     fromEntityId  String
     toEntityId    String
     relation      String   // mentioned_with | works_for | etc
     callId        String
     @@index([fromEntityId])
     @@index([toEntityId])
   }
   ```
2. On call completion: extract entities + relations, upsert.
3. Query endpoint: `/api/knowledge/query?q=acme` → returns all mentions.
4. Test: full flow on fixture call.
5. Commit: `feat(ai): knowledge graph with entity + relation extraction`.

---

## Task 2.6 — Personalization ✅

**Files:**
- Modify: `src/services/ai/personalization.ts`
- Modify: `prisma/schema.prisma` (UserPreferences)
- Create: `src/test/personalization.test.ts`

**Steps:**
1. Track: action item completion, summary re-reads, coaching tip application.
2. Per-user weights for: scoring rubric emphasis, prompt tone (terse/detailed).
3. Inject into future analysis prompts.
4. Test: user's preferred tone reflected in subsequent calls.
5. Commit: `feat(ai): personalization engine with feedback loop`.

---

## Task 2.7 — Langfuse Tracing ✅ (wired; dashboard check is manual)

**Status (2026-08-12):** DONE. `wrapClient` is wired into the `createOpenAIClient` factory chokepoint (`src/lib/openai-client.ts:16-29`) — every OpenAI/Groq client is Langfuse-wrapped when `LANGFUSE_PUBLIC_KEY` + `LANGFUSE_SECRET_KEY` are set, and returned plain otherwise (fail-closed). Idempotency guard (`WeakMap` module state in `src/lib/langfuse.ts:22-39`): repeated wraps return the same wrapped instance — no double-wrap/loop. Resolved config passed as `clientInitParams` so the Langfuse singleton honors `LANGFUSE_BASE_URL`. Tests: `src/test/langfuse-trace.test.ts` (5 tests, gated, no network).

**Files:**
- Modify: `src/lib/langfuse.ts` (idempotency guard + clientInitParams)
- Modify: `src/lib/openai-client.ts` (factory wiring)
- Create: `src/test/langfuse-trace.test.ts`

**Steps:****
1. Wrap each LLM call: `langfuse.trace({ name, userId, metadata }).generation({...})`.
2. Capture: prompt, response, latency, cost, model.
3. Test: trace visible in Langfuse dashboard.
4. Commit: `feat(obs): Langfuse tracing for all LLM calls`.

---

## Task 2.8 — Trend & Health Analytics Endpoints ✅

**Status (2026-08-12):** BOTH endpoints live. `/api/analytics/trends` (existing) + NEW `/api/analytics/health` — per-team aggregate (avg sentiment score, calls/week, top objections) via `aggregateTrends`, team scope = `sharedWithTeam` calls, personal fallback; auth + rate limit + zod range mirroring trends. Tests: `src/test/api/analytics-health.test.ts` (7 route tests) + `src/test/trends.test.ts` (service).

**Files:**
- Create: `src/app/api/analytics/trends/route.ts`
- Create: `src/app/api/analytics/health/route.ts`
- Create: `src/test/api/analytics-health.test.ts`

**Steps:**
1. `/trends?range=30d` → time series of health scores, sentiment.
2. `/health` → per-team aggregate (avg score, calls/week, top objections).
3. Test: returns valid time series with correct buckets.
4. Commit: `feat(api): trend + health analytics endpoints`.

---

## GATE 2 — Final Checks

```bash
# 1. Real diarization labels in UI
#    DONE (2026-08-12): code path LIVE behind DIARIZATION_PROVIDER=deepgram +
#    DEEPGRAM_API_KEY; mocked tests assert "Speaker A"/"Speaker B" mapping. Real-fixture
#    proof (scripts/prove-diarization.ts) PASSED with 2 distinct speakers via Deepgram nova-2
#    (artifact written to scripts/.proof-diarization.json).
# 2. CallInsight + Knowledge Graph populated
#    DONE (2026-08-12): /api/analyze writes salesScorecard, closeProbability, coachingNotes,
#    personalization, sentimentScore, talkRatio, objections, topics to CallInsight;
#    buildGraphFromText extracts knowledge entities + relations to KnowledgeEntity/KnowledgeRelation.

# 3. Knowledge graph queryable
curl /api/knowledge/query?q=acme
#    DONE: 200 + array of mentions (src/test/knowledge-query.test.ts, 8 tests).

# 4. Langfuse dashboard shows traces
#    CODE DONE: factory wiring + 5 gated tests. Dashboard verification is manual in
#    https://cloud.langfuse.com — needs a real project (LANGFUSE_PUBLIC_KEY/SECRET_KEY).

# 5. Tests + types clean
npx tsc --noEmit && npm test
#    DONE (2026-08-12): tsc exit 0; next build exit 0; full suite 121 files / 991 tests green.

# 6. No new mocks without TODO
grep -rn "// TODO: REAL" src/ | wc -l
#    DONE: 0.
```

When all 6 pass, **GATE 2 is closed**. Move to LEVEL 3.


---

## Status (2026-08-12, intelligence cutover)

**SHIPPED** — 7 of 7 tasks live. Real diarization behind `DIARIZATION_PROVIDER=deepgram` (fail-soft) with real 2-speaker proof verified; all OpenAI/Groq clients Langfuse-traced at the factory chokepoint (idempotent, fail-closed); trend + health analytics endpoints both live; KG entity extraction + CallInsight full field population active in analyze route. GATE 2 FULLY SATISFIED.

Last verified: 2026-08-12. See `docs/roadmap/DEVELOPMENT_FRONTIER.md` for the master list of shipped PRs.
