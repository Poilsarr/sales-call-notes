import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Sentry alert generator (Level 6.4) — pin the catalog.
 *
 * The script's output is the source of truth for our Sentry alerts. If you
 * add or remove a rule, update both the script AND these tests in the same
 * PR. This catches accidental drift.
 */
const SCRIPT_PATH = join(process.cwd(), "scripts", "sentry-alerts.mjs");
const DOCS_PATH = join(process.cwd(), "docs", "operations", "ALERTS.md");

function loadCatalog() {
  if (!existsSync(SCRIPT_PATH)) {
    throw new Error(`Missing ${SCRIPT_PATH}`);
  }
  // Strip the JSON.stringify console.log line and re-execute logic.
  // We import the module via dynamic eval to avoid spawning child processes.
  // (Module is a .mjs; Node's child_process keeps the test deterministic.)
  const src = readFileSync(SCRIPT_PATH, "utf8");
  // Quick + dirty: pull out the RULES const literal via regex.
  const match = src.match(/const RULES = (\[[\s\S]*?\n\]);/);
  if (!match) throw new Error("Could not find RULES const in sentry-alerts.mjs");
  // eslint-disable-next-line no-new-func
  return Function(`return (${match[1]});`)();
}

describe("sentry-alerts.mjs", () => {
  it("file exists", () => {
    expect(existsSync(SCRIPT_PATH)).toBe(true);
  });

  it("docs catalog file exists", () => {
    expect(existsSync(DOCS_PATH)).toBe(true);
  });

  it("defines the three required rules", () => {
    const rules = loadCatalog();
    const names = rules.map((r) => r.name);
    expect(names).toContain("CallNote Pro — high error rate");
    expect(names).toContain("CallNote Pro — slow transactions (p95 > 1s)");
    expect(names).toContain("CallNote Pro — quota exceeded (AI provider)");
  });

  it("every rule has a severity, runbook, owner, and action", () => {
    const rules = loadCatalog();
    for (const r of rules) {
      expect(r.severity, `${r.name}: severity`).toBeTruthy();
      expect(r.runbook, `${r.name}: runbook`).toBeTruthy();
      expect(r.owner, `${r.name}: owner`).toBeTruthy();
      expect(r.action, `${r.name}: action`).toBeTruthy();
      expect(r.window, `${r.name}: window`).toBeTruthy();
      expect(r.threshold, `${r.name}: threshold`).toBeTruthy();
    }
  });

  it("error-rate rule has PagerDuty action", () => {
    const rules = loadCatalog();
    const r = rules.find((x) => x.name.includes("high error rate"));
    expect(r).toBeTruthy();
    expect(r.action.type).toBe("pagerduty");
    expect(r.threshold.type).toBe("pct");
  });

  it("latency rule uses p95 aggregation and 1000ms threshold", () => {
    const rules = loadCatalog();
    const r = rules.find((x) => x.name.includes("slow transactions"));
    expect(r).toBeTruthy();
    expect(r.aggregation.function).toBe("p95");
    expect(r.threshold.value).toBe(1000);
  });

  it("quota rule filters on tags.kind=quota_exceeded", () => {
    const rules = loadCatalog();
    const r = rules.find((x) => x.name.includes("quota exceeded"));
    expect(r).toBeTruthy();
    expect(r.filter.key).toBe("tags.kind");
    expect(r.filter.value).toBe("quota_exceeded");
    expect(r.threshold.value).toBeGreaterThan(0);
  });

  it("every rule links back to a runbook that exists", () => {
    const rules = loadCatalog();
    for (const r of rules) {
      // Strip any "#fragment" suffix — we only check the file exists.
      const runbookRel = r.runbook.split("#")[0];
      const runbookAbs = join(process.cwd(), runbookRel);
      expect(existsSync(runbookAbs), `${r.name}: runbook missing at ${runbookAbs}`).toBe(true);
    }
  });
});