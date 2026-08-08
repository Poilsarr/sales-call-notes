import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * GATE 0 evidence: a real AI call must have succeeded.
 *
 * `scripts/prove-openai.mjs` makes a real network call and writes
 * the result to scripts/.proof-openai.json. This test reads that
 * file and asserts the call worked.
 *
 * To refresh the proof locally:
 *   export $(grep -E 'OPENAI_API_KEY|GROQ_API_KEY' .env.local | xargs)
 *   node scripts/prove-openai.mjs
 *   npx vitest run src/test/proof-openai.test.ts
 *
 * CI does NOT run prove-openai.mjs (no real keys in CI). The
 * committed proof file is the live evidence from the last local
 * run; if it's older than 7 days, the test fails and you re-run
 * the script before claiming the gate.
 */
const PROOF_PATH = join(process.cwd(), "scripts", ".proof-openai.json");
const FRESHNESS_DAYS = 7;

describe("GATE 0 evidence: real AI call proof", () => {
  it("has a proof file from a real call", () => {
    expect(existsSync(PROOF_PATH)).toBe(true);
  });

  it("proof file records a successful call (provider 2xx)", () => {
    if (!existsSync(PROOF_PATH)) return; // skip if missing, covered above
    const proof = JSON.parse(readFileSync(PROOF_PATH, "utf8"));
    expect(proof.ok).toBe(true);
    expect(proof.status).toBeGreaterThanOrEqual(200);
    expect(proof.status).toBeLessThan(300);
    expect(proof.provider).toMatch(/^(openai|groq|anthropic|deepgram|omniroute)$/);
    expect(typeof proof.reply).toBe("string");
    expect(proof.reply.length).toBeGreaterThan(0);
    expect(typeof proof.latencyMs).toBe("number");
  });

  it("proof file is recent (within 7 days)", () => {
    if (!existsSync(PROOF_PATH)) return;
    const proof = JSON.parse(readFileSync(PROOF_PATH, "utf8"));
    const ts = new Date(proof.timestamp).getTime();
    const ageMs = Date.now() - ts;
    const maxAgeMs = FRESHNESS_DAYS * 24 * 60 * 60 * 1000;
    expect(ageMs).toBeLessThan(maxAgeMs);
  });
});
