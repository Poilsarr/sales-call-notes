# SOC2 Readiness — Gauge

> **Status:** NOT READY. This is a gap inventory against SOC2 Type 1 controls.
> Goal: know exactly what we have, what we lack, and who owns closing each gap.
> Last reviewed: 2026-06-20.

---

## Scope

Gauge handles three categories of customer data:

1. **Customer content**: uploaded call recordings + transcripts + AI-generated analyses.
2. **Customer account data**: email, Clerk-managed identity, team membership, billing plan.
3. **Customer integration data**: OAuth tokens for HubSpot, Salesforce, Google, Slack, Teams; CRMs synced contact IDs.

All processing runs on **Vercel (Next.js)** + **Neon (Postgres)** + **Upstash (Redis)** + **OpenAI/Groq (LLM)**.

---

## Trust Service Criteria — Gap Inventory

Legend: `✓` implemented · `~` partial · `✗` gap · `n/a` not applicable.

### CC1 — Control Environment

| Control | Status | Evidence | Owner / Gap |
|---|---|---|---|
| Code of conduct published | ✗ | n/a | Solo founder. Document in `docs/operations/CONDUCT.md` before adding first employee. |
| Org chart / reporting lines | ✗ | n/a | Same as above. |
| Background checks for employees | n/a | Solo founder. Re-evaluate on first hire. | — |

### CC2 — Communication & Information

| Control | Status | Evidence | Owner / Gap |
|---|---|---|---|
| Security policy communicated to customers | ~ | `SECURITY.md`, `SECURITY_AUDIT.md` | Pull `SECURITY.md` to root + add badge. |
| Status page accessible to customers | ✗ | None | Subscribe to Better Stack or Statuspage before beta launch. |
| Incident notification template | ✗ | n/a | Create `docs/operations/INCIDENT_NOTIFICATION.md`. |

### CC3 — Risk Assessment

| Control | Status | Evidence | Owner / Gap |
|---|---|---|---|
| Annual risk assessment | ✗ | None | Q4 2026: vendor risk + key customer risk register. |
| Penetration test | ✗ | None | Pre-Series-A budget line. |
| Dependency vulnerability scanning | ~ | npm + Vercel auto-patches | Add `npm audit --audit-level=high` to CI. |

### CC6 — Logical & Physical Access

| Control | Status | Evidence | Owner / Gap |
|---|---|---|---|
| RBAC on all customer data endpoints | ~ | `src/lib/rbac.ts`, role hierarchy OWNER>ADMIN>MEMBER>VIEWER | Verify each `src/app/api/**` route calls `requireRole` (CI grep gate). |
| Strong authentication (MFA) | ✓ | Clerk supports TOTP + passkeys; customers opt-in | Document MFA recommendation in onboarding. |
| Production database access restricted | ~ | Neon branch protection; Vercel env-var secrets | Document the access path in `docs/operations/DB_ACCESS.md`. |
| Secrets not in source | ✓ | `gitleaks` baseline in CI (manual review); `.env` ignored | Add automated `gitleaks` action. |
| Encryption at rest | ✓ | Neon AES-256 by default | Document. |
| Encryption in transit | ✓ | HTTPS-only (Vercel + Neon + Upstash) | Document. |

### CC7 — System Operations

| Control | Status | Evidence | Owner / Gap |
|---|---|---|---|
| Centralized logging | ✓ | Vercel runtime logs + Sentry (when DSN set) | Wire Sentry DSN to Vercel. |
| Error monitoring with alerts | ~ | `sentry.{client,server,edge}.config.ts` | PR #50 will add alert rules. |
| Uptime monitoring | ~ | `/api/health` endpoint shipped (PR #46) | Subscribe Better Stack to `/api/health`. |
| Change management (PRs required) | ✓ | `main` branch protected; 3 required CI checks | — |
| Backup & restore tested | ✗ | Neon auto-backup on paid plan | Upgrade Neon OR script `pg_dump` cron. PR #52 candidate. |
| Runbook for incidents | ✗ | n/a | PR #49 will close this. |

### CC8 — Change Management

| Control | Status | Evidence | Owner / Gap |
|---|---|---|---|
| All production changes via PR | ✓ | Branch protection | — |
| PR review required | ✗ (configurable) | Repo setting | Enable "Require review" before beta launch. |
| CI must pass before merge | ✓ | 3 required checks (Tests, Lint, Build) | — |
| Audit log of sensitive actions | ~ | `src/lib/audit-logger.ts` writes to `AuditLog` table | Verify team.branding.update, billing.cancel, GDPR export/delete all log. |

### CC9 — Risk Mitigation

| Control | Status | Evidence | Owner / Gap |
|---|---|---|---|
| Vendor due diligence | ✗ | n/a | Maintain `docs/compliance/VENDORS.md` listing OpenAI, Groq, Neon, Clerk, Upstash, Vercel + their SOC2 status. |

---

## Customer-Facing Controls (already implemented)

| Control | Where |
|---|---|
| GDPR right to export | `GET /api/user/export` (PR #44) |
| GDPR right to delete (7-day soft + hard) | `DELETE /api/user/delete` (PR #44) |
| Per-user rate limiting | `src/lib/rate-limit.ts` (calls + analyze endpoints) |
| PII scrubbing in error reports | `src/lib/sentry.ts` `scrubValue()` |
| Webhook signature verification | `src/lib/webhooks/verify.ts` (HubSpot, Salesforce) |
| HTTPS-only asset URLs | Validated in team branding endpoint |
| Audit log of team/admin actions | `AuditLog` model + `logAuditAction` |

---

## Gaps Ranked by Closing Cost

| # | Gap | Effort | Blocker for beta? |
|---|---|---|---|
| 1 | Status page (Better Stack free tier) | 1h | YES |
| 2 | Document DB access path | 30m | no |
| 3 | Add `gitleaks` to CI | 1h | no |
| 4 | Vendor due diligence doc | 2h | YES (due-diligence questionnaire) |
| 5 | Runbook (PR #49) | 2h | YES |
| 6 | Alert rules (PR #50) | 1h | YES |
| 7 | Backup/restore tested | depends on Neon plan | YES |
| 8 | Pen test | $$ | no (post-Series-A) |

---

## Path to "SOC2 Ready" (Type 1)

Sequence:

1. Close YES blockers above (status page, vendor doc, runbook, alerts, backup).
2. Engage Vanta / Drata / Secureframe for evidence collection.
3. Select SOC2 auditor (Vanta gives a list; ~$15-30k Type 1).
4. Observation window: 1-3 months.
5. Audit + report.

Realistic timeline: **3-6 months from today**, ~$20-40k spend.
This is a **post-Series-A** activity. **Do NOT promise SOC2 to customers before then.**

---

## Customer Promise

Until SOC2 Type 1 is in hand, **never claim SOC2 in marketing copy, sales calls, or contracts.**
The `/security` page may list the controls we *implement* but must not say
"Gauge is SOC2 compliant" or any close paraphrase.