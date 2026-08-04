# Call Renaming (Custom Session Titles) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users replace a call's display name with a custom title (≤120 code points, nullable) — persisted in a new `Call.title` column, exposed as `displayName` (title || filename) across every render surface and search path.

**Architecture:** Additive nullable column + one PATCH extension (zod-validated, guarded spread) + `displayName` computed server-side in every serializer; a shared `call-title-editor` component reused on the calls list and detail page; cache invalidation on rename; CSV cell sanitizer fixes a pre-existing formula-injection gap on exports.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Prisma 5.12 + Neon, Upstash Redis cache, Tailwind, vitest (tests in `src/test/api/` and colocated `*.test.ts`), sonner toasts.

**Specs:** `docs/superpowers/specs/2026-08-04-call-renaming-prd.md` · `docs/superpowers/specs/2026-08-04-call-renaming-trd.md` (risk register §9 is authoritative; every HIGH maps to a task here).

**Reference files to read first:**
- `src/app/api/history/[id]/route.ts` (PATCH at :109-160)
- `src/app/api/history/route.ts` (search :34-42, map :60-76)
- `src/app/api/calls/route.ts` (search :49-53, cache :40-68)
- `src/app/app/calls/page.tsx` (fetch :88-123, filter :135-142, CSV :144-157, rows :370-417)
- `src/lib/cache.ts` (makeCacheKey/cacheDel)
- `src/app/app/calls/[id]/page.tsx` (CallData :20-41, setData :64-81, updateCollaboration :107-136)

---

## Task 0: Preflight — verify migration target + baseline

- [ ] **Step 1: Confirm where `DATABASE_URL` resolves**

Run: `grep -l "DATABASE_URL" .env .env.local 2>/dev/null; printenv DATABASE_URL | head -c 40`

Expected: Note whether it points at the Neon production DB. If unsure, set `SHADOW_DATABASE_URL` (scratch Neon branch) or use `--create-only` in Task 1 and hand-inspect the SQL. **Do not run `prisma migrate dev` blind — it applies to whatever `DATABASE_URL` points at.**

- [ ] **Step 2: Baseline gate**

Run: `npx vitest run && npx tsc --noEmit`

Expected: 573+ tests pass, no TS errors. Record the count; it must not regress.

---

## Task 1: Schema + migration

**Files:**
- Modify: `prisma/schema.prisma` (Call model, near `filename` line 77)
- Create: `prisma/migrations/<timestamp>_add_call_title/migration.sql`

- [ ] **Step 1: Edit schema**

In `prisma/schema.prisma`, add after `filename String`:

```prisma
  filename           String
  title              String?
```

- [ ] **Step 2: Generate migration (create-only, hand-verified)**

Run: `npx prisma migrate dev --create-only --name add_call_title`

Open the generated `prisma/migrations/<timestamp>_add_call_title/migration.sql` and confirm it contains exactly:

```sql
-- AlterTable
ALTER TABLE "Call" ADD COLUMN "title" TEXT;
```

- [ ] **Step 3: Apply locally**

Run: `npx prisma migrate dev --name add_call_title` (or `npx prisma migrate deploy` if step 2 already applied it)

Expected: `Migration <name> applied successfully` and `npx prisma generate` runs (postinstall does this, but run it explicitly if schema drift check complains).

- [ ] **Step 4: Verify drift gate passes (CI enforces schema==migrations)**

Run: `npx tsx scripts/check-schema-drift.ts`

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(calls): add nullable title column for call renaming"
```

---

## Task 2: Validation + CSV sanitizer lib (TDD)

**Files:**
- Create: `src/lib/call-title.ts`
- Create: `src/lib/call-title.test.ts`

- [ ] **Step 1: Write the failing tests** — `src/lib/call-title.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { validateTitle, sanitizeCsvCell, countCodePoints } from '@/lib/call-title';

