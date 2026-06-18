# Load Test Results

## Baseline

Date:
Duration: 5 min
VUs: 100 (ramp-up over 30s)
Target RPS: 5

## Results

| Endpoint | p50 | p95 | p99 | Error Rate |
|---|---|---|---|---|
| GET /api/calls | | | | |
| GET /api/calls/:id | | | | |
| GET /api/analytics | | | | |

## Notes

- Run with: `k6 run scripts/load-test.js`
- Auth: pass `AUTH_TOKEN` env var for authenticated endpoints (all API routes require Clerk auth)
- Target: p95 < 200ms, error rate < 0.1%
- Ensure server is running in production mode: `npm run build && npm start`
- Replace `/api/analytics` with a lightweight public endpoint if one is created (e.g., `/api/health`)
