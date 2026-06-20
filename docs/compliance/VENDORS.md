# VENDORS — Sub-Processor Inventory

> **Status:** Initial draft. Confirm SOC2 status links before sending to enterprise customers.
> Last reviewed: 2026-06-20.

Each row: vendor · purpose · data shared · region · security attestations.

| Vendor | Purpose | Data shared | Region | Compliance | Status |
|---|---|---|---|---|---|
| Vercel Inc. | Application hosting, CDN, edge functions | All app data (transient) | US (multi-region: iad1, sfo1) | SOC2 Type 2, ISO 27001, DPA | ✓ active |
| Neon (Databricks) | Postgres database | Customer content + account data | US (AWS us-east-1) | SOC2 Type 2, ISO 27001, DPA, HIPAA-eligible | ✓ active (free tier) |
| Clerk (Clerk.com) | Authentication, user identity | Email, name, OAuth profile | US | SOC2 Type 2, DPA | ✓ active |
| OpenAI, L.L.C. | LLM transcription + analysis | Anonymized transcripts (no PII to OpenAI when scrubber enabled) | US | SOC2 Type 2, DPA; data NOT used for training | ✓ active (quota-limited) |
| Groq, Inc. | LLM fallback | Same as OpenAI | US | SOC2 Type 2, DPA | ✓ active |
| Upstash | Redis (rate limits, BullMQ queues) | Per-user counters, queue jobs | US / EU available | SOC2 Type 2, DPA | ✓ active |
| HubSpot | CRM (customer-initiated) | Per customer OAuth scope | US / EU | Customer-managed | conditional — only when customer connects |
| Salesforce | CRM (customer-initiated) | Per customer OAuth scope | US / EU | Customer-managed | conditional |
| Google Calendar / Drive | Calendar + docs (customer-initiated) | Per customer OAuth scope | US / EU | Customer-managed | conditional |
| Slack | Messaging (customer-initiated) | Per customer OAuth scope | US | Customer-managed | conditional |
| Microsoft Teams | Meetings (customer-initiated) | Per customer OAuth scope | US / EU | Customer-managed | conditional |
| Resend / Postmark | Transactional email (planned) | Account email, support replies | US | SOC2 Type 2, DPA | planned — not yet enabled |

## Change Log

- 2026-06-20: Initial inventory.
- Backfill next: confirm OpenAI DPA URL, Groq DPA URL, Upstash DPA URL.

## Customer-Facing Promise

We notify customers **30 days** before adding a new sub-processor that touches
Personal Data. Notification goes via in-app banner + email to the account owner.
Customers may object; on objection, we will either remove the sub-processor or
work in good faith to provide a Customer-configurable alternative.