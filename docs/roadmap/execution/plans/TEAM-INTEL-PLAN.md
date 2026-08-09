# TEAM-INTEL-PLAN — Team invite fix + Intelligence page clarity

## Objective

Fix two user-reported problems in Gauge:

1. **Team page**: "No teammates yet / Create a team by inviting your first member" appears with **no way to actually add a member** — the invite form exists but is gated behind a condition a solo user can never satisfy.
2. **Intelligence page**: confusing — dead interactive elements, contradictory numbers, false promises, and network failures masquerading as empty data.

Both are **honest-UI work, not feature work**. No new models, no migrations, no new auth surface.

## Explore-wave facts (3 read-only agents, verified file:line)

### Workstream A — Team

- **Root cause**: `src/app/team/page.tsx:309` wraps the invite card in `{isAdmin && (...)}`. `isAdmin` is computed at `:205-206` from `members.find(m => m.email === user?.primaryEmailAddress?.toString())?.teamRole === "ADMIN"`. Solo user → `members = []` → `isAdmin = false` → form never renders. Empty state `:372-383` says "Create a team by inviting your first member" with **no control**.
- **API already supports the flow**: POST `/api/team` (`src/app/api/team/route.ts:96-181`) — teamless inviter skips `requireRole` (`:106`), creates `${name}'s Team` / slug `team-{id}` (`:126-137`), sets inviter `'ADMIN'`, target `'MEMBER'`, backfills orphaned calls (`:143-158`). DELETE `:183-221` admin-only. GET returns `{ members, teamName, slug, sharedCalls, teamAnalytics }` (`:89`).
- Invitee must already have an account: 404 "User not found — they need to sign up first" (`:113-116`); 409 if on another team (`:118-120`). Card description already says "They must already have an account." (`:318`).
- **No seat enforcement**: `src/lib/plans.ts` — `teamMemberLimit` free=1 (`:102`), pro=5 (`:138`), business/enterprise=unlimited (`:178,220`); `team_workspace: false` on free (`:118`). POST ignores it. Billing page already displays `teamMemberCount`/`teamMemberLimit` (`src/app/api/billing/route.ts:34-48`).
- **No tests** for `/api/team` route or team page component. GET shape pinned by: `onboarding-checklist.tsx:83`, `calls/[id]/page.tsx:66`, `team/performance/page.tsx:50` — response shape must stay stable.
- `inviteMember` already consumes POST response and refreshes `members`/`teamName` state (`page.tsx:165-168`) — only the gate blocks rendering.
- Team page lives outside `/app` layout: marketing `Nav`, inline banners (not sonner toasts), own loading gate (`:209-223`).
- Pinned tests to NOT touch: `src/test/middleware-billing-gate.test.ts:22` (matcher contains `/team(.*)`), `e2e/gated-pages.spec.ts:25` (heading `/team/i`), `src/test/action-items.test.ts:24` (mock `teamId: null`), `src/test/rbac.test.ts`.
- **Latent bug found (DEFER)**: `src/app/app/layout.tsx:14` — `prisma.user.findUnique({ where: { id: userId } })` queries DB cuid with a Clerk id → always null → `hasOnboarded` redirect dead. Fix is `where: { clerkId: userId }` (`hasOnboarded` defaults `false`, `schema.prisma:39`). Behavior flip → own PR, out of scope here.

### Workstream B — Intelligence

