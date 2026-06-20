#!/usr/bin/env node
/**
 * Sentry alert rule generator (Level 6.4).
 *
 * Outputs the JSON definitions for the three production alert rules we run:
 *   1. Error rate > 0.5% for 5 minutes
 *   2. p95 transaction latency > 1000ms for 5 minutes
 *   3. Quota-exceeded events (rate-limit from upstream AI provider) > 5/min
 *
 * Usage:
 *   node scripts/sentry-alerts.mjs > sentry-alerts.json
 *   # Then either:
 *   # (a) paste the JSON into Sentry → Alerts → Create Alert → "Issues" or "Metric"
 *   # (b) pipe to sentry-cli:
 *   sentry-cli alerts new-rules sentry-alerts.json
 *
 * Each rule is documented with its severity, runbook link, and the team
 * that should own it.
 */

const RULES = [
  {
    name: "CallNote Pro — high error rate",
    description:
      "More than 0.5% of transactions in a 5-minute window produced a 5xx. Pages on-call.",
    severity: "high",
    runbook: "docs/operations/RUNBOOK.md",
    owner: "founder",
    conditions: [
      {
        id: "event.type:transaction",
        name: "All transactions",
      },
    ],
    filter: {
      key: "event.outcome",
      match: "eq",
      value: "internal_error",
    },
    window: { interval: 5, unit: "minute" },
    threshold: { type: "pct", value: 0.5 },
    action: {
      type: "pagerduty",
      target: process.env.PAGERDUTY_SERVICE_KEY ?? "<set PAGERDUTY_SERVICE_KEY>",
      fallback: { type: "email", target: process.env.OPS_EMAIL ?? "founder@callnotepro.com" },
    },
  },
  {
    name: "CallNote Pro — slow transactions (p95 > 1s)",
    description:
      "p95 transaction duration exceeds 1000ms for 5 minutes. Slack-only alert.",
    severity: "medium",
    runbook: "docs/operations/RUNBOOK.md",
    owner: "founder",
    conditions: [
      {
        id: "event.type:transaction",
        name: "All transactions",
      },
    ],
    aggregation: { function: "p95", field: "event.duration" },
    window: { interval: 5, unit: "minute" },
    threshold: { type: "value", value: 1000 },
    action: {
      type: "slack",
      target: process.env.SLACK_OPS_WEBHOOK ?? "<set SLACK_OPS_WEBHOOK>",
    },
  },
  {
    name: "CallNote Pro — quota exceeded (AI provider)",
    description:
      "More than 5 events tagged kind=quota_exceeded per minute. Indicates OpenAI/Groq limit hit. Check billing.",
    severity: "high",
    runbook: "docs/operations/RUNBOOK.md#9-openai-quota-exhausted",
    owner: "founder",
    conditions: [
      {
        id: "event.type:error",
        name: "All error events",
      },
    ],
    filter: {
      key: "tags.kind",
      match: "eq",
      value: "quota_exceeded",
    },
    window: { interval: 1, unit: "minute" },
    threshold: { type: "count", value: 5 },
    action: {
      type: "slack",
      target: process.env.SLACK_OPS_WEBHOOK ?? "<set SLACK_OPS_WEBHOOK>",
    },
  },
];

// Emit JSON in the shape `sentry-cli alerts new-rules` expects.
const out = {
  rules: RULES.map((r) => ({
    name: r.name,
    conditions: r.conditions,
    filters: r.filter ? [r.filter] : [],
    aggregation: r.aggregation ?? { function: "count" },
    timeWindow: r.window.interval,
    timeWindowUnit: r.window.unit,
    threshold: r.threshold,
    actions: [r.action],
  })),
  // Human-readable parallel catalog for documentation use.
  catalog: RULES,
};

console.log(JSON.stringify(out, null, 2));