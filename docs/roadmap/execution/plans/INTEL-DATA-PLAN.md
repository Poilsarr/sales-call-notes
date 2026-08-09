# INTEL-DATA-PLAN — Enable competitor context/sentiment on the default path

Arc: Competitive-Intelligence data enabler. UI already shipped (cc234bd).
One concern: data pipeline. No UI files, no DB migration.

## Problem

- Default prompt `b2b-sales.md` schema only has `keyEntities.competitors: ["string"]`.
- Parser already reads `competitorsMentioned` generically:
  - `src/app/api/analyze/route.ts:374-377` (name/context/sentiment), fallback
    `keyEntities.competitors` with null context/sentiment at 378-383.
  - `src/services/ai/analysis.ts:199` `Array.isArray` guard — field tolerated.
  - Type: `src/types/index.ts:94`.
- Result: default-path mentions land as `context: null, sentiment: null` → the
  shipped Deal Risks UI (strict `sentiment === 'negative'`) can never fire.
- Only `enrollment-calls.md:23` declares the field.

## Corrected scope (ground-truthed)

Only `b2b-sales.md` and `sales-meddic.md` have `keyEntities.competitors`
(b2b-sales.md:19, sales-meddic.md:20). `sales-bant.md` and `discovery-calls.md`
have no competitor schema field — NOT in scope (adding a field with zero
instruction support would invent semantics; discovery-calls.md:90 only notes
riskFlags).

## Change set

1. `src/lib/prompts/b2b-sales.md` — after keyEntities close `},` (L22):
   `"competitorsMentioned": [{"name": "competitor name", "context": "what was said about them", "sentiment": "positive|negative|neutral"}],`
   plus edge-case L84 → "Add to keyEntities.competitors **and competitorsMentioned (with context and lowercase sentiment)**".
2. `src/lib/prompts/sales-meddic.md` — same line after keyEntities close (L23).
3. `src/services/ai/analysis.ts:199` — lowercase `sentiment` in normalize map
   (one choke point; UI + Slack + analytics all consume strict lowercase).
4. `src/services/ai/analysis.test.ts` — (a) preservation + lowercase test,
   (b) `expect(result.competitorsMentioned).toEqual([])` in defaults test,
   (c) non-array → `[]` guard test.
5. `src/test/prompt-schema-contract.test.ts` — NEW: `loadPromptTemplate`
   for b2b-sales + sales-meddic contains `competitorsMentioned` and the enum.

Deferred (explicit): speaker/timestamp passthrough (route hardcodes nulls —
defer with diarization), email digest (needs yield/accuracy gates), route-level
tests, sales-bant/discovery-calls competitor semantics, historical-case backfill.

## Waves

- W1 (Executor A): files 1, 2, 5 — prompts + contract test.
- W1 (Executor B): files 3, 4 — normalization + service tests.
- Gate (orchestrator): `npx vitest run`, `REDIS_HOST=disabled REDIS_PORT=0 npx next build`, `git status --short` clean.
- Ship: 3 atomic commits (prompts, core, test), push, docs row.

AI cost impact: <1% per call (+2 schema lines ~140 input tokens).
