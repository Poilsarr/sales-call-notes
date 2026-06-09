# LEVEL 6 — Production Hardening
## Detailed Bite-Sized Tasks

**Pre-reqs:** GATE 5 closed.
**Goal:** SOC2-readiness, backup/recovery, monitoring, runbooks.
**Gate:** See `DEVELOPMENT_FRONTIER.md` GATE 6.

---

## Task 6.1 — Database Backups

**Files:**
- Create: `docs/operations/RESTORE.md`
- Create: `scripts/verify-backup.sh`

**Steps:**
1. Enable Neon PITR (point-in-time recovery).
2. Document restore procedure with screenshots.
3. Test: restore from 24h-old snapshot to a test DB.
4. Verify: restored data matches source within last 24h.
5. Commit: `chore(ops): DB backup verification + restore runbook`.

---

## Task 6.2 — Sentry Release Tracking

**Files:**
- Modify: `sentry.server.config.ts`
- Modify: `sentry.client.config.ts`
- Modify: `sentry.edge.config.ts`
- Create: `src/test/sentry-release.test.ts`

**Steps:**
1. Wire: `Sentry.setRelease(VERCEL_GIT_COMMIT_SHA)`.
2. Wire: `Sentry.setEnvironment(VERCEL_ENV)`.
3. Test: errors in different releases distinguishable.
4. Commit: `chore(obs): Sentry release + environment tagging`.

---

## Task 6.3 — Uptime Monitoring

**Files:**
- Create: `src/app/api/health/route.ts`
- Create: `docs/operations/UPTIME.md`

**Steps:**
1. Create `/api/health` returning 200 + DB ping.
2. Add Better Stack (or UptimeRobot) check on this endpoint.
3. Alert: 2 consecutive failures → PagerDuty.
4. Test: kill the app, verify alert fires within 2 min.
5. Commit: `chore(ops): health endpoint + uptime monitoring`.

---

## Task 6.4 — Error Budget Alerts

**Files:**
- Create: `docs/operations/ALERTS.md`
- Modify: `sentry.server.config.ts`

**Steps:**
1. Sentry alert: error rate > 0.5% for 5 min → PagerDuty.
2. Sentry alert: p95 latency > 1s for 5 min → Slack.
3. Test: inject error in staging, verify alert.
4. Commit: `chore(obs): error budget + latency alerts`.

---

## Task 6.5 — Compliance Docs

**Files:**
- Create: `docs/compliance/SOC2_READINESS.md`
- Create: `docs/compliance/DPA.md`
- Modify: `SECURITY.md`

**Steps:**
1. SOC2 readiness doc: list controls, status, owner, gap.
2. DPA template: standard clauses + our specific data flows.
3. Public SECURITY.md: encryption, access, incident response.
4. Commit: `docs(compliance): SOC2 readiness + DPA + public security page`.

---

## Task 6.6 — Incident Runbook

**Files:**
- Create: `docs/operations/RUNBOOK.md`

**Steps:**
1. Top 10 incidents: openai-down, db-down, redis-down, clerk-down, paddle-down, etc.
2. For each: symptoms, diagnosis, mitigation, escalation.
3. Test: simulate OpenAI outage, follow runbook, recover.
4. Commit: `docs(ops): incident response runbook`.

---

## Task 6.7 — Production Smoke Test

**Files:**
- Create: `scripts/smoke-test.sh`
- Modify: `.github/workflows/ci.yml` (add smoke job on main)

**Steps:**
1. Script hits 20 critical endpoints (signup, upload, transcribe, etc.).
2. Wired to run post-deploy in CI.
3. Blocks deploy if any endpoint fails.
4. Test: intentionally break one endpoint, verify CI fails.
5. Commit: `chore(ops): post-deploy smoke test`.

---

## GATE 6 — Final Checks

```bash
# 1. DB backup verified
bash scripts/verify-backup.sh
# Expected: restore successful

# 2. Uptime monitoring active
# Check Better Stack dashboard shows green

# 3. Sentry releases tagged
# Trigger a test error, verify release tag in Sentry

# 4. Error rate alert fires
# Inject error in staging, verify PagerDuty alert

# 5. Compliance docs reviewed
# Manual review of SOC2_READINESS.md, DPA.md, SECURITY.md

# 6. Smoke test green
bash scripts/smoke-test.sh
# Expected: all 20 endpoints 2xx
```

When all 6 pass, **GATE 6 is closed**. Frontier is complete. BETA LAUNCH.

---

## Post-Launch

After beta ships, return to roadmap. Add to a v2 backlog:
- Mobile apps
- On-premise deployment
- Custom ML model training
- i18n
- HIPAA

These are explicitly NOT in the frontier. See `DEVELOPMENT_FRONTIER.md` "Honest Tradeoffs" section.
