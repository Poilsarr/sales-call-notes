# VISITOR-PIPELINE-PLAN — Full visitor pipeline (anonymous → lead)

Scope: user chose "Full visitor pipeline" for visitor tracking. One concern only: visitors. Paddle excluded.

## Current state (facts)
- Capture: `src/lib/posthog.ts:16-33` raw `fetch ${host}/capture/` with `{api_key, event, properties:{distinct_id, $lib:"gauge-web"}}`. No posthog-js dep.
- Pageview: `src/components/posthog-provider.tsx:39-42` → `capturePostHogPageview(pathname)` `src/lib/posthog.ts:71-74` sends only `{$current_url, pathname}`.
- Identify: Clerk `src/components/posthog-provider.tsx:29-32` → `identifyPostHogUser` `src/lib/posthog.ts:53-61`; lead email `src/components/exit-intent-modal.tsx:84` → `identifyPostHogLead` `src/lib/posthog.ts:40-51`. Exit modal is pricing-only `src/components/pricing-client.tsx:748`, desktop-only, session-once.
- Leads API: `src/app/api/leads/route.ts:7-17` accepts `distinctId` but drops it (`:13-16` comment). Stores `EmailLead{email,source,ctaId,status:pending}` `prisma/schema.prisma:400-415`. Tests: `src/test/api/leads-route.test.ts`, `src/lib/posthog.test.ts`.

## Goal
Track every visitor (pages, referrer, UTM, viewport) + site-wide email capture that joins `EmailLead ↔ PostHog person` via persisted `distinctId`/attribution. No Paddle, no posthog-js swap.

## Executor A — frontend/analytics (DISJOINT, no backend files)
Files: `src/lib/posthog.ts`, `src/lib/posthog.test.ts`, `src/components/footer-lead-form.tsx` (new, client), `src/components/site-footer.tsx`, `src/components/footer-lead-form.test.tsx` (new)
1. `capturePostHogPageview`: add `document.referrer` → `$referrer`, parse `location.search` UTMs (`utm_source/medium/campaign/content/term`) only when present, `viewport_w/h`, keep `$current_url/pathname`. Cap lengths (URL 1024, UTM 128). Never include email.
2. `identifyPostHogLead`: keep anon-id-preserving behavior, accept optional attribution passthrough? No — keep signature `(email:string)` unchanged to avoid breaking exit-modal.
3. New `FooterLeadForm` client component: email input + POST `/api/leads` with `{email, source:"footer", ctaId:"footer-newsletter", distinctId:getPostHogDistinctId(), landingPage:location.href, referrer:document.referrer, utm_*}` then `identifyPostHogLead(email)` + `trackEvent("lead_captured",{source:"footer",ctaId:"footer-newsletter"})`. Reuse `EMAIL_RE` + idle/submitting/done/error states from exit-modal. No auto-popup.
4. `site-footer.tsx`: render `<FooterLeadForm/>` in brand column (server component → client child, no JS change to rest).
5. Tests: extend `posthog.test.ts` for UTM/referrer/viewport + no-email leak; new form test mocks fetch + posthog lib.
Verify: `npx vitest run src/lib/posthog.test.ts src/components/footer-lead-form.test.tsx src/components/exit-intent-modal.test.tsx` + `npx tsc --noEmit`

## Executor B — backend/db (DISJOINT, no frontend files)
Files: `prisma/schema.prisma`, `prisma/migrations/**/migration.sql` (new), `src/app/api/leads/route.ts`, `src/test/api/leads-route.test.ts`
1. `EmailLead`: add `distinctId String? @db.VarChar(128)`, `landingPage String? @db.VarChar(1024)`, `referrer String? @db.VarChar(1024)`, `utmSource/utmMedium/utmCampaign/utmContent/utmTerm String? @db.VarChar(128)`, `userAgent String? @db.VarChar(512)`. Add `@@index([distinctId])`. Keep email unique, no email in logs.
2. Migration SQL: `ALTER TABLE "EmailLead" ADD COLUMN ...` nullable, no backfill, no index concurrently (small table).
3. `route.ts`: extend `LeadSchema` with same optional fields (trim, max lengths matching schema), persist on create + idempotent update (only overwrite when caller provides new values, same pattern as source/ctaId `:97-103`). Derive `userAgent` server-side from `user-agent` header (never trust client), `ip` stays rate-limit-only (do NOT persist IP — privacy). Keep honeypot `:71-73`, fail-closed limiter `:77-86`, no-email-in-logs `:127-128`, audit `LEAD_CAPTURED` unchanged (no PII).
4. Tests: update create expectation to include new fields, idempotent update covers attribution refresh, honeypot + 400 + 429 + 500 unchanged, assert no raw email in audit/Sentry.
Verify: `npx prisma validate && npx vitest run src/test/api/leads-route.test.ts` + `npx tsc --noEmit`

## Gate (orchestrator)
`npx vitest run && npx next build`. Both green before push. Single-concern commit, docs row in `DEVELOPMENT_FRONTIER.md`.
