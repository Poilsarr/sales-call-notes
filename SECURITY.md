# Security at CallNote Pro

> **Last reviewed:** 2026-06-20.
> This is the customer-facing security page. For internal audit notes, see
> `SECURITY_AUDIT.md`. For compliance posture, see `docs/compliance/`.

CallNote Pro is a sales-call transcription + analysis service. We handle
sensitive business conversations and treat your data accordingly. This page
describes what we do and what we don't do.

## Our commitment in one sentence

> We encrypt your data in transit and at rest, restrict access by role,
> log every admin action, and let you delete everything — including backups —
> within 90 days of you asking.

## What's in scope

- **Call recordings, transcripts, and analyses** you upload.
- **Account data**: email, name, profile picture (from Clerk).
- **OAuth tokens** for the integrations you connect (HubSpot, Salesforce, Google, Slack, Teams).
- **Billing data**: Paddle customer ID + subscription ID. We never see your card number.

## What's NOT in scope

- **Real-time meeting audio** that flows through Google Meet / Zoom when you
  use our chrome extension. The extension captures only the captions track
  and discards raw audio.

---

## 1. Encryption

| Where | How |
|---|---|
| In transit | TLS 1.2+ on every endpoint. HSTS enabled. |
| At rest (database) | AES-256 via Neon's managed Postgres. |
| At rest (backups) | Same — Neon encrypted snapshots. |
| In your browser | HTTP-only secure cookies for the Clerk session. |

## 2. Authentication

- Powered by **Clerk**. We use their hosted UI; we don't roll our own auth.
- Supports **TOTP MFA** and **passkeys** (FIDO2). We strongly recommend enabling MFA.
- Password requirements: Clerk defaults (12+ characters, breach-list check).

## 3. Access control

- Per-team **RBAC** with four roles: OWNER > ADMIN > MEMBER > VIEWER.
- Every protected API route (`/api/calls`, `/api/team`, `/api/integrations`,
  `/api/billing`) checks the caller's role before reading or writing.
- **You cannot read another team's data.** The team ID is derived from your
  Clerk session, never trusted from the request body.

## 4. Audit logging

- Every team-admin action (member add/remove, role change, branding update,
  integration connect/disconnect, billing change, account deletion) writes
  an entry to the `AuditLog` table.
- Audit entries are retained for at least **90 days** and visible to
  team OWNERs in the Team dashboard.

## 5. Rate limiting

- Per-user rate limits via Upstash Redis.
- Anonymous endpoints are limited at the edge before they touch our database.
- Limits scale by plan: FREE = 5 calls/day, PRO = 100/day, BUSINESS = unlimited.

## 6. Input validation

- All API routes validate the request body shape (Zod-style hand-rolled
  validators; see `src/lib/*`).
- File uploads are size- and type-checked; magic bytes, not just MIME.
- Brand color and logo URLs (team branding) are validated against
  regexes (`#hex` and `https://` only) to prevent XSS via CSS / `<img>`.

## 7. Sub-processors

We use a small set of carefully vetted sub-processors. The current list,
with their SOC2 status, is at [`docs/compliance/VENDORS.md`](./docs/compliance/VENDORS.md).
We notify customers **30 days** before adding a new sub-processor that
touches Personal Data.

## 8. Your data, your rights

| Right | How |
|---|---|
| Export | `Settings → Privacy → Export my data` (downloads a JSON archive). |
| Delete | `Settings → Privacy → Delete my account` (7-day soft, then hard-delete within 30 days). |
| Rectify | Edit directly in the UI for most fields; otherwise contact support. |
| Object | Email `support@callnotepro.com`. We respond within 30 days. |

## 9. Incident response

- On-call rotation: solo founder today (24/7 mobile-paged for Sev1).
- **Notification SLA: 72 hours** to affected customers after we confirm a
  Personal Data breach.
- Full incident template is in `docs/operations/RUNBOOK.md`.

## 10. What we DON'T promise (yet)

We are **not** SOC2 certified today. Our current readiness is documented in
[`docs/compliance/SOC2_READINESS.md`](./docs/compliance/SOC2_READINESS.md).
We are working toward SOC2 Type 1 in 2026 H2.

We are **not** HIPAA-eligible. We do not sign BAAs for PHI.

We do **not** perform customer-managed encryption (BYOK). If you need BYOK,
contact us — it's on the v2 roadmap behind an enterprise contract.

---

## Reporting a vulnerability

Email `security@callnotepro.com` (placeholder). We respond within 5 business
days. We do not currently run a paid bug-bounty program.

## Contact

- General: `support@callnotepro.com`
- Security: `security@callnotepro.com`
- Privacy / DPA: `privacy@callnotepro.com`