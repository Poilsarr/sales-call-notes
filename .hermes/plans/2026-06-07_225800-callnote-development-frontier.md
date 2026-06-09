# CallNote Pro — Development Frontier (Mirror)

Mirror of `docs/roadmap/DEVELOPMENT_FRONTIER.md` for plan-mode traceability.
Source of truth: `docs/roadmap/DEVELOPTIER_FRONTIER.md`

## Quick Reference

| Level | Theme | Hours | Status |
|---|---|---|---|
| 0 | Stop The Bleeding (real OpenAI + real DB) | 4-6 | NOT STARTED |
| 1 | Lock The Perimeter (RBAC, GDPR, webhooks) | ~16 | BLOCKED |
| 2 | Make The Intelligence Real (diarization, KG) | ~32 | BLOCKED |
| 3 | Integrations That Pay (OAuth, bot, Slack) | ~32 | BLOCKED |
| 4 | Performance & Reliability (E2E, CI, k6) | ~24 | BLOCKED |
| 5 | Sell The Product (SSO, public API, onb) | ~32 | BLOCKED |
| 6 | Production Hardening (SOC2, runbooks) | ~24 | BLOCKED |

**Total: ~164 hours, gated sequentially. No level starts until previous gate passes.**

## 12 Cross-Cutting Checks (apply to every level)

CHECK-01: tsc --noEmit clean
CHECK-02: npm test green
CHECK-03: No new mock without // TODO: REAL
CHECK-04: No secrets in code
CHECK-05: Sentry PII scrubbing not bypassed
CHECK-06: Clerk auth required on protected routes
CHECK-07: Rate limit applied to public APIs
CHECK-08: Prisma changes require migration
CHECK-09: Paddle/Stripe webhook signatures verified
CHECK-10: Chrome extension manifest versioning
CHECK-11: Bundle size watch (250KB First Load JS max)
CHECK-12: CSP header compatibility

See `docs/roadmap/DEVELOPMENT_FRONTIER.md` for full details and per-level plans.