describe('validateTitle', () => {
  it('accepts a trimmed string', () => {
    expect(validateTitle('  Acme Q3 renewal  ')).toEqual({ ok: true, value: 'Acme Q3 renewal' });
  });
  it('returns null for null / undefined / empty / whitespace-only', () => {
    expect(validateTitle(null)).toEqual({ ok: true, value: null });
    expect(validateTitle(undefined)).toEqual({ ok: true, value: null });
    expect(validateTitle('')).toEqual({ ok: true, value: null });
    expect(validateTitle('   ')).toEqual({ ok: true, value: null });
  });
  it('rejects non-strings', () => {
    expect(validateTitle(123).ok).toBe(false);
    expect(validateTitle(['x']).ok).toBe(false);
    expect(validateTitle({}).ok).toBe(false);
  });
  it('strips control characters', () => {
    expect(validateTitle('a\u0000b\u0007c').value).toBe('abc');
    expect(validateTitle('a\nb\tc').value).toBe('abc');
  });
  it('rejects >120 code points (emoji count as 1 each)', () => {
    expect(validateTitle('😀'.repeat(120)).ok).toBe(true);
    expect(validateTitle('😀'.repeat(121)).ok).toBe(false);
  });
});

describe('sanitizeCsvCell', () => {
  it('escapes double quotes', () => {
    expect(sanitizeCsvCell('say "hi"')).toBe('say ""hi""');
  });
  it('prefixes formula-starting cells with a quote', () => {
    for (const s of ['=cmd()', '+SUM(A1)', '-2+3', '@x', '\t=1']) {
      expect(sanitizeCsvCell(s).startsWith("'")).toBe(true);
    }
  });
  it('handles null/undefined as empty', () => {
    expect(sanitizeCsvCell(null)).toBe('');
    expect(sanitizeCsvCell(undefined)).toBe('');
  });
});