- Page: `src/app/app/intelligence/page.tsx` (344 lines, `"use client"`). States: loading; 403 `PLAN_REQUIRED` → `UpgradePrompt` modal (`:115-127`); 401 → session-expired card (`:130-150`); other errors → error card (`:154-168`); **network failure → fake empty state** (`:96-98` `.catch` sets zeroed data → renders cheerful "No competitor mentions found yet" `:260-291`); populated → 3 stat cards + minimal `UpgradePrompt` banner (`:243`) + `CompetitorCharts` (`:245`) + mentions list (`:247-341`).
- **Dead filter**: `selectedCompetitor` declared `:58`, used to build query `:63` and refetch effect deps `:100`, conditional heading `Mentions of "X"` `:255-257` — but `setSelectedCompetitor` is **never called**. Chips in `src/components/competitor-charts.tsx:206-238` keep local state that only recolors the chip (comment `:256` admits stub). Server-side `?competitor=` filter is fully implemented + tested (`route.ts:38-39,119`; suite `:136-190,:303-316,:472-504`).
- **"Total Mentions" lies**: `route.ts:132` `total = mentions.length` capped at `limit` (default 50, `:71-81`), while trend/unique come from an **unlimited** `groupBy` (`:165-176`) → chart sums can exceed the stat. API already supports `days/from/to/limit/groupBy/teamId`; page sends none.
- **Empty-state copy overpromises**: `page.tsx:270-274` — "the exact line and the speaker". Writer hardcodes `context: null, sentiment: null, mentionedBy: null, timestamp: null` for fallback mentions (`src/app/api/analyze/route.ts:366-383`); default `b2b-sales.md` prompt has no `competitorsMentioned` field.
- **Banner flash**: `UpgradePrompt` defaults plan `"free"` until `/api/billing` resolves (`upgrade-prompt.tsx:22,41-47`); page passes no `serverPlan` (`:243`). Banner provably unreachable for every viewer: free → 403 early-return before render; all paid tiers have `competitive_alerts: true` (`plans.ts:148,189,230`).
- **Pins**: `src/test/build-regressions.test.ts:9-11` (force-dynamic + edge-safe Redis import — don't touch); 667-line suite `src/test/competitive-intelligence-route.test.ts` (success bodies asserted via `toMatchObject`; exact `toEqual` only on error payloads — additive `summary.total` change is safe with 3 mechanical updates).
- `competitor-charts.tsx` imported **only** by `intelligence/page.tsx` (verified) — props change = 1 call site.
- No page-level component test exists for intelligence.

## Consultation outcomes (3 planning agents: PM / Lead Eng / Minimal-Change)

| Item | Verdict | Notes |
|---|---|---|
| A: gate fix `isAdmin \|\| members.length === 0` | **IN** (unanimous) | Entire bug fix; API already handles first invite |
| A: seat-limit enforcement | **DISPUTED** (PM+LEO IN, MCE REJECT) | → **USER DECISION REQUIRED** (see below) |
| A: invitee-must-have-account copy | already exists at `:318` / `route.ts:115` — no change | |
| A: email-invitation flow (Invitation model) | **REJECT** (unanimous) | multi-week arc; measure 404 rate first |
| A: `app/layout.tsx:14` id-vs-clerkId bug | **DEFER** (2 of 3; PM said drive-by) | behavior flip, own PR |
| B: wire the competitor filter | **IN** (unanimous, MCE "with modify": props not duplicate state) | ~8 lines, 2 files |
| B: true Total Mentions via `prisma.count` | **DISPUTED** (PM+LEO IN, MCE prefer relabel) | LEO verified additive-safe; IN with 3 test updates |
| B: delete minimal UpgradePrompt banner (`:243`) | **IN** (2 of 3; PM proposed null-init instead) | deletion is smaller + kills stuck-banner case |
| B: soften false empty-state copy | **IN** (unanimous) | |
| B: network failure → real error card | **IN** (unanimous) | |
| B: date-range control, call-detail cross-link | **DEFER** (unanimous) | chart honestly labeled today; no lie |
| B: prompt upgrade (context/speaker extraction) | **DEFER** (unanimous) | AI/eval workstream, OpenAI quota blocked |

## DECISION — seat-limit enforcement (A-2): **ENFORCE** (user-approved, 2026-08-09)

`teamMemberLimit`: free=1, pro=5, business+ = unlimited. The API ignores it today. Enforcing in POST `/api/team`:
- Closes the free-tier leak (`team_workspace: false` is sold on free); aligns the API with the billing page quota; free users see a friendly upgrade error via the existing error banner.

Error strings:
- Free plan: `"Team workspaces are a Pro feature. Upgrade to Pro to invite up to 5 members."`
- Pro at 5/5: `"You've reached the Pro limit of 5 members. Upgrade to Business for unlimited seats, or remove a member first."`

Note: the page's `inviteMember` handler already renders `data.error` into the error banner (`page.tsx:172`) — zero new UI.

## Scope (converged, in-session)

### Workstream A — Team

| # | File | Change |
|---|---|---|
| A-1 | `src/test/api/team-route.test.ts` (NEW) | Behavior-lock tests green on CURRENT code (see Test plan) |
| A-2 | `src/app/api/team/route.ts` | [IF seat enforcement approved] plan/limit check in POST before `:126` team-create: `getUserByClerkId` returns `plan`; current seats = `teamId ? prisma.user.count({where:{teamId}}) : 1`; if `typeof limit === "number" && current + 1 > limit` → 403 friendly error. Enforce on inviter's plan only. |
| A-3 | `src/app/team/page.tsx` | `:309` gate → `{(isAdmin \|\| members.length === 0) && (`; delete dead `hasTeam` `:225`; empty-state copy `:377-381` → point at the form: "Invite your first teammate with the form above — they'll join as a member, and you'll be the admin." |
| A-4 | `src/app/team/page.test.tsx` (NEW, colocated) | Component test locking the reported bug (see Test plan) |

Ordering within lane A: A-1 → A-2 → A-3 (+A-4 same commit as A-3, its proof). A-2 must land before A-3 if enforced (else the UI opens a form the API blocks confusingly).

### Workstream B — Intelligence

| # | File | Change |
|---|---|---|
| B-1 | `src/app/api/competitive-intelligence/route.ts` | After `findMany` (`:121-130`): `const totalCount = await prisma.competitorMention.count({ where });` and `summary.total = totalCount` (`:189`). Same `where` → stays consistent under competitor/date filters. Keep field name `total` (page interface `:33-37` untouched). |
| B-1 | `src/test/competitive-intelligence-route.test.ts` | **Mandatory**: add `count` fn to `vi.hoisted` factory + prisma mock (`:8-29`) — missing it 500s ~30 tests. Update 3 assertions: `:186-190` (mock count 1), `:273-278` (mock 0), `:293-300` (mock 11, assert `total: 11`). |
| B-2 | `src/app/app/intelligence/page.tsx` | ① `:96-98` `.catch` → `setError("Network error — could not load competitive data.")` (keep `setData(null)`; reuse error card `:154-168`, add "Try again" button that re-runs fetch); ② `:243` delete minimal `UpgradePrompt`; ③ `:245` pass `selectedCompetitor={selectedCompetitor} onSelectCompetitor={setSelectedCompetitor}`; ④ stat-card label → `Mentions of "X"` when filtered, else "Total Mentions"; ⑤ caption when `summary.total > mentions.length`: "Showing the most recent 50 of {total} mentions."; ⑥ `:270-274` soften copy: "Every uploaded call is scanned for Gong, Otter, Chorus, Fireflies, and 40+ other names. When a prospect mentions one, it shows up here — linked to the call it came from." |
| B-2 | `src/components/competitor-charts.tsx` | Props `:19-22` gain `selectedCompetitor: string \| null; onSelectCompetitor: (c: string \| null) => void;`. Delete local state `:206`; `:222` uses prop; `:226` → `onSelectCompetitor(sel ? null : t.competitor)`. Drop `useState` import if unused elsewhere. Update the stub comment `:256`. |
| B-3 | `src/app/app/intelligence/page.test.tsx` (NEW, colocated) | Component test locking B-2 (see Test plan) |

Ordering: B-1 → B-2 → B-3.

Waves verified disjoint (grep): A touches `team/*` only; B touches `intelligence/*`, `competitor-charts.tsx`, `competitive-intelligence/*`. **Zero shared files.**

## Test plan

### A-1 `src/test/api/team-route.test.ts` (mirror `src/test/api/team-branding.test.ts` pattern: `vi.mock` `@/lib/prisma` default+named, `@clerk/nextjs/server` auth, `@/lib/get-user`, `@/lib/rbac`, `@/lib/audit-logger`; call handlers with `new Request`)
1. GET unauthenticated → 401
2. GET solo user → `{ members: [], teamName: null, slug: null }` (regression baseline for A-3)
3. GET team member → members + teamName + analytics
4. POST missing email → 400
5. POST invitee not found → 404
6. POST invitee on another team → 409
7. POST first invite → team created (`{name}'s Team`, slug `team-{id}`), inviter→ADMIN, target→MEMBER, orphaned-call backfill `updateMany` called
8. POST as non-admin on existing team → 403
9. [IF seats approved] POST free plan → seat-limit 403; pro 5/5 → 403; pro 3/5 → 200
10. DELETE non-admin → 403; DELETE self → 400; DELETE off-team → 404; DELETE success clears `teamId`

### A-4 `src/app/team/page.test.tsx` (mirror `src/app/app/page.test.tsx` pattern: `vi.doMock('@clerk/nextjs')` `useUser`, `vi.stubGlobal('fetch')`, dynamic import after mocks, mock `@/components/nav`)
1. Solo user (`members: []`) → invite form renders + updated empty-state copy
2. Admin with members → form renders
3. Non-admin member → form hidden
4. Invite failure → API error in banner
5. Successful invite → member list updates

### B-1 route test updates
- factory gains `count`; 3 assertion updates (above)

### B-3 `src/app/app/intelligence/page.test.tsx` (same pattern; mock `UpgradePrompt` + `CompetitorCharts` where needed)
1. Populated render → 3 stat cards + mentions list
2. 403 PLAN_REQUIRED → upgrade modal only
3. 401 → session-expired card
4. 5xx → error card
5. **Fetch rejects → error card, NOT empty state** (locks B4)
6. Empty success → empty state with softened copy (locks B6)
7. Chip click → refetch with `?competitor=X`, heading + stat label switch (locks B1)

## Verification (gate — orchestrator, no edits)

```bash
# After each wave merge, in order:
npx vitest run                                   # FULL suite green (531 + new)
REDIS_HOST=disabled REDIS_PORT=0 npx next build  # type-check + production build green
git status --short                               # clean before push
```

Targeted per-executor: `npx vitest run src/test/api/team-route.test.ts` (A-lane), `npx vitest run src/test/competitive-intelligence-route.test.ts` (B-lane), `npx vitest run src/test/build-regressions.test.ts src/test/middleware-billing-gate.test.ts` (pins untouched).

Playwright: not required (no auth-gate changes). Optional signed-in smoke for `/team` + `/app/intelligence`.

Manual checks: solo user sees form + invite creates team; free solo user gets seat error [if approved]; non-admin member sees no form; Pro user: no banner flash, chips filter + refetch, Total Mentions > 50 uncapped.

## Commit plan (single-concern, sequential, CI green between)

1. `test(team): lock /api/team GET/POST/DELETE behavior` (A-1 only)
2. `feat(team): enforce team seat limits on invite` (A-2 + seat tests) [if approved]
3. `feat(team): show invite form for solo users + honest empty state` (A-3 + A-4)
4. `feat(ai): return true total mention count` (B-1 route + test updates)
5. `feat(ai): wire competitor filter, honest errors/copy on intelligence page` (B-2 + B-3)
6. `docs(roadmap): update DEVELOPMENT_FRONTIER.md` (Recently Shipped row)

## Out of scope (recorded, not executed)

- Email-invitation flow (Invitation model + migration + template + accept lifecycle) — revisit if invite 404 rate > X%
- `app/layout.tsx:14` clerkId-vs-id bug — own 1-line PR (behavior flip; `hasOnboarded` defaults `false`)
- Prompt upgrade to extract context/speaker/sentiment (`b2b-sales.md` + `analyze/route.ts`) — AI/eval arc; OpenAI quota externally blocked
- Date-range control on intelligence page (chart hardcodes 30d honestly; route already supports `days`)
- Call-detail ↔ intelligence cross-link (needs API plumbing)
- Role management (promote/demote/transfer ownership), leave-team, notifications
- Integrations-callback team creation has no plan gate (4 paths: `integrations/route.ts:134-156`, 3 OAuth callbacks) — flag, separate arc
- Pagination/load-more on mentions list

## Back-out plan

- Each commit is atomic and reversible via `git revert`. No migrations, no schema changes, no env changes, no middleware changes.
- Response shapes preserved: GET `/api/team` unchanged; CI `summary.total` semantic change covered by its 3 updated tests in the same commit.
- If `next build` or full vitest fails at any gate: fix in place before the next wave; do not push red.
