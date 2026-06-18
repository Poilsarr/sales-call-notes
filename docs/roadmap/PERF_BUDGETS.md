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

## Remediation
If any route exceeds budget:
1. Check for large imports
2. Use dynamic imports with `next/dynamic`
3. Lazy-load heavy components (charts, editors)
4. Split vendor bundles
