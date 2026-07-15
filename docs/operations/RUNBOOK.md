# Incident Response Runbook — Gauge

> **Owner:** Solo founder (today). Re-evaluate on first hire.
> **Last reviewed:** 2026-06-20.
> **Severity scale:** Sev1 (data loss / breach / full outage) → Sev2 (degraded) → Sev3 (minor).

This runbook covers the top 10 incidents we expect to hit. Each has:
**Symptoms → Diagnose → Mitigate → Escalate → Post-mortem**.

For each incident, **time-to-mitigate matters more than perfect diagnosis.** The
mitigation step is the smallest change that stops the bleeding.

---

## 0. Generic preamble (every incident)

1. **Stop the bleeding first.** Disable the failing surface (route, queue, provider) before diagnosing.
2. **Communicate.** Status page → in-app banner → email. Use template at end of doc.
3. **Capture evidence.** Sentry URL, curl output, Vercel logs, Neon logs. Save to the incident folder before fixes.
4. **Don't ship a "fix" that hides the symptom.** Add a regression test before merge.

---

## 1. OpenAI down (transcription / analysis failing)

**Symptoms:**
- `transcribe` + `analyze` endpoints return 500 with `openai_error`.
- Sentry issue spike tagged `provider:openai`.
- `/api/health` still 200 (doesn't ping OpenAI directly today).

**Diagnose:**
1. `curl https://status.openai.com/api/v2/status.json | jq '.status.indicator'`
2. Check Sentry for `provider:openai` errors in the last 1h.
3. Check `scripts/prove-openai.mjs` locally — `npx tsx scripts/prove-openai.ts`.

**Mitigate:**
- Groq fallback is already wired in `src/lib/ai/openai.ts`. Verify the env var: `echo $GROQ_API_KEY`.
- If fallback also fails: short-circuit with a 503 + `Retry-After: 30` header on both `transcribe` and `analyze`. Users see "AI temporarily unavailable, try again in a minute."
- Push an in-app banner: "We are using our backup AI provider while OpenAI recovers. Quality may differ slightly."

**Escalate:**
- OpenAI status page if confirmed outage: tweet/post incident.
- After 30 min outage, email affected Pro + Business customers (`select email from User where plan != 'FREE' and createdAt > now - interval '30 days'`).

**Post-mortem (within 24h):**
- Did the fallback kick in automatically? If not, why?
- Did quota-guard trip correctly? Check `src/lib/quota-guard.ts` logs.
- Add a `/api/health/openai` probe that hits the real API.

---

## 2. Database down (Neon)

**Symptoms:**
- `/api/health` returns 500.
- All API routes return 500 with `prisma_error`.
- Vercel runtime logs show `Error: P1001 Can't reach database server`.

**Diagnose:**
1. Neon console → status dashboard.
2. `curl https://console.neon.tech/api/v1/projects/<id>` (if API token set).
3. Try a `prisma studio` connection locally with the same `DATABASE_URL`.

**Mitigate:**
- Neon free tier auto-suspends after 5 min inactivity. Wake by hitting the DB: `curl -X POST https://<project>.neon.tech/sql -d 'SELECT 1'` or any endpoint.
- If Neon is fully down (rare): set `DATABASE_URL` to a read-only Neon branch we keep hot. Service degrades to read-only; upload/analyze fails with 503.
- Long-term: keep a Neon secondary branch (`neon branch create --name standby`) for failover.

**Escalate:**
- Open Neon support ticket with the request ID from the failed query.
- Notify customers via in-app banner if outage > 10 min.

**Post-mortem:**
- Did we wake the DB on schedule? If cold-start is the cause, add a cron pinger to `/api/health/db`.
- Confirm the secondary branch is within 5 min of primary.

---

## 3. Redis down (Upstash)

**Symptoms:**
- Rate limiter throws → 500s on every authenticated route.
- BullMQ queues stop processing (live transcription finalize, transcript upload).
- Sentry: `provider:redis` error spike.

**Diagnose:**
1. Upstash console → check status.
2. `curl $UPSTASH_REDIS_REST_URL/ping`.

**Mitigate:**
- Rate limiter fails open (`src/lib/rate-limit.ts` already returns "allow" if Redis errors). Verify by hitting `/api/calls` rapidly — it should still return data.
- Queues: BullMQ retries with exponential backoff (configured). Jobs are durable on the queue server; they will replay when Redis returns.
- If Redis is down > 30 min: pause background workers (set `WORKER_ENABLED=false` env var, redeploy).

**Escalate:**
- Upstash support.

**Post-mortem:**
- Are we failing open everywhere we should? `grep -rn "rateLimit" src/`.
- Should we add a local in-memory rate limiter as last-resort fallback?

---

## 4. Clerk auth down

**Symptoms:**
- All authenticated pages redirect to `/sign-in` loop.
- API routes return 401 even with valid session.
- Sentry: `provider:clerk` errors.

**Diagnose:**
1. `curl https://status.clerk.com/api/v2/status.json` (or visit dashboard).
2. Verify env vars: `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.

**Mitigate:**
- We do NOT bypass Clerk — that's a security hole. Instead:
  - In-app banner: "We're having trouble with sign-in. Status: status.clerk.com"
  - If outage > 30 min, switch the middleware to "fail open" via a kill-switch env var: `AUTH_KILL_SWITCH=true` → middleware returns a maintenance page.
- Public routes (`/`, `/pricing`, `/demo`, `/sign-in`) remain accessible.

**Escalate:**
- Clerk support has 24/7 paid plan; we're on free so expect email-only.
- Status page update.

**Post-mortem:**
- Confirm the kill-switch works. Add a `/api/auth/health` route that pings Clerk's API and is wired to Sentry.

---

## 5. Paddle billing down

**Symptoms:**
- Users cannot upgrade → /api/billing/checkout fails.
- Webhooks from Paddle not delivered → subscription state stale.

**Diagnose:**
1. Paddle dashboard → check event log.
2. `curl https://status.paddle.com/` (or vendor status URL).

**Mitigate:**
- Display "Checkout temporarily unavailable" on /pricing.
- Don't degrade existing subscribers — they keep access until their renewal date.
- Paddle webhooks queue server-side; missing events replay when Paddle recovers. Our handler is idempotent (checks `subscription_status` before update).

**Escalate:**
- Paddle support.

**Post-mortem:**
- Were any subscription state transitions missed? Compare `User.subscriptionStatus` vs Paddle dashboard for a sampled week.

---

## 6. Customer data breach (P0)

**Symptoms:**
- Evidence of unauthorized access: unusual Sentry errors, AuditLog anomalies, customer report.
- Suspected PII leak: a third party emails us with our own data.

**Diagnose:**
1. **Contain first.** Rotate Clerk keys, Vercel env vars, DB credentials.
2. Snapshot AuditLog table to S3 (read-only).
3. Identify the attack vector: leaked token, dependency CVE, phishing.

**Mitigate:**
- Force-logout all sessions via Clerk Dashboard.
- Rotate DB password + restart app.
- Disable integrations that may have been compromised.

**Escalate:**
- Within **24 hours**: notify all affected customers via email.
- Within **72 hours**: notify EU customers per GDPR Art. 33.
- File with relevant regulators if scope crosses thresholds.

**Post-mortem (within 7 days):**
- Full timeline + root cause + customer notification log.
- Add regression test for the specific attack vector.

---

## 7. Chrome extension misbehaving

**Symptoms:**
- Customers report missing transcripts, duplicate posts, or 401s from the bridge.
- Sentry spike on `/api/transcribe/live`.

**Diagnose:**
1. Check extension version: `chrome://extensions` → Gauge → version.
2. Inspect network tab on a Meet call.
3. Confirm the bridge (`background.js → handleCaptionsMessage`) is firing.

**Mitigate:**
- Push a hotfix extension version. Chrome Web Store allows emergency updates within hours.
- If bridge is broken: ship a "disabled mode" that shows a banner in the extension popup.
- Verify rate-limit headers on `/api/transcribe/live` aren't blocking customers.

**Escalate:**
- Direct customers to the new version via in-app email.

**Post-mortem:**
- Did the regression test (`src/test/extension-bridge.test.ts`, 17 tests) catch this? If not, add a test for the missed path.

---

## 8. Vercel deploy failure / outage

**Symptoms:**
- `git push` triggers a deploy that hangs or 500s.
- Site returns 502/503 across all routes.

**Diagnose:**
1. Vercel dashboard → Deployments tab.
2. Check Vercel status (`vercel-status.com`).

**Mitigate:**
- Roll back to previous deployment: Vercel → Deployments → Promote previous.
- If Vercel is down: nothing we can do. Switch the in-app status to "investigating."

**Escalate:**
- Vercel support (paid plan = 24/7).

**Post-mortem:**
- Why did the failing deploy pass CI? Add a smoke-test job to the merge queue that hits `/api/health` post-deploy.

---

## 9. OpenAI quota exhausted

**Symptoms:**
- 429 errors from OpenAI on every call.
- `quota-guard.ts` should kick in and surface a friendly error.

**Diagnose:**
1. Check OpenAI dashboard → Billing → Usage.
2. `npx tsx scripts/check-openai.ts`.

**Mitigate:**
- Add credits to OpenAI account (manual step, owner action).
- Until done: every request returns 503 + clear "Out of AI credits, retrying in ~1h" message. Quota-guard logs to Sentry with tag `quota_exceeded`.
- Verify Groq fallback works.

**Escalate:**
- Owner adds credits. ETA: <30 min during business hours.

**Post-mortem:**
- Did quota-guard prevent surprise bills? Verify `src/lib/quota-guard.ts` test still passes.
- Add a billing alert at 80% of monthly cap in OpenAI dashboard.

---

## 10. Stripe-style webhook signature failure

**Symptoms:**
- Integration sync (HubSpot, Salesforce, Slack) silently fails.
- Sentry shows `webhook_signature_invalid` errors.

**Diagnose:**
1. Check the integration's webhook log in their dashboard.
2. Verify our `WEBHOOK_SIGNING_SECRET` env var matches the provider's.

**Mitigate:**
- Re-sync the integration from `/integrations`.
- If persistent: disable the integration (auto-sync) until secret is rotated.

**Escalate:**
- Provider support if their secret rotated without notice.

**Post-mortem:**
- Add a health check that fires a test webhook monthly.

---

## Communication templates

### In-app banner (status)

> We're currently investigating an issue affecting [feature]. Some users may see
> errors when [action]. We're working on a fix — updates will appear here.
> Last updated: [timestamp].

### Email to customers (Sev1, breach)

> Subject: Action required — security incident update
>
> Hi [name],
>
> On [date], we identified [brief, plain-English description]. We have
> [mitigated / contained / are investigating] the issue.
>
> What we know: [1-2 sentences]
> What we did: [1-2 sentences]
> What you should do: [optional — e.g. reset password]
>
> We'll update you within 24 hours. Reply to this email with questions.
>
> — [founder name], Gauge

### Status page post

> Title: [Service] degraded
> Body: [1-2 sentences on symptom + ETA]
> Affected: [route / feature]
> Started: [timestamp]
> Updated: [timestamp]

---

## Severity matrix

| Sev | Definition | Customer comms | On-call |
|---|---|---|---|
| **Sev1** | Data breach; >50% requests failing | Email within 72h + status page + in-app banner | Immediate, mobile-paged |
| **Sev2** | Single feature broken (e.g. transcription), workaround exists | Status page + in-app banner | Within 1h |
| **Sev3** | Cosmetic / single-customer | None required | Within 24h |

---

## Post-mortem template

```
# Incident [DATE] — [ONE-LINE TITLE]

**Severity:** Sev1 / Sev2 / Sev3
**Duration:** [start → resolved, in minutes]
**Customer impact:** [count, segment, what they saw]

## What happened
[2-3 sentences.]

## Root cause
[The actual reason, not the surface.]

## Why we didn't catch it sooner
[What guard was missing.]

## What we changed
- [PR / file / config change 1]
- [PR / file / config change 2]

## What we'll do next
- [ ] [Follow-up action with owner + ETA]
```