# CALENDAR-NOTEAM-PLAN — Graceful teamless state for /app/calendar

## Problem
Brand-new users (`User.teamId = null` — teamless by design, see
`src/lib/get-user.ts:30-38`, `src/app/api/webhooks/clerk/route.ts:25-29`)
who open `/app/calendar` before completing Google OAuth get
`400 { error: "No team found" }` from `src/app/api/calendar/route.ts:20-22`,
rendered as scary "Could not load calendar / No team found"
(`src/app/app/calendar/page.tsx:98`). The footer
"Connected via Google Calendar … 0 shown" (`page.tsx:178`) is static and
misleading on failure.

## Fix (mirrors GET /api/integrations graceful pattern, route.ts:548-555)
Teamless reads return **200 + empty payload + `code: "NO_TEAM"`**
instead of 400. UI renders an onboarding state with a CTA.

## Executor A — API (files: src/app/api/calendar/route.ts,
## src/test/api/calendar-route.test.ts)
1. In `GET`, replace the `400 "No team found"` branch:
   - default action → `200 { events: [], code: "NO_TEAM" }`
   - `action === "check-meetings"` → `200 { upcoming: [], active: [],
     code: "NO_TEAM" }` (check `action` BEFORE the team guard so both
     shapes are covered; keep 401-unauthorized guard first, unchanged).
2. New test `src/test/api/calendar-route.test.ts` following
   `src/test/api/integrations-google.test.ts:1-60` mock pattern
   (`vi.hoisted` + `vi.mock("@clerk/nextjs/server")`,
   `vi.mock("@/lib/get-user")`; also mock `@/services/calendar`
   CalendarService and `@/services/meeting-bot` fns):
   - no userId → 401
   - teamless user → 200 + `code === "NO_TEAM"`, `events: []`
   - teamless + `?action=check-meetings` → 200 + `upcoming: []`,
     `active: []`, `code === "NO_TEAM"`
   - teamed user (mock CalendarService.listEvents) → 200 + events,
     no NO_TEAM code
3. Verify: `npx vitest run src/test/api/calendar-route.test.ts`
   and `npx tsc --noEmit`.

## Executor B — UI (file: src/app/app/calendar/page.tsx ONLY)
1. Capture `data.code` on the SUCCESS path too (`load()` currently
   only sets code on `!res.ok`, page.tsx:31-35): after
   `setEvents(...)` add `setCode(data.code ?? null)`.
2. Add `NO_TEAM` onboarding branch before the generic error block:
   title "Set up your calendar", body "Connect Google Calendar to see
   your upcoming meetings here.", CTA link to `/integrations`
   (reuse the existing `Plug`-icon button style, page.tsx:102-108).
   Condition: `code === 'NO_TEAM'` (works whether or not `error`
   is set — render it as non-error empty state, not the amber
   error card; place as its own branch so `error` amber card is
   untouched for real failures).
3. Footer (page.tsx:176-183): when `code === 'NO_TEAM'` show
   "Not connected · Connect Google Calendar to get started"
   instead of "Connected via Google Calendar".
4. Do NOT touch the amber error card logic or any other file.
5. Verify: `npx tsc --noEmit` + `npx eslint src/app/app/calendar/page.tsx`.

## Gate (orchestrator)
`npx tsc --noEmit`, `npx eslint` on touched files,
`npx vitest run src/test/api/calendar-route.test.ts`,
`npx next build`. No commits (user did not request).