describe('countCodePoints', () => {
  it('counts emoji as one code point', () => {
    expect(countCodePoints('😀😀')).toBe(2);
    expect(countCodePoints('a😀b')).toBe(3);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/lib/call-title.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement** — `src/lib/call-title.ts`:

```ts
export const TITLE_MAX_LENGTH = 120;

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;
const CSV_FORMULA_START = /^[=+\-@\t\r]/;

export function countCodePoints(s: string): number {
  return Array.from(s).length;
}

export function sanitizeTitleText(input: string): string {
  return input.replace(CONTROL_CHARS, '').trim();
}

export type TitleValidation =
  | { ok: true; value: string | null }
  | { ok: false; error: string };

export function validateTitle(input: unknown): TitleValidation {
  if (input === null || input === undefined) return { ok: true, value: null };
  if (typeof input !== 'string') {
    return { ok: false, error: 'title must be a string or null' };
  }
  const cleaned = sanitizeTitleText(input);
  if (cleaned.length === 0) return { ok: true, value: null };
  if (countCodePoints(cleaned) > TITLE_MAX_LENGTH) {
    return { ok: false, error: `Title must be ${TITLE_MAX_LENGTH} characters or fewer` };
  }
  return { ok: true, value: cleaned };
}

export function sanitizeCsvCell(value: unknown): string {
  const escaped = String(value ?? '').replace(/"/g, '""');
  if (CSV_FORMULA_START.test(escaped)) return `'${escaped}`;
  return escaped;
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/lib/call-title.test.ts`

Expected: 13 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/call-title.ts src/lib/call-title.test.ts
git commit -m "feat(calls): title validation + CSV cell sanitizer"
```

---

## Task 3: PATCH /api/history/[id] — write path (TDD)

**Files:**
- Modify: `src/app/api/history/[id]/route.ts` (PATCH :109-160)
- Create: `src/test/api/history-title.test.ts`
- Modify: `src/types/index.ts` (CallRecord)

- [ ] **Step 1: Add `title`/`displayName` to CallRecord type** — `src/types/index.ts` (CallRecord at :134-149): add after `filename`:

```ts
  title?: string | null;
  displayName?: string;
```

- [ ] **Step 2: Write the failing integration tests** — `src/test/api/history-title.test.ts`. Follow the exact pattern of `src/test/competitive-intelligence-route.test.ts` (read it first): `vi.hoisted` mocks for `authMock`, `prisma.call.findUnique`, `prisma.user.findUnique`, `prisma.call.update`; `vi.mock('@clerk/nextjs/server')` → `{ auth: authMock }`; `vi.mock('@/lib/prisma')` → `{ default: { call: {...}, user: {...} } }`; also `vi.mock('@/lib/cache')` → `{ cacheDel: cacheDelMock, makeCacheKey: (p, ...parts) => ['cache', p, ...parts].join(':') }`; then `import { PATCH } from '@/app/api/history/[id]/route'` and call `PATCH(new Request('http://x/api/history/call_1', { method: 'PATCH', body: JSON.stringify(...) }), { params: { id: 'call_1' } })`. Set `authMock` → `{ userId: 'user_1' }`, `getUserByClerkId` via the real `src/lib/call-access` path by mocking `@/lib/call-access`'s `getUserByClerkId` (or mock the prisma user query) so `canManageCall` passes for the owner case. Use the `req.json()`-safe request builder as the route expects a Request.

Test bodies (exact assertions):

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth() to return a fixed userId; mock getUserByClerkId to return a
// viewer; mock prisma.call.findUnique to return { id, userId, teamId: null,
// sharedWithTeam: false }; capture prisma.call.update args.

describe('PATCH /api/history/[id] title', () => {
  beforeEach(() => vi.resetModules());

  it('stores a validated title and returns title + displayName', async () => {
    // PATCH { title: '  Acme renewal  ' } → expect update called with
    // { title: 'Acme renewal' }; expect response json { title: 'Acme renewal',
    // displayName: 'Acme renewal', ... }
  });

  it('clears title with null / empty string', async () => {
    // PATCH { title: '' } → update called with { title: null }
  });

  it('returns 400 for non-string title', async () => {
    // PATCH { title: 123 } → 400
  });

  it('returns 400 for >120 code points', async () => {
    // PATCH { title: '😀'.repeat(121) } → 400
  });

  it('leaves title untouched when body omits it (guarded spread)', async () => {
    // PATCH { sharedWithTeam: true } → update data has NO title key
  });

  it('returns 401 unauth / 403 non-owner', async () => {
    // unauth → 401; viewer not owner/team-admin → 403
  });

  it('invalidates the detail cache key after a successful rename', async () => {
    // assert cacheDel called with makeCacheKey('calls', userId, callId)
  });
});
```

- [ ] **Step 3: Run to verify they fail**

Run: `npx vitest run src/test/api/history-title.test.ts`

Expected: FAIL — route doesn't accept title yet.

- [ ] **Step 4: Implement PATCH changes** — `src/app/api/history/[id]/route.ts`:

Add imports at top:

```ts
import { validateTitle } from '@/lib/call-title';
import { cacheDel, makeCacheKey } from '@/lib/cache';
```

Replace the body-parsing + update block (`:125-156`) with:

```ts
    const body = await req.json().catch(() => ({}));
    const { sharedWithTeam, assigneeId, title } = body;
    if (sharedWithTeam === true && !call.teamId) {
      return NextResponse.json({ error: 'Only team calls can be shared' }, { status: 400 });
    }

    const titleValidation = validateTitle(title);
    if (!titleValidation.ok) {
      return NextResponse.json({ error: titleValidation.error }, { status: 400 });
    }

    let nextAssigneeId = assigneeId;
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
      if (!assignee || assignee.teamId !== call.teamId) {
        return NextResponse.json({ error: 'Assignee must be on the same team' }, { status: 400 });
      }
    }

    if (assigneeId === null) nextAssigneeId = null;

    const updated = await prisma.call.update({
      where: { id: params.id },
      data: {
        ...(typeof sharedWithTeam === 'boolean' ? { sharedWithTeam } : {}),
        ...(assigneeId !== undefined ? { assigneeId: nextAssigneeId } : {}),
        ...(title !== undefined ? { title: titleValidation.value } : {}),
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Invalidate cached GET /api/calls/[id] (300s TTL). The list cache
    // (60s, query-parameterized) self-expires; accept ≤60s staleness there.
    await cacheDel(makeCacheKey('calls', clerkUserId, params.id));

    return NextResponse.json({
      sharedWithTeam: updated.sharedWithTeam,
      assignee: updated.assignee,
      title: updated.title,
      displayName: updated.title || updated.filename,
    });
```

Note: the catch block's 500 message stays; malformed JSON now yields 400 paths per-field instead of a generic 500.

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/test/api/history-title.test.ts`

Expected: all 7 PASS. Then `npx tsc --noEmit` — clean.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/history/[id]/route.ts src/test/api/history-title.test.ts src/types/index.ts
git commit -m "feat(calls): PATCH title write path + validation + cache invalidation"
```

---

## Task 4: Read serializers + search (server)

**Files:**
- Modify: `src/app/api/history/route.ts` (map :60-76, search :34-42)
- Modify: `src/app/api/calls/route.ts` (search :49-53)
- Modify: `src/app/api/calls/archived/route.ts` (select :17-23, map :30)
- Modify: `src/app/api/analytics/route.ts` (select :48, map :149)
- Modify: `src/app/api/team/route.ts` (map :64)
- Modify: `src/app/api/team/performance/route.ts` (map :38)
- Modify: `src/app/api/competitive-intelligence/route.ts` (select :125)
- Modify: `src/app/api/chat/route.ts` (relevantCalls :76) + `src/services/ai/knowledge-graph.ts` (select :78-85)
- Modify: `src/app/share/[id]/page.tsx` (select :15, h1 :57, metadata :21)
- Create: `src/test/api/calls-search-title.test.ts`

- [ ] **Step 1: history route — search + map** — `src/app/api/history/route.ts`:

Search OR (around :36-40): add a title clause to the existing OR array:

```ts
{ title: { contains: query, mode: 'insensitive' as const } },
```

Normalized map (around :60-76): add to each mapped call:

```ts
title: c.title,
displayName: c.title || c.filename,
```

- [ ] **Step 2: calls route — search** — `src/app/api/calls/route.ts` at :50, same OR clause:

```ts
{ title: { contains: query, mode: 'insensitive' as const } },
```

- [ ] **Step 3: archived route** — `src/app/api/calls/archived/route.ts`: add `title: true` to the select and `title` + `displayName: call.title || call.filename` to the response map.

- [ ] **Step 4: analytics route** — `src/app/api/analytics/route.ts`: add `title: true` to the select at :48; in the map at :149 add `title: c.title, displayName: c.title || c.filename`.

- [ ] **Step 5: team + performance routes** — `src/app/api/team/route.ts` (:64) and `src/app/api/team/performance/route.ts` (:38): add `title` + `displayName: call.title || call.filename` to the mapped call objects (selects there are full records — verify, add `title: true` if a narrow select exists).

- [ ] **Step 6: competitive-intelligence route** — `src/app/api/competitive-intelligence/route.ts` (:125): add `title: true` to the call select; in the mention map add `call: { ...call, displayName: call.title || call.filename }` (or add displayName to the mapped mention call object).

- [ ] **Step 7: chat RAG** — `src/services/ai/knowledge-graph.ts` (select :78-85): add `title: true`; in `src/app/api/chat/route.ts` (:76) map `displayName: c.title || c.filename` for `relevantCalls`.

- [ ] **Step 8: share page** — `src/app/share/[id]/page.tsx`: add `title: true` to the prisma select (:15); render `{call.title || call.filename}` in the `<h1>` (:57) and in `generateMetadata` `<title>` (:21).

- [ ] **Step 9: Write search tests** — `src/test/api/calls-search-title.test.ts`:

```ts
// Mock prisma.call.findMany; PATCH a title, then GET /api/history?q=<title>.
// Assert findMany was called with an OR array containing
// { title: { contains: <title>, mode: 'insensitive' } }.
// Also assert history + archived + analytics responses include
// title and displayName fields.
```

- [ ] **Step 10: Run tests + typecheck**

Run: `npx vitest run src/test/api/calls-search-title.test.ts && npx tsc --noEmit`

Expected: PASS, clean.

- [ ] **Step 11: Commit**

```bash
git add src/app/api/history/route.ts src/app/api/calls/route.ts src/app/api/calls/archived/route.ts src/app/api/analytics/route.ts src/app/api/team/route.ts src/app/api/team/performance/route.ts src/app/api/competitive-intelligence/route.ts src/app/api/chat/route.ts src/services/ai/knowledge-graph.ts src/app/share/[id]/page.tsx src/test/api/calls-search-title.test.ts
git commit -m "feat(calls): expose title/displayName in all read serializers + title search"
```

---

## Task 5: Client search + CSV exports (TDD)

**Files:**
- Modify: `src/app/app/calls/page.tsx` (types :10-27, filter :137, CSV :144-157)
- Modify: `src/app/team/performance/page.tsx` (CSV :75-102)

- [ ] **Step 1: Extend client types** — `src/app/app/calls/page.tsx`:

```ts
interface CallEntry {
  id: string;
  filename: string;
  title?: string | null;
  displayName?: string;
  // …existing fields unchanged
}

interface ArchivedEntry {
  id: string;
  filename: string;
  title?: string | null;
  displayName?: string;
  createdAt: string;
}
```

- [ ] **Step 2: Null-safe client search filter** — replace the filename/summary predicate (:137-140) with:

```ts
const query = searchQuery.toLowerCase();
const matches = (c: CallEntry | ArchivedEntry) =>
  (c.filename || '').toLowerCase().includes(query) ||
  (c.title || '').toLowerCase().includes(query) ||
  (c.summary || '').toLowerCase().includes(query);
```

- [ ] **Step 3: CSV — sanitize every cell + use displayName** — replace the CSV builder (:144-157):

```ts
const header = `Name,Date,Health Score,Sentiment,Action Items,Summary`;
const rows = calls.map((c) =>
  [
    sanitizeCsvCell(c.displayName ?? c.filename),
    sanitizeCsvCell(new Date(c.createdAt).toLocaleDateString()),
    sanitizeCsvCell(c.healthScore ?? ''),
    sanitizeCsvCell(c.sentiment ?? ''),
    sanitizeCsvCell(c.actionItems.length),
    sanitizeCsvCell(c.summary ?? ''),
  ].join(',')
);
```

(Add `import { sanitizeCsvCell } from '@/lib/call-title';` — replaces the previous manual `replace(/"/g, '""')` and the unescaped filename.)

- [ ] **Step 4: Performance CSV** — `src/app/team/performance/page.tsx` (:75-102): same treatment — `sanitizeCsvCell(call.displayName ?? call.filename)` and sanitize the other user-influenced fields (summary, sentiment); keep column order identical otherwise.

- [ ] **Step 5: Run tests + typecheck**

Run: `npx vitest run && npx tsc --noEmit`

Expected: all pass, clean (sanitizeCsvCell already unit-tested in Task 2).

- [ ] **Step 6: Commit**

```bash
git add "src/app/app/calls/page.tsx" src/app/team/performance/page.tsx
git commit -m "feat(calls): title-aware client search + CSV injection-safe exports"
```

---

## Task 6: Inline rename editor component (TDD)

**Files:**
- Create: `src/components/call-title-editor.tsx`
- Create: `src/components/call-title-editor.test.tsx`

- [ ] **Step 1: Write failing component tests** — `src/components/call-title-editor.test.tsx`. The repo's pattern is `@testing-library/react` with jsdom (`act, render, screen, waitFor` — see `src/components/live-transcription-panel.test.tsx` and setup in `vitest.config.ts` + `src/test/setup.ts`). Follow it exactly.

Key behaviors to cover:
- Pencil button has `aria-label="Rename call"`.
- Clicking pencil calls `onClick` with `preventDefault` + `stopPropagation` (spy on both).
- Enter with `isComposing: true` does NOT save; `isComposing: false` does.
- Esc closes without saving.
- `onSave` resolves true → editor closes; false → stays open.
- Save button disabled while `saving`.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/components/call-title-editor.test.tsx`

Expected: FAIL — component missing.

- [ ] **Step 3: Implement** — `src/components/call-title-editor.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Pencil, X, Check } from 'lucide-react';

interface CallTitleEditorProps {
  displayName: string;
  onSave: (title: string | null) => Promise<boolean>;
  disabled?: boolean;
}

export function CallTitleEditor({ displayName, onSave, disabled }: CallTitleEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setValue(displayName);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, displayName]);

  const close = () => {
    setEditing(false);
    setSaving(false);
  };

  const save = async () => {
    if (saving) return;
    const trimmed = value.trim();
    const next = trimmed.length === 0 ? null : trimmed;
    setSaving(true);
    const ok = await onSave(next);
    setSaving(false);
    if (ok) close();
  };

  if (editing) {
    return (
      <div
        ref={containerRef}
        className="flex items-center gap-2 min-w-0"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close();
        }}
      >
        <input
          ref={inputRef}
          value={value}
          maxLength={120}
          dir="auto"
          aria-label="Call title"
          disabled={saving}
          className="min-w-0 flex-1 rounded-md bg-zinc-800 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-emerald-500/50"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) void save();
            if (e.key === 'Escape') close();
          }}
        />
        <button
          aria-label="Save title"
          disabled={saving}
          className="shrink-0 p-1.5 rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50"
          onClick={() => void save()}
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          aria-label="Cancel"
          disabled={saving}
          className="shrink-0 p-1.5 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
          onClick={close}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      aria-label="Rename call"
      disabled={disabled}
      className="shrink-0 p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setEditing(true);
      }}
    >
      <Pencil className="w-3.5 h-3.5" />
    </button>
  );
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/components/call-title-editor.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/call-title-editor.tsx src/components/call-title-editor.test.tsx
git commit -m "feat(calls): inline call-title editor component"
```

---

## Task 7: Wire editor into calls list + detail page

**Files:**
- Modify: `src/app/app/calls/page.tsx` (state :33-43, rename handler, rows :370-417)
- Modify: `src/app/app/calls/[id]/page.tsx` (CallData :20-41, setData :64-81, header UI)

- [ ] **Step 1: Calls page — rename state + handler** — add to `src/app/app/calls/page.tsx`:

```tsx
const [editingId, setEditingId] = useState<string | null>(null);

