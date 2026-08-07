# S10 — RAG chat (top-5 retrieval, BYOK-aware)

Source of truth: `docs/roadmap/execution/TRD.md` S10 (lines 86-91) + PRD R10.1
("Top-5 retrieval via knowledge-graph embeddings in chat context") +
PRD.md env note line 45 ("knowledge-graph embeddings use user keys when present").

## Facts (Wave 1 research)

The S10 retriever is **already wired** in `src/app/api/chat/route.ts`:
`searchByQuery` (query embed via `text-embedding-3-small` + in-JS cosine over
`Call.embedding`), top-5, scoped by `userId`, with a recent-5 fallback.
`findSimilarCalls` (call-to-call) is NOT the right API — it is not used by chat.

Two real gaps remain:

1. **BYOK-unaware**: `route.ts` calls `kg.searchByQuery(query, userId, 5, undefined, true)`
   — `apiKey` hardcoded `undefined`, route never resolves the user's keys.
   Reference impl to mirror: `src/app/api/calls/search/route.ts:66-74`
   (`getByokKeys(user.id)` → pass `byok.openaiKey`).

2. **User-id bug (production): line 27 `const userId = sessionUserId;`** — passes the
   Clerk session id to DB queries that store the Prisma `User.id` on `Call.userId`.
   In prod Clerk IDs ≠ cuid → `searchByQuery` finds nothing → chat always falls back
   to recent-5 filtered by the wrong id → effectively sees NO calls. The route must
   resolve via `getUserByClerkId(clerkUserId)` first (mirror `calls/search/route.ts:30-33`),
   then scope all DB reads by `user.id`.

3. Fallback `findMany` select (route.ts ~44) omits `createdAt` → the response
   `date` falls back to `c.id` on the fallback path. Add `createdAt: true`.

## Design decisions

- Keep rate-limit key on the Clerk id (`chat:${sessionUserId}`) — it's a session
  counter, unrelated to DB scoping. Keep 2000-char cap, 20/min, 401.
- Mirror `calls/search` resolution order exactly: `auth()` → `getUserByClerkId` (401 on null)
  → BYOK resolve → `searchByQuery(query, user.id, 5, byok.openaiKey, true)` → recent-5 fallback
  scoped by `user.id`.
- `use.plan`/`updatedAt`? No — nothing else changes.

## Work packages

### P1 — `src/app/api/chat/route.ts`
- Import `getUserByClerkId` (`@/lib/get-user`) + `getByokKeys` (`@/lib/byok-resolver`).
- After auth: `const user = await getUserByClerkId(sessionUserId); if (!user) 401`.
- Replace `const userId = sessionUserId;` with `const userId = user.id;`.
- `const byok = await getByokKeys(user.id);` and pass `byok.openaiKey` as the 4th arg to `searchByQuery`.
- Add `createdAt: true` to the fallback `findMany` select.
- Keep response shape (`answer`, `relevantCalls`, `totalCallsSearched`) UNCHANGED — both clients hard-depend on it.

### P2 — tests (`src/test/api/chat-guardrails.test.ts`, `src/test/api/chat-rag-title.test.ts`)
- Both files: add `vi.mock('@/lib/get-user', () => ({ getUserByClerkId: vi.fn().mockResolvedValue({ id: 'user-db-id', plan: 'pro' }) }))`
  and `vi.mock('@/lib/byok-resolver', () => ({ getByokKeys: vi.fn().mockResolvedValue({ openaiKey: 'sk-byok-test', groqKey: undefined }) }))`
  (hoisted style per existing patterns).
- `chat-guardrails`: keep existing 429/400/401 assertions. Add: when `getUserByClerkId` resolves null → 401.
- `chat-rag-title`: keep the `messages[1].content` pins. Add one assertion: `getByokKeys` was called with `'user-db'` AND the KG `searchByQuery` received `'sk-byok-test'` as the apiKey arg (proves BYOK-aware + correct id flow).
- Fix any mock uncovered by the new resolution order (e.g. unmocked `prisma.user` in `getByokKeys`) — the byok-resolver mock above prevents DB access.

## Verification

1. `npx tsc --noEmit` green
2. `npx vitest run` full green
3. `REDIS_HOST=disabled REDIS_PORT=0 npx next build > /tmp/build.log 2>&1; echo "exit=$?"` → 0
4. Smoke on 3104: `/api/chat` POST → 401 (unauthenticated — proves auth path intact)
5. Commit + push main + frontier log

## Out of scope

- `findSimilarCalls` (call-to-call; unused) — leave as-is.
- pgvector / SQL vector search (hand-rolled cosine is the existing pattern).
- Backfill job for pre-RAG calls (already exists as the recent-5 fallback).
- Streaming responses / UI changes — clients hard-depend on the JSON shape.