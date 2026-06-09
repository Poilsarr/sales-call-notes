# LEVEL 1 — Lock The Perimeter
## Detailed Bite-Sized Tasks

**Pre-reqs:** GATE 0 closed (real OpenAI + real DB working).
**Goal:** RBAC, GDPR, audit logs, action items API, per-provider webhooks.
**Gate:** See `DEVELOPMENT_FRONTIER.md` GATE 1.

---

## Task 1.1 — RBAC Middleware Helper

**Files:**
- Create: `src/lib/rbac.ts`
- Create: `src/test/rbac.test.ts`

**Steps:**
1. Write failing test for `requireRole(userId, teamId, minRole)` covering 4×5 role/method matrix.
2. Implement: query `User.teamRole`, compare against hierarchy.
3. Run `npm test -- rbac`.
4. Commit: `feat(auth): RBAC helper with role hierarchy`.

---

## Task 1.2 — Enforce RBAC on Existing Routes

**Files:**
- Modify: every `src/app/api/calls/[id]/*/route.ts`
- Modify: `src/app/api/team/route.ts`
- Modify: `src/app/api/integrations/route.ts`

**Steps:**
1. For each route, read `auth()` from Clerk, fetch user's `teamRole` via Prisma.
2. Add `requireRole()` call at top of handler.
3. Test: viewer cannot delete a call → 403.
4. Commit per route: `feat(api): enforce RBAC on <endpoint>`.

---

## Task 1.3 — Action Items API (Spec Gap)

**Files:**
- Create: `src/app/api/action-items/route.ts` (GET, POST)
- Create: `src/app/api/action-items/[id]/route.ts` (PUT, DELETE)
- Create: `src/test/action-items.test.ts`

**Steps:**
1. Write failing tests for all 4 verbs.
2. Implement per `docs/fullstack-architecture.md:287-292` spec.
3. Use Zod for input validation.
4. Commit: `feat(api): add action-items CRUD`.

---

## Task 1.4 — GDPR Data Export

**Files:**
- Create: `src/app/api/user/export/route.ts` (POST starts job)
- Create: `src/app/api/user/export/[jobId]/route.ts` (GET status)
- Modify: `src/services/queue.ts` (add `exportQueue`)
- Create: `src/test/user-export.test.ts`

**Steps:**
1. Test: POST returns jobId, GET returns download URL when ready.
2. Implement async job that aggregates User, Calls, ActionItems, Comments → JSON.
3. Use signed URL for download (S3 or Vercel Blob).
4. Commit: `feat(gdpr): async data export with signed download`.

---

## Task 1.5 — GDPR Right-to-Delete

**Files:**
- Create: `src/app/api/user/delete/route.ts` (POST schedules)
- Modify: `src/services/worker.ts` (add hard-delete cron)
- Create: `src/test/user-delete.test.ts`

**Steps:**
1. Test: soft-delete schedules, hard-delete removes from DB.
2. Implement: 7-day grace period, then hard-delete all PII.
3. Audit log on each step.
4. Commit: `feat(gdpr): soft-delete with 7-day grace + hard-delete worker`.

---

## Task 1.6 — Audit Log Wiring

**Files:**
- Modify: handlers for login, call-delete, integration CRUD, team CRUD, billing change
- Use existing `src/lib/audit-logger.ts`
- Create: `src/test/audit-log.test.ts`

**Steps:**
1. Wrap each sensitive action with `auditLog({ userId, action, entityId, entityType })`.
2. Test: each action creates an `AuditLog` row with correct fields.
3. Commit: `chore(audit): wire audit log to sensitive actions`.

---

## Task 1.7 — Per-Provider Webhook Receivers

**Files:**
- Create: `src/app/api/webhooks/hubspot/route.ts`
- Create: `src/app/api/webhooks/salesforce/route.ts`
- Create: `src/test/webhook-signature.test.ts`

**Steps:**
1. Test: bad signature → 400, good signature → 200, replay → idempotent.
2. Implement signature verification per provider.
3. Store event IDs to dedupe.
4. Commit: `feat(webhooks): per-provider receivers with signature + dedupe`.

---

## GATE 1 — Final Checks

```bash
cd /Users/kushagarhsingh/Desktop/com\ analayze/works/sales-call-notes

# 1. Viewer cannot delete a call
# Sign in as viewer-role test user, attempt DELETE /api/calls/:id
# Expected: 403

# 2. Action items API works
curl -X GET /api/action-items -H "Authorization: ..."
# Expected: 200 + list

# 3. GDPR export returns JSON
curl -X POST /api/user/export
# Expected: 202 + jobId

# 4. Webhook signature enforced
curl -X POST /api/webhooks/hubspot -H "X-HubSpot-Signature-v3: invalid"
# Expected: 400

# 5. Audit logs created
# Perform each sensitive action, query AuditLog table
# Expected: row exists

# 6. TypeScript + tests clean
npx tsc --noEmit && npm test
```

When all 6 pass, **GATE 1 is closed**. Move to LEVEL 2.
