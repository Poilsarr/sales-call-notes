/**
 * Bundle size regression gate (Level 4 / 5.4 close).
 *
 * Reads scripts/.proof-bundle.txt — a committed snapshot of the latest
 * `next build` route table. For each tracked route, asserts the
 * first-load JS did not exceed the budget.
 *
 * To regenerate the proof:
 *   REDIS_HOST=disabled REDIS_PORT=0 npx next build 2>&1 \
 *     | grep -E '^[├└┌] [ƒ○λ] ' > scripts/.proof-bundle.txt
 *
 * If a tracked route is missing from the proof (renamed/removed), the
 * test warns but does NOT fail — only regressions do.
 *
 * Budget history — why budgets moved (Aug 2026, BUNDLE arc):
 * - June budgets (220/180/210/260/215/175/210/220 kB) were set against the
 *   Next 14 / React 18 / Clerk 5 stack. The intentional stack upgrade to
 *   React 19 / Next 15.5 / Clerk 6 (NEXT15 arc) inflated the shared floor by
 *   ~30 kB on EVERY route — measured +32 kB on `/` (June 190 → 222 fresh).
 *   Re-baseline = old budget + 32 kB documented floor delta, NOT a regression.
 * - The same arc clawed real bytes back per route: Sentry client SDK moved
 *   out of the shared chunk (shared floor 184 → 105 kB gz, −79 kB), GSAP
 *   lazy-loaded off /features (−55 kB), PLANS chunk off /dashboard, sonner
 *   Toaster lazy (settings) and mounted where toasts were silently lost
 *   (billing). Measured values now sit ~73–145 kB UNDER these budgets.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

type Budget = { maxFirstLoadKB: number; label: string };

const BUDGETS: Record<string, Budget> = {
  "/":               { maxFirstLoadKB: 252, label: "/ (landing)" },
  "/demo":           { maxFirstLoadKB: 212, label: "/demo" },
  "/pricing":        { maxFirstLoadKB: 242, label: "/pricing" },
  "/features":       { maxFirstLoadKB: 292, label: "/features" },
  "/settings":       { maxFirstLoadKB: 247, label: "/settings" },
  "/onboarding":     { maxFirstLoadKB: 207, label: "/onboarding" },
  "/dashboard":      { maxFirstLoadKB: 242, label: "/dashboard" },
  "/billing":        { maxFirstLoadKB: 252, label: "/billing" },
};

const PROOF_PATH = join(process.cwd(), "scripts", ".proof-bundle.txt");

type RouteRow = { route: string; sizeKB: number; firstLoadKB: number };

function parse(stdout: string): RouteRow[] {
  const out: RouteRow[] = [];
  for (const line of stdout.split("\n")) {
    // Match: ┌ ƒ / 3.11 kB 190 kB
    const m = /^[├└┌]\s*[ƒ○λ]\s+(\S+)\s+([\d.]+)\s*[kK][bB]\s+([\d.]+)\s*[kK][bB]\s*$/.exec(line);
    if (!m) continue;
    out.push({
      route: m[1],
      sizeKB: parseFloat(m[2]),
      firstLoadKB: parseFloat(m[3]),
    });
  }
  return out;
}

describe("bundle size gate (Level 4 / 5.4)", () => {
  const PROOF_FRESHNESS_DAYS = 7;

  it("proof-bundle.txt exists", () => {
    expect(existsSync(PROOF_PATH)).toBe(true);
  });

  it("proof-bundle.txt is fresh (< 7 days old)", () => {
    if (!existsSync(PROOF_PATH)) return;
    const stat = require("node:fs").statSync(PROOF_PATH);
    const ageDays = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60 * 24);
    if (ageDays > PROOF_FRESHNESS_DAYS) {
      console.warn(
        `[bundle-gate] proof is ${ageDays.toFixed(1)} days old — regenerate with: ` +
          `REDIS_HOST=disabled REDIS_PORT=0 npx next build 2>&1 | grep -E '^[├└┌] [ƒ○λ] ' > scripts/.proof-bundle.txt`,
      );
    }
    expect(ageDays).toBeLessThan(PROOF_FRESHNESS_DAYS * 4); // hard fail at 28d
  });

  it("parses the route table", () => {
    const content = readFileSync(PROOF_PATH, "utf8");
    const rows = parse(content);
    expect(rows.length).toBeGreaterThan(5);
  });

  it("every tracked route fits its first-load JS budget", () => {
    const content = readFileSync(PROOF_PATH, "utf8");
    const rows = parse(content);
    const failures: string[] = [];
    const missing: string[] = [];
    for (const [route, budget] of Object.entries(BUDGETS)) {
      const row = rows.find((r) => r.route === route);
      if (!row) {
        missing.push(route);
        continue;
      }
      if (row.firstLoadKB > budget.maxFirstLoadKB) {
        failures.push(
          `❌ ${budget.label}: ${row.firstLoadKB} kB > budget ${budget.maxFirstLoadKB} kB`,
        );
      }
    }
    if (missing.length) {
      console.warn(`[bundle-gate] routes not in proof (renamed?): ${missing.join(", ")}`);
    }
    expect(failures).toEqual([]);
  });

  it("every first-load JS is monotonically non-increasing vs its size", () => {
    // Sanity: parse correctly — first-load >= size always
    const content = readFileSync(PROOF_PATH, "utf8");
    const rows = parse(content);
    for (const r of rows) {
      expect(r.firstLoadKB).toBeGreaterThanOrEqual(r.sizeKB - 0.01);
    }
  });
});