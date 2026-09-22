# LEAD-CAPTURE-PLAN — Email capture on high-intent CTAs

Date: 2026-09-21. Goal: anonymous PostHog visitors become identified persons via email capture; every lead stored with consent proof, rate-limited, GDPR-covered.

## Current state (explore wave)

- Zero marketing CTAs have an email field (17 touchpoints mapped, all `Link /sign-up`). Only email inputs: `partners/apply` (pre-login) and settings (authed).
- `trackEvent` pipe (`src/lib/analytics.ts:109-127`) dual-fires Vercel + PostHog; `$set` passthrough exists (`src/lib/posthog.ts:16-33`) but no pre-login `$set` path.
- No Lead model; `User` needs `clerkId`, `PartnerApplication` is wrong semantics. No captcha/honeypot anywhere; rate limiter fail-open; `partners/apply` has no rate limit at all; middleware matcher excludes it from edge limiting.
- GDPR export/delete are userId-keyed only; Resend has no confirm/unsubscribe mailer.

## Design

- New `EmailLead {email unique lowercased, source, ctaId, status pending|confirmed|unsubscribed, consentAt, confirmTokenHash?, confirmedAt?, unsubscribedAt?}` + migration.
- New public `POST /api/leads {email, source, ctaId, website? honeypot, distinctId?}`: zod validation, IP-keyed `leads` bucket (5/hour), honeypot reject, idempotent re-POST (same email → 200 same id), audit log with null/SYSTEM user, never log raw email to Sentry.
- Frontend: exit-intent modal (`src/components/exit-intent-modal.tsx`) gains email field (highest intent, already tracked `pricing_exit_intent_shown/click`); on success calls new `identifyPostHogLead(email)` (`$identify` with `$anon_distinct_id` + `$set:{email}`) — no raw email in event props.
- Confirm email via existing Resend `send()` helper (`sendLeadConfirmEmail`); standalone `/api/leads/confirm?token=` + `/unsubscribe`; EmailLead included in GDPR export/delete.
- Phase 1 (this wave): model + route + modal + identify + tests. Phase 2 (follow-up): confirm/unsubscribe routes + GDPR wiring.

## Execute wave (DISJOINT)

- **Executor A — backend**: `prisma/schema.prisma` + migration, `src/app/api/leads/route.ts` (new), `src/lib/rate-limit.ts` (leads bucket), route test (new). Verify: `npx vitest run` new suite, `npx tsc --noEmit`.
- **Executor B — frontend+analytics**: `src/components/exit-intent-modal.tsx`, `src/lib/posthog.ts` (add `identifyPostHogLead`), `src/lib/analytics.ts` (lead event types if needed), modal/posthog tests. Verify: targeted vitest + tsc.
- **Executor C — confirm+GDPR** (only after A green): `src/services/email.ts` (`sendLeadConfirmEmail`), confirm/unsubscribe routes, `src/lib/gdpr-export.ts` + delete route inclusion, tests. Verify: targeted vitest + tsc.

Orchestrator edits nothing in execute wave.

## Gate before push

`npx vitest run && npx next build`, tsc, lint, scoped adds, single-concern commit + PR (admin squash), frontier row. Live proof: submit test email on local exit-intent → 201 → PostHog person identified → row in DB with source + consentAt.
