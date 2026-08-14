# Performance Budgets

## Target
- First Load JS: < 250 KB per route
- Total Bundle: < 500 KB baseline

## Per-Route Budgets

| Route | Budget (KB) | Notes |
|---|---|---|
| / | 250 | Landing page |
| /dashboard | 250 | Main app |
| /billing | 200 | Billing page |
| /settings | 200 | Settings |
| /team | 200 | Team management |
| /integrations | 200 | Integrations |
| /pricing | 250 | Pricing page |
| /features | 250 | Features page |
| /sign-in | 150 | Auth page |
| /sign-up | 150 | Auth page |

## Audit Command
```bash
npm run perf:audit
```

## Lighthouse CI (hard gate, shipped 2026-08-14)

Runs `npx lhci autorun` on every PR (`.github/workflows/lighthouse.yml`), desktop preset, 1 run per URL, on 5 public URLs: `/`, `/api-docs`, `/security`, `/privacy`, `/vs/gong`. Assertions in `.lighthouserc.js` (thresholds grounded in the 2026-08-14 local proof LHRs, evidence in `.lighthouseci/`):

| Assertion | Level | Threshold | Proof local | Headroom |
|---|---|---|---|---|
| performance | error | 0.85 | 96–100 | wide |
| accessibility | error | 0.85 | 91–96 | ~6 pts |
| best-practices | error | 0.70 | 74 | ~4 pts — monitor first CI run (Clerk-env audits) |
| seo | warn | 0.90 | 92 | warn only — blocked by meta-in-body P1 (see DEVELOPMENT_FRONTIER.md) |
| LCP | error | 2500 ms | 745–808 | ≈3× |
| CLS | error | 0.15 | 0.000–0.113 | ok |
| TBT | warn | 200 ms | 0 | warn only |
| total-byte-weight | error | 900,000 B | 784–807 KB | ~11% |

Reproduce locally: `REDIS_HOST=disabled REDIS_PORT=0 npx next build && npx lhci autorun` (needs Chrome). The workflow builds with the same dummy-env mirror as the green `ci.yml` Build job + `REDIS_HOST=disabled REDIS_PORT=0` (BullMQ queues build at module scope — `src/services/queue.ts:8-19` — and would otherwise ECONNREFUSED :6379, the old workflow's failure since 2026-07-16).

## Remediation
If any route exceeds budget:
1. Check for large imports
2. Use dynamic imports with `next/dynamic`
3. Lazy-load heavy components (charts, editors)
4. Split vendor bundles
