# LEVEL 3 — The Integrations That Pay
## Detailed Bite-Sized Tasks

**Pre-reqs:** GATE 2 closed.
**Goal:** Real OAuth, meeting bot, Slack end-to-end.
**Status:** ✓ MOSTLY (GATE 3 conditionally closed). OAuth live; meeting bot BLOCKED on Zoom/Meet/Teams dev accounts. Full table: see `DEVELOPMENT_FRONTIER.md` "Per-Level Current Status".
**Gate:** See `DEVELOPMENT_FRONTIER.md` GATE 3.

---

## Task 3.1 — HubSpot OAuth

**Files:**
- Create: `src/app/api/integrations/hubspot/connect/route.ts`
- Create: `src/app/api/integrations/hubspot/callback/route.ts`
- Modify: `src/services/crm/hubspot.ts` (use stored token, not param)
- Create: `src/test/hubspot-oauth.test.ts`

**Steps:**
1. Test: `/connect` redirects to HubSpot with state param.
2. Test: `/callback` exchanges code, stores token, redirects to `/integrations`.
3. Test: stored token used for subsequent sync calls.
4. Use `lib/secrets.ts` for token encryption.
5. Commit: `feat(crm): HubSpot OAuth flow with token persistence`.

---

## Task 3.2 — Salesforce OAuth

**Files:**
- Create: `src/app/api/integrations/salesforce/connect/route.ts`
- Create: `src/app/api/integrations/salesforce/callback/route.ts`
- Modify: `src/services/crm/salesforce.ts`
- Create: `src/test/salesforce-oauth.test.ts`

**Steps:**
1. Same pattern as 3.1 but with Salesforce Connected App + PKCE.
2. Test: full round-trip against Salesforce sandbox.
3. Commit: `feat(crm): Salesforce OAuth with PKCE`.

---

## Task 3.3 — Google Calendar OAuth

**Files:**
- Create: `src/app/api/integrations/google/connect/route.ts`
- Create: `src/app/api/integrations/google/callback/route.ts`
- Modify: `src/services/calendar.ts`
- Create: `src/test/google-calendar-oauth.test.ts`

**Steps:**
1. Test: `/connect` redirects to Google with proper scopes.
2. Test: `/callback` stores refresh token.
3. Test: events fetch from real Google Calendar API.
4. Commit: `feat(calendar): Google OAuth + event sync`.

---

## Task 3.4 — Meeting Bot — Pick the Path

**Decision document:** `docs/roadmap/MEETING_BOT_DECISION.md`

Recommendation: **Recall.ai** for v1. (Alternative: build with Playwright + audio capture.)

Comparison:
| | Recall.ai | DIY (Playwright) |
|---|---|---|
| Cost/hr | $0.30 | self-host (~$50/mo infra) |
| Time to ship | 1 day | 2-3 weeks |
| Reliability | high (their infra) | fragile (browser deps) |
| Platforms | Zoom, Meet, Teams | depends on capture method |

---

## Task 3.5 — Meeting Bot Integration

**Files:**
- Create: `src/services/meeting-bot-provider.ts` (Recall.ai adapter)
- Modify: `src/services/calendar.ts` (auto-dispatch on meeting start)
- Modify: `src/services/queue.ts` (add `meetingBotQueue`)
- Create: `src/test/meeting-bot.test.ts`

**Steps:**
1. On calendar sync, identify meetings with video links.
2. T-1 min before meeting: dispatch bot via Recall API.
3. On bot callback: poll recording, transcribe, create `Call`.
4. Test: scheduled Zoom test meeting → bot joins → recording appears.
5. Commit: `feat(integrations): meeting bot via Recall.ai with calendar auto-dispatch`.

---

## Task 3.6 — Slack Notifications

**Files:**
- Modify: `src/services/slack.ts`
- Create: `src/test/slack-notifications.test.ts`

**Steps:**
1. Test: action item assigned → DM to assignee.
2. Test: weekly digest cron (every Monday 9am user TZ).
3. Add: slash command `/callnote [callId]` → fetch summary inline.
4. Commit: `feat(slack): action item DMs + weekly digest + slash command`.

---

## Task 3.7 — Integration Test Endpoint

**Files:**
- Create: `src/app/api/integrations/[id]/test/route.ts`
- Create: `src/test/integration-test.test.ts`

**Steps:**
1. Test: live connection → 200 + status=ok.
2. Test: stale token → 200 + status=reauth_required + reauth URL.
3. Test: missing integration → 404.
4. Commit: `feat(integrations): connection health check endpoint`.

---

## GATE 3 — Final Checks

```bash
# 1. HubSpot OAuth round-trip works
# In dev: click "Connect HubSpot", complete OAuth, see green status

# 2. Salesforce OAuth round-trip works
# Same for Salesforce sandbox

# 3. Meeting bot joins test Zoom
# Schedule a 5-min test meeting, verify bot joins and recording lands

# 4. Slack DM arrives
# Assign an action item, check assignee's Slack DMs

# 5. Integration test endpoint reports correctly
curl /api/integrations/:id/test
# Expected: { status: "ok" | "reauth_required" | "error" }

# 6. All secrets via lib/secrets.ts
grep -rE "process.env\.[A-Z_]+_(SECRET|TOKEN|KEY)" src/ | grep -v ".test." | grep -v "lib/secrets.ts"
# Expected: no matches outside secrets.ts
```

When all 6 pass, **GATE 3 is closed**. Move to LEVEL 4.


---

## Status (post PRs #42–#64)

**PARTIAL** — 5 of 7 tasks shipped (Slack, Google Calendar, integration test endpoint). OAuth partial, meeting bot BLOCKED on Zoom/Meet/Teams dev accts.

Last verified: 2026-06-21. See `docs/roadmap/DEVELOPMENT_FRONTIER.md` for the master list of shipped PRs.
