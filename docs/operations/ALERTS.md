# Alerts — CallNote Pro

> **Last reviewed:** 2026-06-20.
> Owner: founder (today). Each alert must have an action target and a runbook link.

## Catalog

| Name | Severity | Trigger | Window | Action |
|---|---|---|---|---|
| High error rate | High | > 0.5% transactions return 5xx | 5 min | PagerDuty + email fallback |
| Slow transactions | Medium | p95 duration > 1000ms | 5 min | Slack |
| Quota exceeded (AI) | High | > 5 events tagged `quota_exceeded` | 1 min | Slack |

## How to deploy these

Two paths:

### Option A — Sentry UI (manual, fast)

1. Visit Sentry → Alerts → Create Alert.
2. For each rule in [`scripts/sentry-alerts.mjs`](../../scripts/sentry-alerts.mjs), create one alert in the UI.
3. Configure the PagerDuty + Slack integrations under Settings → Integrations.

### Option B — `sentry-cli` (scripted, slower to set up, easier to maintain)

```bash
# Generate the rules JSON
node scripts/sentry-alerts.mjs > /tmp/sentry-alerts.json

# Apply via sentry-cli (requires SENTRY_AUTH_TOKEN with alert:write scope)
export SENTRY_AUTH_TOKEN=...
export SENTRY_ORG=callnotepro
export SENTRY_PROJECT=callnote-pro
sentry-cli alerts new-rules /tmp/sentry-alerts.json
```

## Required env vars

For the script to fill in the action targets, set these in `.env.local`:

```
PAGERDUTY_SERVICE_KEY=<integration key from PagerDuty service>
SLACK_OPS_WEBHOOK=<Slack incoming webhook URL>
OPS_EMAIL=founder@callnotepro.com
```

When unset, the script emits placeholder strings; replace manually before applying.

## Validation

To validate the rules fire correctly:

1. Open Sentry → Alerts → click the rule → "Test Rule".
2. Or trigger a real event: spin up the staging app, hit `/api/calls` with a malformed payload 100 times in 60s — this should trip the "high error rate" rule.

## Adding a new alert

1. Add a row to the table above with: name, severity, trigger, window, action, runbook link.
2. Add a matching entry to `scripts/sentry-alerts.mjs`.
3. Open a PR with both changes.
4. After merge, apply via UI or `sentry-cli`.