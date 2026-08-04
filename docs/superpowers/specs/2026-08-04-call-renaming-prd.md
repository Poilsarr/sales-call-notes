# PRD — Call Renaming (Custom Session Titles)

> Feature PRD for Gauge. Supersedes nothing; adds to `SPEC.md` roadmap.
> Status: DRAFT — pending parallel risk-agent findings (see §8).
> Date: 2026-08-04

## 1. Problem

Calls are identified by their raw upload filename everywhere in the product:
`Sample Call_ENG_MA (1).mp3`, `f2983d71-b3b1-4b26-bbc7-23fa72c2b6bf-aAJsl4v0vU79nAmNXIXGXwsbvK27hp.mp3`,
`Live session 1734567890.txt`. These are meaningless at a glance: users cannot
tell which deal a call belongs to without opening it.

## 2. Goal

Let users replace the display name of any call they own with a custom title
(e.g. "Acme Corp — Q3 renewal discovery"), while keeping the original filename
intact as the source-of-truth for the uploaded artifact.

## 3. Non-Goals (v1)

- Team/shared-call renaming by non-owners (owner-only in v1).
- Batch/multi-rename, auto-title suggestions.
- Renaming the underlying blob filename (`audioUrl` untouched).
- Renaming Live sessions / extension recordings at capture time (they get
  filenames at creation; users can rename them afterwards like any call).

## 4. User Stories

| Story | Priority |
|---|---|
| As a user, I can rename a call from the calls list so I can find it at a glance | P0 |
| As a user, I can rename a call from the call detail page header | P1 |
| As a user, I can clear a custom title to revert to the original filename | P1 |
| As a user, I can search for a call by its custom title | P1 |
| As a user, I see the custom title (not the filename) everywhere the call is shown | P1 |
| As a user, my export (CSV) shows the custom title when set | P2 |

## 5. Functional Requirements

### FR-1 Rename (calls list)
- Inline pencil/edit affordance on each call row in `/app/calls`.
- Click → inline input pre-filled with current display name (title or filename),
  Save (Enter) / Cancel (Esc / blur).
- Saves via `PATCH /api/history/[id]` with `{ title }`.

### FR-2 Rename (detail page)
- Pencil next to the title in `/app/calls/[id]` header; same edit pattern.

### FR-3 Validation (server-side, authoritative)
- `title` must be trimmed; length 1–120 characters after trim.
- Empty string / whitespace-only / `null` → **clears** the title (revert to filename).
- Control characters stripped; unicode/emoji allowed.
- Non-string input (number, object, array) → 400.

### FR-4 Display rule
- Everywhere a call name is shown: `title || filename`.

### FR-5 Search
- `/api/calls` search OR-matches `title` and `filename` (case-insensitive).
- Client-side search filter matches `title` too.

### FR-6 Permissions
- Owner-only rename (existing PATCH ownership check). Shared/public calls:
  rename still owner-only in v1; title is visible to everyone who can view.

### FR-7 CSV export
- Exports `title || filename` as the call name column.

## 6. UX Flows

### 6.1 Happy path
1. User opens `/app/calls`, clicks pencil on "Sample Call_ENG_MA (1).mp3".
2. Input appears pre-filled; user types "Acme Corp — Q3 renewal discovery".
3. Enter → optimistic update → PATCH succeeds → row shows new title everywhere.

### 6.2 Clear path
1. User opens edit on a titled call, deletes all text, saves.
2. Title set to `null` → display reverts to filename everywhere.

### 6.3 Failure path
- Network error / 401 / 403 → toast with message; row reverts to pre-edit value.
- Validation error (e.g. >120 chars) → inline error, input stays open.

## 7. Acceptance Criteria (UAT)

- [ ] Rename from list persists after reload and shows on detail page, dashboard,
      team views, performance view, and intelligence mention rows.
- [ ] Clearing the title reverts display to filename everywhere.
- [ ] Searching by the custom title finds the call (server + client search).
- [ ] CSV export uses title when set.
- [ ] Renaming another user's call (if accessible) returns 403.
- [ ] >120 chars or non-string title returns 400 with a clear message.
- [ ] 573 existing tests + new tests pass; `tsc` clean; `next build` green.
- [ ] Prod Neon migration applied before deploy (no title writes before column exists).

## 8. Scenario & Outcome Matrix

> Consolidated from 4 parallel risk-analysis agents (2026-08-04). Full register
> with evidence in TRD §9. This table is the user-visible contract.

| Scenario | Expected outcome |
|---|---|
| Rename from calls list | Pencil → inline input (pre-selected), Enter saves, Esc cancels, row shows title everywhere after reload |
| Pencil inside the row card | Click doesn't navigate to detail (stopPropagation) — editor opens in place |
| Rename with Japanese/Chinese IME | Enter during composition commits the composition, does NOT save |
| Rename while search is active / typing | Editor survives refetch (state keyed by call id, not replaced); typed value preserved |
| Rename then search by the new title | Call found (server search includes title; client filter is null-safe) |
| Rename a call, then view detail / dashboard / team / archived / intelligence | Title shown everywhere (displayName from every serializer); archived rows show title but have no pencil (v1) |
| Rename then share / make public | Share page `<h1>` + browser tab title show the custom title |
| Clear the title (empty / whitespace) | Title becomes null → filename shows everywhere |
| Rename to identical filename | No-op: no PATCH, no `updatedAt` bump |
| 120-char boundary with emoji | Length counted in code points (not UTF-16 units); no lone-surrogate artifacts |
| Title with `=`, `+`, `-`, `@`, quotes, commas | CSV exports sanitize all cells (formula-injection safe); quoting correct |
| Title in Arabic/Hebrew | Input + name cells use `dir="auto"` |
| Long 120-char title | Row name cell truncates; mobile layout holds (min-w-0, 16px input) |
| PATCH 400 / 401 / 403 / 404 / 429 / 500 / network drop | Toast + revert; editor stays open with typed value; no full-page error state |
| Two tabs rename the same call | Last-write-wins; no cross-tab sync (documented limitation, v1) |
| Rename in flight while list refetches | PATCH response merges over fetch result — rename never lost |
| Non-owner (team member) views a shared call | Sees the title; no pencil (rename is owner/team-admin only, server-enforced) |
| Team admin renames a teammate's call | Allowed by existing `canManageCall` semantics (same as assign/DELETE today); UI only exposes pencil on own calls (v1) |
| Rename then delete call | No issue; PATCH after delete → 404 toast |
| Extension / Live-session call | Renamable afterwards like any call; no creation-time title (v1) |
| CRM sync / Slack / email / API v1 after rename | Still use filename (deferred to v2, documented) |
| Schema deployed before migration | Impossible: CI drift gate blocks merge; Vercel build runs `migrate deploy` before build |

## 9. Out of Scope / Deferred

- Team-visible shared renames & collaborative titles (v2).
- Title auto-suggestion from transcript summary (v2).
- Renaming in `/share/[id]` UI (viewers can't edit by design).
