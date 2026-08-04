# TRD — Call Renaming (Custom Session Titles)

> Technical companion to `2026-08-04-call-renaming-prd.md`.
> Status: DRAFT — agent findings pending (§9).
> Date: 2026-08-04

## 1. Data Model

```prisma
model Call {
  // existing…
  filename String   // unchanged — source of truth for the artifact
  title    String?  // NEW — nullable, no default, no unique
  // existing…
}
```

Migration (Neon, additive, zero-downtime):

```sql
ALTER TABLE "Call" ADD COLUMN "title" TEXT;
```

- No backfill, no index (list queries don't filter by title yet; search OR-matches
  text contains — a btree index on title adds nothing for `contains`, skip).
- `prisma migrate dev --name add_call_title` locally; `prisma migrate deploy`
  against prod **before** deploying code that writes `title`.

## 2. API Contract

### 2.1 `PATCH /api/history/[id]` — extend existing route

Request body (currently `{ sharedWithTeam, assigneeId }`):
```json
{ "title": "Acme Corp — Q3 renewal discovery" }
// or { "title": null } / { "title": "" } to clear
```

Behavior:
- Ownership check unchanged (route currently enforces caller == owner; shared
  calls remain owner-only for title writes in v1).
- Validate: `typeof title === 'string' || title === null`; trim; strip control
  chars; length 1–120 when non-empty; `null`/empty/whitespace → store `null`.
- Response: `{ title: string | null }` (or full updated call — pick one; see
  existing route shape).

### 2.2 Read surfaces — return `title`

All call-list/read endpoints must include `title` and/or a computed
`displayName: title || filename`:
- `GET /api/calls` (+ `?q=` search → OR-match title)
- call detail / `GET /api/history/[id]`
- insight payloads used by intelligence mention rows (`call.filename` currently)

Decision (recommended): compute `displayName` server-side in each read path and
return it alongside `title`; UI renders `displayName` directly — no per-site
`title || filename` fallback logic to forget.

## 3. Server-Side Validation (single shared util)

`src/lib/call-title.ts`:

```ts
export const TITLE_MAX_LENGTH = 120;
export function validateTitle(input: unknown): { ok: true; value: string | null }
                                        | { ok: false; error: string };
```

- `null` → `{ ok: true, value: null }` (clear)
- non-string → `{ ok: false }` (400)
- trim; strip `[\u0000-\u001F\u007F]`; length 1..120 → `{ ok: true, value }`
- empty after trim → `{ ok: true, value: null }`

## 4. Coverage Matrix (display surfaces)

Every site that renders a call name; must switch to `displayName`:

| # | Surface | File | Current |
|---|---|---|---|
| 1 | Home dashboard list | `src/app/app/page.tsx:228` | filename |
| 2 | Calls list (table view) | `src/app/app/calls/page.tsx:230` | filename |
| 3 | Calls list (list view) | `src/app/app/calls/page.tsx:384` | filename |
| 4 | Calls CSV export | `src/app/app/calls/page.tsx:147` | filename |
| 5 | Calls client-side search | `src/app/app/calls/page.tsx:137` | filename |
| 6 | Dashboard list | `src/app/dashboard/page.tsx:399,595` | filename |
| 7 | Team calls | `src/app/team/page.tsx:436` | filename |
| 8 | Team performance | `src/app/team/performance/page.tsx:219` | filename |
| 9 | Intelligence mention rows | `src/app/app/intelligence/page.tsx:329` | filename |
| 10 | Server search | `src/app/api/calls/route.ts:50` | filename contains |
| 11 | Call detail page | `src/app/app/calls/[id]/page.tsx` | title (new header edit) |
| 12 | Share page | `src/app/share/[id]/page.tsx` | summary (no name shown today) |

## 5. API Route Changes

- `src/app/api/history/[id]/route.ts` — accept `title` in body; run
  `validateTitle`; add to `prisma.update`; return it. Do NOT touch
  sharedWithTeam/assigneeId behavior.
- `src/app/api/calls/route.ts:50` — search `OR: [{ filename: { contains } }, { title: { contains } }]`.
- Read endpoints: include `title` in select/include; compute displayName.

## 6. UI Component Plan

- `src/components/call-title-editor.tsx` (new, client): inline rename input —
  pencil toggle, Enter save, Esc cancel, error display, optimistic update with
  revert on failure. Reused by calls list + detail header.
- Calls list: wire pencil per row → editor.
- Detail header: pencil → editor.
- All name renders: `call.displayName` (from API) — no local fallback needed.

## 7. Test Plan

- `src/test/api/history-title.test.ts` — PATCH title: set / clear / 400 non-string /
  401 unauth / 403 non-owner / 120-char boundary / control chars stripped.
- `src/test/api/calls-search.test.ts` — search matches title (case-insensitive),
  displayName present in responses.
- `src/lib/call-title.test.ts` — unit tests for validateTitle incl. unicode,
  whitespace-only, max length.
- Component-level: inline editor save/cancel/error states (existing patterns in
  `src/test/` — follow whichever framework the repo uses, e.g. vitest + RTL if present).

