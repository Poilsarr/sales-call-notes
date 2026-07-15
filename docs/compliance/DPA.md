# Data Processing Addendum (DPA) Template — Gauge

> **Status:** TEMPLATE. Not legally signed. Review by counsel before sending to customers.
> This document describes the data flows + sub-processors so a customer
> can do their own vendor due diligence without an NDA.

---

## 1. Definitions

- **"Customer"** — the business entity that has accepted Gauge's Terms of Service and to whom Gauge provides the Service.
- **"Controller"** — the Customer, who determines the purposes and means of processing Personal Data.
- **"Processor"** — Gauge (operated by Kushagarh Singh), who processes Personal Data on the Controller's behalf.
- **"Personal Data"** — has the meaning given in GDPR Art. 4(1), including call recordings, transcripts, names, emails, and any other identifiable information uploaded to the Service.
- **"Service"** — the Gauge software-as-a-service platform at usegauge.vercel.app.

## 2. Scope and Roles

Gauge is the **Processor** of Personal Data uploaded by the Controller
through the Service. Gauge does not determine the purposes for which
Personal Data is processed; the Controller does.

## 3. Processing Details

| Item | Detail |
|---|---|
| Subject matter | Transcription + analysis of sales call recordings |
| Duration | Duration of the Customer's subscription + 30 days for off-boarding |
| Nature | Storage, AI transcription, summarization, CRM sync, search |
| Purpose | As instructed by the Controller via the Service UI / API |
| Categories of data | Audio recordings, transcripts, names, emails, employer, role |
| Categories of data subjects | Sales reps, prospects, customers named in calls |

## 4. Sub-Processors

Gauge engages the following sub-processors. The Controller is notified
via the in-app notification + a changelog entry at least 30 days before any new
sub-processor is added. The Controller may object; on objection, Gauge
will work in good faith to provide an alternative.

| Sub-processor | Purpose | Region | DPA / SOC2 status |
|---|---|---|---|
| **Vercel Inc.** | Application hosting | US (multi-region) | SOC2 Type 2, DPA available |
| **Neon (Databricks)** | Postgres database hosting | US | SOC2 Type 2, DPA available |
| **Clerk** | Authentication | US | SOC2 Type 2, DPA available |
| **OpenAI, L.L.C.** | LLM (transcription, summarization, analysis) | US | DPA available; data NOT used for training |
| **Groq, Inc.** | LLM fallback | US | DPA available |
| **Upstash** | Redis (rate limits, queues) | US / EU | SOC2 Type 2 |
| **HubSpot / Salesforce / Google / Slack / Microsoft** | Customer-initiated integrations | Per customer | Customer-managed; covered by their own agreements |
| **Resend / Postmark** (planned) | Transactional email | US | DPA available |

> Last reviewed: 2026-06-20. Maintain a current list at `docs/compliance/VENDORS.md`.

## 5. Data Location

- Primary database: **US** (Neon, AWS us-east-1).
- Application hosting: **US** (Vercel, default region iad1).
- LLM calls: **US** (OpenAI / Groq US endpoints).
- Customer may request EU routing via Vercel Frankfurt region + Neon EU branch — contact support.

## 6. Security Measures

Gauge implements the technical and organizational measures listed in
`SECURITY.md` and `SECURITY_AUDIT.md`, including:

- HTTPS-only transit (TLS 1.2+).
- AES-256 encryption at rest (Neon default).
- Per-tenant RBAC with OWNER > ADMIN > MEMBER > VIEWER.
- Audit log of team and admin actions (90-day retention minimum).
- PII scrubbing on all error reports (Sentry).
- Webhook signature verification on all inbound integrations.
- Quarterly dependency vulnerability review.
- Annual access review (post-first-hire).

## 7. Customer Rights (GDPR)

The Controller may exercise data-subject rights through the Service UI:

- **Right of access** — `GET /api/user/export` returns a JSON archive of all data tied to the requesting user.
- **Right to rectification** — edit calls, transcripts, and account fields directly in the UI.
- **Right to erasure** — `DELETE /api/user/delete` initiates a 7-day soft-delete followed by hard-delete. Hard-delete runs within 30 days.
- **Right to data portability** — same `/api/user/export` endpoint emits machine-readable JSON.
- **Right to object / restrict processing** — submit via `support@usegauge.com` (placeholder); we respond within 30 days.

## 8. Breach Notification

Gauge will notify the Controller of a Personal Data breach without undue
delay and in any event within **72 hours** of becoming aware of it.
Notification will be sent to the Controller's account email and posted in-app.

## 9. Return / Deletion at End of Subscription

Within 30 days of subscription termination, all Personal Data tied to the
Controller is hard-deleted from primary storage. Backups rotate out within
90 days. An attestation is available on request.

## 10. Audits

The Controller may request evidence of compliance with this DPA, including:

- Up-to-date sub-processor list (`docs/compliance/VENDORS.md`).
- Most recent internal security review (`SECURITY_AUDIT.md`).
- Summary of in-progress items (`docs/compliance/SOC2_READINESS.md`).

Formal SOC2 Type 1 audit is in scope for 2026 H2; see `SOC2_READINESS.md`.

## 11. Governing Law

This DPA is governed by the laws of the State of Delaware, USA, without
regard to conflict-of-laws principles.

---

**Review notes:**
- Section 3 (categories of data) is conservative — confirm with counsel before enterprise sales.
- Section 5 (data location) currently reflects single-region US. EU-routing
  feature is on the v2 backlog.
- This document does NOT yet cover **HIPAA** or **CCPA-specific** obligations.
  Those are separate addenda.