const renameCall = async (call: CallEntry, title: string | null) => {
  try {
    const res = await fetch(`/api/history/${call.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Failed to rename (${res.status})`);
    const displayName = data.displayName ?? title ?? call.filename;
    setCalls((prev) =>
      prev.map((c) => (c.id === call.id ? { ...c, title: data.title ?? null, displayName } : c)),
    );
    setEditingId(null);
    toast.success('Call renamed');
    return true;
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to rename call');
    return false;
  }
};
```

- [ ] **Step 2: Calls page — row rendering.** In the active list map (:370-417), wrap each row: when `editingId === call.id`, render the card WITHOUT the `<Link>` wrapper, with the editor in place of the title text; otherwise render the existing `<Link>` card with the pencil beside the title:

```tsx
const displayName = call.displayName ?? call.filename;

// inside the doppel-inner-dark row, next to the title:
<div className="flex items-center gap-2 min-w-0">
  <p className="text-white font-medium truncate">{displayName}</p>
  <CallTitleEditor
    displayName={displayName}
    disabled={editingId !== null && editingId !== call.id}
    onSave={(title) => renameCall(call, title)}
  />
</div>
```

Structure for the editing branch (replace the `<Link>` element when `editingId === call.id`):

```tsx
{editingId === call.id ? (
  <div className="doppel-outer-dark">
    <div className="doppel-inner-dark p-4">
      <CallTitleEditor
        displayName={call.displayName ?? call.filename}
        onSave={(title) => renameCall(call, title)}
      />
    </div>
  </div>
) : (
  <Link href={`/app/calls/${call.id}`}>
    {/* existing card; title cell now includes the pencil via CallTitleEditor */}
  </Link>
)}
```

(Archived tab: no pencil — leave rows untouched.)

- [ ] **Step 3: Detail page — state.** `src/app/app/calls/[id]/page.tsx`: add `title?: string | null; displayName?: string; filename?: string` to `CallData` (:20-41) and map them in `setData` (:64-81) from the GET response. Add a `renameCall` handler mirroring the calls-page one (PATCH → merge `title`/`displayName` into state → toast).

- [ ] **Step 4: Detail page — header editor.** In the header block (where the page title/date renders), show:

```tsx
<div className="flex items-center gap-2">
  <h1 className="text-2xl font-semibold text-white truncate">
    {data.displayName ?? data.filename ?? 'Call Details'}
  </h1>
  <CallTitleEditor
    displayName={data.displayName ?? data.filename ?? 'Call Details'}
    onSave={renameCall}
  />
