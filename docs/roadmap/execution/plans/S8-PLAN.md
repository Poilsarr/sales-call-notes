# S8 — Action items first-class

Source of truth: `docs/roadmap/execution/TRD.md` S8 (lines 73-79) + PRD R8.1-R8.3.

## Scope

| Item | TRD pin |
|---|---|
| R8.1 | `ALTER TABLE "ActionItem" ADD COLUMN IF NOT EXISTS "timestamp" DOUBLE PRECISION` |
| R8.2 | `b2b-sales` prompt gains per-item `timestamp` field; route maps `item.timestamp ?? null`; serializer includes it |
| R8.3 | Review page chips `Jump to 12:34` (seek via existing transcript viewer if it exposes seek); CSV export column appended (existing export path + test update) |

## Grounding problem (why a timestamp field alone is not enough)

The LLM currently sees bare transcript text — no timestamps, no segments
(`src/services/ai/analysis.ts:67,97` user message = `cap(transcript)`). Asking
for a `timestamp` without giving anchor times would produce hallucinated
seconds. Fix: when segments are available, append a compact `[MM:SS]` timeline
anchor to the user message; the prompt tells the model to reference those
anchors. `segments` param is already plumbed through `analyze()` — it only
feeds sentiment/talkRatio today; the route passes `undefined`
(`src/app/api/analyze/route.ts:294`).

## Work packages

### P1 — Backend (migration + prompt + route + serializer)

1. `prisma/schema.prisma` — `ActionItem` gains `timestamp Float?` (after `due`).
2. New migration `prisma/migrations/<today>_action_item_timestamp/migration.sql`:
   idempotent `ALTER TABLE "ActionItem" ADD COLUMN IF NOT EXISTS "timestamp" DOUBLE PRECISION;`
3. `src/services/ai/analysis.ts` — both OpenAI and Groq user-message builders
   (lines ~67, ~97): when `segments?.length`, append `\n\n[timeline]\n` +
   `[MM:SS] <segment text>` lines (cap the whole message via existing `cap()`;
   timeline lines truncated ~100 chars each). Helper `formatTimestamp(seconds)`.
4. `src/lib/prompts/b2b-sales.md` (line ~33) — actionItems schema:
   `"timestamp": number` — seconds from recording start; must match the `[MM:SS]`
   anchors in the transcript; null if unknown. ONLY b2b-sales (TRD pin);
   other templates untouched (normalizer handles absent field).
5. `src/app/api/analyze/route.ts:294` — pass `finalSegments.length ? finalSegments : undefined`
   as the `segments` argument (finalSegments = `{speaker, text, start, end}`,
   built at lines 255-267).
6. `src/app/api/analyze/route.ts` normalize block (~336-349) — map
   `timestamp: item.timestamp ?? null` into the actionItems persist shape.
7. Serializer: verify `/api/history/[id]` (select at line 21 `actionItems: true`
   returns full rows — confirm no field strip-map drops it) and `/api/action-items`
   routes include `timestamp`; manual create/update zod: optional `timestamp`.

### P2 — UI + CSV

8. `src/components/transcript-viewer.tsx` — expose imperative `seekTo(seconds)`:
   forwardRef + ref on scroll container; find nearest segment by timestamp,
   `scrollIntoView({ behavior: 'smooth', block: 'center' })`. Viewer is client
   component already. Fallback when no timestamps: keep today's behavior.
9. `src/components/analysis-panel.tsx` — when `item.timestamp != null`, render
   chip `Jump to MM:SS` (calls new optional `onSeek(timestamp)` prop).
10. `src/app/app/calls/[id]/page.tsx` — pass `timestamp` in the actionItems
    mapping (~line 319-323); wire `onSeek` to the transcript viewer ref.
11. CSV export `src/app/app/calls/page.tsx` — append timestamp column to the
    action-items export (find exact existing headers/escaping, follow them).
    TRD: "existing export path + test update".

### Tests (spread across P1/P2)

- `analysis` service: segments provided → user message contains `[MM:SS]` anchors.
- analyze route: normalize maps `item.timestamp ?? null` (null-safe when LLM omits).
- CSV: timestamp column present in export rows.
- history/action-items: timestamp passes through serialization.
- Existing ActionItem tests still green (optional field → no break).

## Verification

1. `npx tsc --noEmit` green
2. `npx vitest run` full green
3. `REDIS_HOST=disabled REDIS_PORT=0 npx next build > /tmp/build.log 2>&1; echo "exit=$?"` → 0
4. Smoke on 3104: home 200, `/api/team` 401

## Out of scope

- Diarized (speaker-labeled) persisted transcript — finalSegments already exist
  in-route; no DB change.
- Other prompt templates (recruiter-fit, meddic, etc.).
- Webhook payloads / CRM formatter (task/owner/due contract untouched).