## 8. Rollout & Migration Order

1. Add column to schema + migration (local).
2. Deploy migration to prod Neon (`prisma migrate deploy` / manual SQL).
3. Ship code (PATCH + displayName + UI) — same or next deploy, column exists first.
4. UAT checklist from PRD §7.

## 9. Risk Register & Agent Findings

> Consolidated from 4 parallel risk-analysis agents (data/API/infra, surface
> coverage, security/permissions, UX/edge cases) — 2026-08-04. Severity is the
> risk if mishandled. Every HIGH must map to a task in the executable plan.

### 9.1 HIGH — must fix in v1

| # | Finding | Evidence | Handling (locked) |
|---|---|---|---|
| H1 | Calls page actually queries `/api/history` (not `/api/calls`). Its `normalized` map (`route.ts:60-76`) omits new fields → renames never show in the main list. | `history/route.ts:60-76`, `calls/page.tsx:88-123` | Add `title` + `displayName` to history `normalized` map + both search routes |
| H2 | PATCH route destructures body raw (`route.ts:125`) with zero validation; a naive `data: { title }` spread would **wipe title to null on every unrelated PATCH** (collaboration toggles from detail page). | `history/[id]/route.ts:125,143-144` | Zod schema + `...(title !== undefined ? { title } : {})` guard, mirroring `assigneeId` |
| H3 | Search misses renamed calls: `/api/history` `OR` (line 37), `/api/calls` `OR` (line 50), and client defensive filter (`calls/page.tsx:137`) match filename/transcript/summary only. | `history/route.ts:34-42`, `calls/route.ts:49-53`, `calls/page.tsx:135-142` | Add `{ title: { contains, mode: 'insensitive' } }` to all three (client: null-safe `(call.title || '')`) |
| H4 | Upstash caches serve stale names: `GET /api/calls` 60s cache (`route.ts:40-44,67-68`), `GET /api/calls/[id]` 300s cache (`[id]/route.ts:51`). `cacheDel` exists but has zero prod call sites. | `calls/route.ts`, `calls/[id]/route.ts`, `lib/cache.ts:36` | PATCH calls `cacheDel` on both keys after successful title write |
| H5 | Pencil button would sit inside a full-row `<Link>` (`calls/page.tsx:376-415`) — click navigates, editor dies. Also detail page currently renders **no name at all** — header editor is new UI. | `calls/page.tsx:376-415`, `[id]/page.tsx:20-41` | `onClick` with `stopPropagation()` + `preventDefault()`; new header block on detail |
| H6 | CSV injection: exports quote-escape summary but NOT filename (`calls/page.tsx:147`), and nothing strips leading `= + - @`; `POST /api/history` already stores raw filename/summary (pre-existing entry point). Title would flow into the same builders. | `calls/page.tsx:144-157`, `team/performance/page.tsx:75-102`, `history/route.ts:104-121` | Shared `sanitizeCsvCell()` (strip leading `=+-\t\r@` → prefix `'`, escape quotes) applied to all user fields in both CSVs; title sanitized at API boundary too |
| H7 | IME composition: Enter commits composition (Japanese/Chinese); zero `isComposing` checks in repo. Naive Enter-to-save corrupts mid-composition. | (no precedent in repo) | `e.nativeEvent.isComposing` check before save |
| H8 | Keystroke search refetch (`calls/page.tsx:88-123`, no debounce) can unmount the editor mid-edit and a stale response (no title) can clobber optimistic rename state. | `calls/page.tsx:88-123,107` | Editor state lives outside fetched rows (map by id); apply PATCH response over fetch results; single `editingId` |

### 9.2 MED — handle in v1

| # | Finding | Evidence | Handling |
|---|---|---|---|
| M1 | PATCH response omits title → client can't apply result without refetch. | `history/[id]/route.ts:153-156` | Return `{ title, displayName }` alongside existing fields; client merges |
| M2 | Team ADMIN can manage (rename/delete) private teammate calls (`canManageCall` ignores `sharedWithTeam`). | `lib/call-access.ts:24-33` | **v1 decision: keep existing gate** (owner OR team-admin) — same semantics as DELETE/assignee; do NOT change `canManageCall` in this feature (scope). UI shows pencil only on own calls (history list is own). Documented |
| M3 | Archived tab serializes narrow select `{ id, filename, createdAt, ... }` → rename invisible in archived. Pencil on archived rows? | `calls/archived/route.ts:17-23`, `calls/page.tsx:212-249` | Add `title` + displayName to archived serializer. **Hide pencil on archived rows** (restore-rename-restore cycle; keep v1 simple) |
| M4 | Emoji length: `.slice(120)` splits surrogate pairs (lone-surrogate �); `.length` counts UTF-16 units, `"😀".repeat(120)` = 240. | — | Count/slice by **code points** (`[...s].length`), client + server identical rule |
| M5 | `title` = whitespace-only → must clear (trim server-side; curl bypass of client trim). | — | `validateTitle`: null / empty / whitespace-only → `null` |
| M6 | Long titles wrap and break row layout; no `truncate`/`line-clamp` in rows; mobile needs `min-w-0`. | `calls/page.tsx:378-413` | Add `truncate` + `min-w-0` to name cells; 16px input on mobile |
| M7 | Share page (server-rendered, public) shows filename in `<h1>` + `<title>` metadata; select excludes title. | `share/[id]/page.tsx:15-21,57` | Add `title: true` to select; render `title || filename` in both |
| M8 | RTL titles (Arabic/Hebrew) break cursor behavior. | — | `dir="auto"` on input + name cells |
| M9 | No-op rename (title === filename) still bumps `@updatedAt`. | — | Skip PATCH when normalized title equals existing; return current state |
| M10 | 429/500/400/403/404 failure UX: detail page `setError` replaces whole page — must NOT reuse for rename. | `[id]/page.tsx:131-132,175-195` | Toast + revert everywhere; keep editor open with value on failure |
| M11 | Chat RAG/sidebar renders `filename` (`chat/route.ts:45,76`, `knowledge-graph.ts:78-85`, `chat-sidebar.tsx:12,98`) | — | In scope: add title to KG select + displayName in chat response + sidebar render |

