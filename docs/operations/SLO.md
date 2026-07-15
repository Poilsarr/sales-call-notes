# SLOs and Error Budget — Gauge

> **Last reviewed:** 2026-06-20.
> Owner: founder (today).

## SLOs

| Surface | SLO | Measurement |
|---|---|---|
| Marketing site (`/`, `/pricing`, `/demo`) | 99.9% availability, p95 < 500ms | Vercel Analytics + k6 |
| App authenticated routes (`/app/**`) | 99.5% availability, p95 < 1000ms | Vercel Analytics + k6 |
| API authenticated routes | 99.5% availability, p95 < 1000ms | Vercel Analytics + k6 |
| `/api/transcribe/live` (chrome ext) | 99% availability, p95 < 1500ms | Sentry + chrome ext logs |
| `/api/health` | 99.95% availability | Better Stack uptime |

## Error budget

Per-quarter error budget per surface = `(1 - SLO) × quarter-minutes`.

Example for `/app/**` (SLO 99.5%): budget = `0.5% × 131400 min ≈ 657 min/quarter`.
We burn this on incidents, deploy rollbacks, and provider outages.

When budget burn rate exceeds **2x** the pro-rated weekly allowance, we
freeze non-critical deploys until burn rate normalizes.

## Currently burning

| Surface | This-month burn | Cause |
|---|---|---|
| `/api/transcribe/live` | ~30 min | None yet (track) |
| `/app/calls/[id]` | ~10 min | One 500 incident during schema migration |

We are within budget as of 2026-06-20.