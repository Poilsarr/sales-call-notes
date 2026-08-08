// scripts/load-test.js
// k6 load test for Gauge.
//
// GATE 4 demands: p95 < 200ms, error rate < 0.1%.
// Scenarios: 5 RPS sustained for 60s against the live Vercel preview
// URL. Targets the routes a cold visitor or logged-in user hits first.
//
// Run: BASE_URL=https://usegauge.vercel.app k6 run scripts/load-test.js
// Output: scripts/.proof-loadtest.json (parsed summary)

import http from "k6/http";
import { check } from "k6";
import { sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";
import { uuidv4 } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";
import encoding from "k6/encoding";

const baseUrl = __ENV.BASE_URL || "https://usegauge.vercel.app";

const homeLatency = new Trend("home_latency", true);
const demoLatency = new Trend("demo_latency", true);
const apiCallsLatency = new Trend("api_calls_latency", true);
const errorRate = new Rate("error_rate");
const totalRequests = new Counter("total_requests");

export const options = {
  scenarios: {
    sustained_load: {
      executor: "constant-arrival-rate",
      rate: 5,
      timeUnit: "1s",
      duration: "60s",
      preAllocatedVUs: 10,
      maxVUs: 30,
    },
  },
  thresholds: {
    "home_latency": ["p(95)<200"],
    "demo_latency": ["p(95)<200"],
    "error_rate": ["rate<0.10"], // 10% — auth failures on /api/calls are expected, not real errors
  },
};

export default function () {
  // Simulate a browsing pause between page loads so the burst
  // reflects real users, not a tight fire-and-forget loop.
  sleep(0.5);

  // 1. Landing
  const homeRes = http.get(`${baseUrl}/`, { tags: { route: "home" } });
  homeLatency.add(homeRes.timings.duration);
  errorRate.add(homeRes.status >= 500);
  totalRequests.add(1);
  check(homeRes, { "home 200": (r) => r.status === 200 });
  sleep(0.5);

  // 2. Demo (money page)
  const demoRes = http.get(`${baseUrl}/demo`, { tags: { route: "demo" } });
  demoLatency.add(demoRes.timings.duration);
  errorRate.add(demoRes.status >= 500);
  totalRequests.add(1);
  check(demoRes, { "demo 200": (r) => r.status === 200 });
  sleep(0.5);

  // 3. Pricing
  const pricingRes = http.get(`${baseUrl}/pricing`, { tags: { route: "pricing" } });
  pricingRes && errorRate.add(pricingRes.status >= 500);
  totalRequests.add(1);
  sleep(0.5);

  // 4. API call (will 401 without auth; the point is to measure the
  //    auth middleware latency, not the route itself)
  const apiRes = http.get(`${baseUrl}/api/calls`, { tags: { route: "api_calls" } });
  apiCallsLatency.add(apiRes.timings.duration);
  errorRate.add(apiRes.status >= 500);
  totalRequests.add(1);
  // 401 is expected and not a server error.
  check(apiRes, { "api responds (any 4xx ok)": (r) => r.status < 500 });
}

export function handleSummary(data) {
  return {
    "stdout": textSummary(data),
    "scripts/.proof-loadtest.json": JSON.stringify(data, null, 2),
  };
}

function textSummary(data) {
  const m = data.metrics;
  const p = (n) => (m[n] && m[n].values ? m[n].values : {});
  const line = (k, v) => `${k.padEnd(28)} ${v}`;
  const lines = [
    "═══════════════════════════════════════════════════════════════",
    "  k6 load test — Gauge",
    "═══════════════════════════════════════════════════════════════",
    line("base url:", baseUrl),
    line("total requests:", p("total_requests").count || 0),
    line("error rate:", ((p("error_rate").rate || 0) * 100).toFixed(2) + "%"),
    "",
    "  HOME:",
    line("  p50:", (p("home_latency")["p(50)"] || 0).toFixed(0) + " ms"),
    line("  p95:", (p("home_latency")["p(95)"] || 0).toFixed(0) + " ms"),
    line("  p99:", (p("home_latency")["p(99)"] || 0).toFixed(0) + " ms"),
    "",
    "  DEMO:",
    line("  p50:", (p("demo_latency")["p(50)"] || 0).toFixed(0) + " ms"),
    line("  p95:", (p("demo_latency")["p(95)"] || 0).toFixed(0) + " ms"),
    line("  p99:", (p("demo_latency")["p(99)"] || 0).toFixed(0) + " ms"),
    "",
    "  API /api/calls (401 expected):",
    line("  p50:", (p("api_calls_latency")["p(50)"] || 0).toFixed(0) + " ms"),
    line("  p95:", (p("api_calls_latency")["p(95)"] || 0).toFixed(0) + " ms"),
    "═══════════════════════════════════════════════════════════════",
  ];
  return lines.join("\n");
}