### 9.3 LOW / deferred (documented, not in v1)

| # | Finding | Decision |
|---|---|---|
| L1 | CRM propagation: `crm/formatter.ts:10,87,122`, `hubspot.ts:82`, `salesforce.ts:60,80`, `teams.ts:20,66`, `worker.ts:114`, sync-crm routes | **Defer** — CRM/Slack/email keep filename (v2). Document in PRD |
| L2 | Slack/email templates (`slack.ts`, `email.ts:47-53`, `analyze/route.ts:429,436`) | Defer (v2) |
| L3 | Public API v1 (`v1/calls/route.ts:74`) + api-docs sample | Defer (v2); note in api-docs changelog |
| L4 | GDPR export completeness (`gdpr-export.ts:27-37`, schemaVersion asserted in test) | Defer (v2) |
| L5 | Rate limit: `/api/*` 100 req/min/IP, no Retry-After header, fails open without Upstash; keystroke search burns bucket (pre-existing) | Out of scope; document |
| L6 | `req.json()` unguarded on PATCH (malformed → 500) | Fold into H2 (zod `.catch` or try/catch → 400) |
| L7 | Extension/live-created calls: no title at creation (filename only) | Out of scope; optional future: seed title from `meetingTitle` |
| L8 | Unguarded `auth()` in `calls/[id]/share/route.ts:8` (pre-existing, likely always 401s) | Separate bug, out of scope; note in frontier doc |

### 9.4 Migration & release order (verified)

1. Edit `prisma/schema.prisma` (`title String?` near `filename`).
2. `npx prisma migrate dev --name add_call_title` — **verify `DATABASE_URL` resolution first** (`.env`/`.env.local` may point at prod Neon — use `--create-only` and hand-inspect the SQL if unsure); migration file must land in the **same commit** as the schema edit (CI drift gate `scripts/check-schema-drift.ts` fails otherwise).
3. Every Vercel build runs `prisma migrate deploy` (vercel.json) — column ships at build; additive nullable = metadata-only on Neon, no downtime.
4. Code deploy after column exists.

### 9.5 Files that MUST change (final list)

Schema/types: `prisma/schema.prisma` + new `prisma/migrations/*/migration.sql` · `src/types/index.ts` (`CallRecord`, `CompetitorMention.call`) · inline client types in `calls/page.tsx`, `app/page.tsx`, `dashboard/page.tsx`, `team/page.tsx`, `team/performance/page.tsx`, `intelligence/page.tsx`, `chat-sidebar.tsx`.

New files: `src/lib/call-title.ts` (validateTitle + CSV cell sanitizer `sanitizeCsvCell`) · `src/components/call-title-editor.tsx`.

API: `src/app/api/history/[id]/route.ts` (PATCH: zod, guard, cacheDel, response) · `src/app/api/history/route.ts` (map + search) · `src/app/api/calls/route.ts` (search) · `src/app/api/calls/archived/route.ts` · `src/app/api/analytics/route.ts` · `src/app/api/team/route.ts` · `src/app/api/team/performance/route.ts` · `src/app/api/competitive-intelligence/route.ts` · `src/app/api/chat/route.ts` · `src/services/ai/knowledge-graph.ts` (title in select).

Render: `src/app/app/calls/page.tsx` (editor + displayName + CSV) · `src/app/app/calls/[id]/page.tsx` (title state + header editor) · `src/app/app/page.tsx` · `src/app/dashboard/page.tsx` · `src/app/team/page.tsx` · `src/app/team/performance/page.tsx` (CSV too) · `src/app/app/intelligence/page.tsx` · `src/components/chat-sidebar.tsx` · `src/app/share/[id]/page.tsx`.

Tests: `src/lib/call-title.test.ts` · `src/test/api/history-title.test.ts` · `src/test/api/calls-search-title.test.ts` · CSV sanitizer cases · cache invalidation case (follow `src/test/cache.test.ts` pattern).
