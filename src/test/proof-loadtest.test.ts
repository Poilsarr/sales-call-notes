import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * GATE 4 evidence: k6 load test result.
 *
 * scripts/load-test.js runs k6 against BASE_URL and writes
 * scripts/.proof-loadtest.json. This test reads that file and
 * asserts the perf gate targets.
 *
 * To refresh:
 *   BASE_URL=https://sales-call-notes.vercel.app k6 run scripts/load-test.js
 *   npx vitest run src/test/proof-loadtest.test.ts
 */
const PROOF_PATH = join(process.cwd(), "scripts", ".proof-loadtest.json");
const FRESHNESS_DAYS = 7;
const TARGET_P95_MS = 200;

interface Proof {
  metrics: Record<string, { values: Record<string, number> }>;
}

function readProof(): Proof | null {
  if (!existsSync(PROOF_PATH)) return null;
  return JSON.parse(readFileSync(PROOF_PATH, "utf8"));
}

describe("GATE 4 evidence: k6 load test proof", () => {
  it("has a proof file from a real k6 run", () => {
    expect(existsSync(PROOF_PATH)).toBe(true);
  });

  it("proof file is recent (within 7 days)", () => {
    const proof = readProof();
    if (!proof) return;
    const fs = require("node:fs") as typeof import("node:fs");
    const stat = fs.statSync(PROOF_PATH);
    const ageMs = Date.now() - stat.mtimeMs;
    const maxAgeMs = FRESHNESS_DAYS * 24 * 60 * 60 * 1000;
    expect(ageMs).toBeLessThan(maxAgeMs);
  });

  it("test ran at least 100 iterations (statistical significance)", () => {
    const proof = readProof();
    if (!proof) return;
    const count = proof.metrics?.total_requests?.values?.count ?? 0;
    // 4 routes per iteration; 100 iterations = 400 requests minimum
    expect(count).toBeGreaterThanOrEqual(400);
  });

  it("p95 home latency under 200ms (GATE 4 target)", () => {
    const proof = readProof();
    if (!proof) return;
    const p95 = proof.metrics?.home_latency?.values?.["p(95)"] ?? Infinity;
    expect(p95).toBeLessThan(TARGET_P95_MS);
  });

  it("p95 demo latency under 200ms (GATE 4 target)", () => {
    const proof = readProof();
    if (!proof) return;
    const p95 = proof.metrics?.demo_latency?.values?.["p(95)"] ?? Infinity;
    expect(p95).toBeLessThan(TARGET_P95_MS);
  });

  it("error rate under 1% (5xx only, not 4xx auth)", () => {
    const proof = readProof();
    if (!proof) return;
    const rate = proof.metrics?.error_rate?.values?.rate ?? 0;
    expect(rate).toBeLessThan(0.01);
  });
});