</div>
```

- [ ] **Step 5: Run tests + typecheck + build**

Run: `npx vitest run && npx tsc --noEmit && npx next build`

Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add "src/app/app/calls/page.tsx" "src/app/app/calls/[id]/page.tsx"
git commit -m "feat(calls): rename UI on calls list + detail header"
```

---

## Task 8: Remaining display surfaces sweep

**Files:** `src/app/app/page.tsx` (:228) · `src/app/dashboard/page.tsx` (:399, :595) · `src/app/team/page.tsx` (:436) · `src/app/team/performance/page.tsx` (:219) · `src/app/app/intelligence/page.tsx` (:329) · `src/components/chat-sidebar.tsx` (:98) (+ their inline `filename` types)

- [ ] **Step 1: For each surface**, add `title?: string | null; displayName?: string` to the inline interface and change the render from `{call.filename}` (or `{c.filename}` / `{mention.call.filename}`) to `{call.displayName ?? call.filename}` (with the matching variable name per file).

- [ ] **Step 2: Typecheck + full gate**

Run: `npx tsc --noEmit && npx vitest run`

Expected: clean, all pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/app/page.tsx src/app/dashboard/page.tsx src/app/team/page.tsx src/app/team/performance/page.tsx src/app/app/intelligence/page.tsx src/components/chat-sidebar.tsx
git commit -m "feat(calls): render displayName across dashboard/team/intelligence/chat"
```

---

## Task 9: Final gate + UAT + docs

- [ ] **Step 1: Full local gate**

Run: `npx vitest run && npx tsc --noEmit && npx next build`

Expected: all green; test count ≥ 573 + new tests.

- [ ] **Step 2: Production migration order**

1. `git push`
2. The Vercel build runs `prisma migrate deploy` (vercel.json buildCommand) — column ships with the build, **before** any PATCH can write it.
3. `vercel --prod` → aliased `usegauge.vercel.app`.

- [ ] **Step 3: UAT on prod** (from PRD §7)

- [ ] Rename from list → persists after reload; shows on detail, dashboard, team, performance, intelligence, share page.
- [ ] Clear title → filename shows everywhere.
- [ ] Search by custom title finds the call (server + client).
- [ ] CSV export: title used, `=cmd()`-style titles inert, quotes escaped.
- [ ] Non-owner PATCH → 403. >120 chars / non-string → 400.
- [ ] Rename then immediately open detail → fresh title (cache invalidated).
- [ ] Japanese IME: Enter commits composition without saving.

- [ ] **Step 4: Update `docs/roadmap/DEVELOPMENT_FRONTIER.md`** — add a "Recently Shipped" row for call renaming (per CLAUDE.md convention).

- [ ] **Step 5: Cleanup + status**

Run: `git status --short` — must be clean. `git log --oneline -12` — one commit per task, atomic.

---

## Explicit non-goals (do NOT implement in this plan)

- CRM/Slack/email title propagation (`crm/formatter.ts`, `hubspot.ts`, `salesforce.ts`, `teams.ts`, `worker.ts`, `slack.ts`, `email.ts`) — TRD L1/L2.
- Public API v1 `title` + api-docs — TRD L3.
- GDPR export `title` — TRD L4.
- `canManageCall` semantics change (team-admin renaming private teammate calls) — TRD M2, documented.
- Archived-tab pencil — TRD M3 (hide).
- `POST /api/history` filename/summary sanitization — TRD H6 note (pre-existing gap; CSV layer now defends exports).
- `calls/[id]/share` unawaited `auth()` bug — TRD L8 (separate fix).
