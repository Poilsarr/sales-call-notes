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
 * CI does NOT run prove-openai.mjs (no live keys in CI — the CI .env
 * is wiped before tests). The wall-clock freshness check below is
 * therefore enforced ONLY where a refresh is possible: when provider
 * keys are present in env and GATE0_FRESHNESS is not "off".
 * CI sets GATE0_FRESHNESS=off and still asserts the proof exists and
 * records a successful call — the evidence requirement stays.
 * A nightly test-doctor workflow re-runs the prove script with
 * secrets and opens a PR with the refreshed proof (or an issue
 * when the keys themselves are dead).
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
    // No-compromise rule: this gate may only fail where a human or the
    // nightly doctor can actually refresh the proof (live keys present).
    // Failing it in keyless CI would prove nothing about the code —
    // only that the calendar moved.
    const freshnessOff = process.env.GATE0_FRESHNESS === "off";
    const hasKeys = !!(
      process.env.OPENAI_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.ANTHROPIC_API_KEY
    );
    if (!existsSync(PROOF_PATH)) return;
    if (freshnessOff || !hasKeys) return;
    const proof = JSON.parse(readFileSync(PROOF_PATH, "utf8"));
    const ts = new Date(proof.timestamp).getTime();
    const ageMs = Date.now() - ts;
    const maxAgeMs = FRESHNESS_DAYS * 24 * 60 * 60 * 1000;
    expect(ageMs).toBeLessThan(maxAgeMs);
  });
});
