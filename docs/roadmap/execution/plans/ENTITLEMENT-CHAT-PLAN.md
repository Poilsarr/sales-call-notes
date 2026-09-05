# ENTITLEMENT-CHAT-PLAN — Free-tier leak + buried AI Chat input

> Owner: orchestrator. Date: 2026-09-05. Status: EXECUTING.
> Explore wave: 3 agents (plans/entitlement, chat UI, call access). All reports converged.

## Verdict on the user's question

**Q: Can a brand-new Free user access calls/features meant for Pro/Business?**
**A: YES — 6 holes.** Calls themselves are ownership-gated by design
(`canAccessCall`, `src/lib/call-access.ts:13-22` — no tier check, intentional:
users always see their own calls). But Free users also get Pro/Business
FEATURES that `src/lib/plans.ts:92-257` reserves for paid tiers. Plus one
inverted bug where PAID users are blocked.

## Scope — fix now (2 commits) vs backlog

### Commit 1 — server entitlement (Executor A)
1. **G1 — Free gets Pro `ai_chat`.** `POST /api/chat`
   (`src/app/api/chat/route.ts:10-22`) checks auth + rate-limit only.
   `PLANS.free ai_chat:false` (`plans.ts:117`), Pro `true` (`:156`).
   Fix: after `getUserByClerkId`, gate with
   `hasFeature(getPlan((user.plan||"free").toLowerCase()), "ai_chat")`
   → `403 { error: "AI chat is a Pro plan feature", code: "PLAN_REQUIRED" }`,
   mirroring `src/app/api/competitive-intelligence/route.ts:96-103`.
   Update `src/test/api/chat-guardrails.test.ts:40` and
   `src/test/api/chat-rag-title.test.ts:150` (mock free → expect 403;
   add pro → 200 case).
2. **G12 — Paid users 403'd by case bug (inverted denial).** `getPlan`
   (`plans.ts:259-261`) is case-sensitive (`PLANS[tier] || PLANS.free`)
   but DB/Paddle store UPPERCASE (`FREE/PRO/BUSINESS`). Call sites pass
   raw `user.plan`: `v1/keys/route.ts:66`, `webhooks/route.ts:19`,
   `upload-url/route.ts:33`, `team/route.ts:124` → Pro/Business fall back
   to `free` → 403 on features they paid for. Fix centrally in `getPlan`:
   `PLANS[(tier||"free").toLowerCase()] || PLANS.free`. Add test in
   `src/test/services/plans.test.ts` (`getPlan("PRO")`, `"BUSINESS"`,
   `"Free"` resolve correctly; `"unknown"` still → free).

### Commit 2 — chat UI (Executor B)
3. **Buried AI Chat input.** Root cause: grid-stretch + unbounded page
   height. `page.tsx:306` outer is `min-h-` (no ceiling); `page.tsx:328`
   grid has no height bound; middle column (Executive Summary + MEDDIC/
   BANT/SPIN + Collaboration, 2500px+) sets row height; `lg:h-full` on
   chat card stretches it to match, so `ChatSidebar`'s `flex-1` messages
   area + `shrink-0` input (`chat-sidebar.tsx:71,77,129`) lay out in a
   2000px+ container. Fix: bound the grid to viewport on `xl`
   (e.g. `xl:h-[calc(100vh-X)]` + per-column `min-h-0 overflow-y-auto`),
   keep single-column stacking below `xl`; header + quick queries + input
   stay visible while messages scroll internally. Handle the new 403
   contract: `code==="PLAN_REQUIRED"` → render upgrade affordance
   (link `/pricing`, reuse `UpgradePrompt` if props fit) instead of an
   `Error:` bubble.
   Files: `src/app/app/calls/[id]/page.tsx`,
   `src/components/chat-sidebar.tsx`, `page.test.tsx` adjustments.

### Backlog — REPORTED, not fixed here (one concern per PR)
G2 search, G3 knowledge, G4 analytics-deep, G5 watchlist/company reads,
G7/G8 crm_sync, G9 slack, P1 uploadLimit POST bypass, team-downgrade
retention, public-share gating, G6 stringly gate, `v1/calls` api_access
read, `isPublicApi` comment. Follow-up arc, not this ship.

## Cross-executor contract (frozen)
- `POST /api/chat` Free → `403 { error: string, code: "PLAN_REQUIRED" }`.
  Executor B codes against this; Executor A implements it. If A must
  deviate, orchestrator relays via task follow-up before B finalizes.

## Disjoint file sets (no overlap)
- A: `src/lib/plans.ts`, `src/app/api/chat/route.ts`,
  `src/test/api/chat-*.test.ts`, `src/test/services/plans.test.ts`
  (+ any other test that asserts chat-200-for-free — search first).
- B: `src/app/app/calls/[id]/page.tsx`,
  `src/components/chat-sidebar.tsx`,
  `src/app/app/calls/[id]/page.test.tsx`.
- Neither touches the other's files. Shared read-only files OK.

## Verification (each executor, scoped — full gate by orchestrator)
- `npx vitest run <touched test files>` green.
- `npx tsc --noEmit` green.
- Report: files changed, diff summary, test output.

## Ship
- Orchestrator gate: `npx vitest run && npx next build`.
- Two single-concern commits + sequential pushes; docs row in
  `DEVELOPMENT_FRONTIER.md` Recently Shipped table.
