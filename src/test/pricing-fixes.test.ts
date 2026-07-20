import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Regression tests for the four pricing-page bugs found in PR-review of #135:
 *
 *  1. Annual toggle displayed the Paddle pricing-preview `formatted_totals.total`
 *     — the amount charged at signup ($90 for a $7.50/mo annual) — with the
 *     "/month, billed annually" suffix, so the user read $90 as a monthly price.
 *
 *  2. /api/pricing-preview is hit from the public pricing page by signed-out
 *     visitors. The global middleware matcher + protected-route check was
 *     blocking the call with 401, so the page fell back to "Pricing
 *     unavailable" for every signed-out visitor — even though the route
 *     itself contains no auth check.
 *
 *  3. The comparison table's Gauge column highlight was almost invisible
 *     (orange at 4-6% opacity over a near-white card).
 *
 *  4. When the Paddle price-preview fails, the Subscribe button kept
 *     showing "Start free" — implying the user can sign up for a paid
 *     plan they can't actually buy.
 */

const PRICING_CLIENT = path.join(
  process.cwd(),
  "src/components/pricing-client.tsx"
);
const MIDDLEWARE = path.join(process.cwd(), "src/middleware.ts");

function read(file: string): string {
  return fs.readFileSync(file, "utf-8");
}

describe("annual price does not read as a monthly rate", () => {
  it("the periodLabel drops the misleading '/month' suffix on annual", () => {
    const src = read(PRICING_CLIENT);
    // Match the JSX (not comments) — strip /* */ and // comments first.
    const stripped = src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^|\n\s*\/\/.*$/gm, "");
    expect(
      stripped,
      "old '/month, billed annually' label slipped back in"
    ).not.toMatch(/\/month,\s*billed\s+annually/i);
    expect(stripped, "annual label should be 'billed annually'").toMatch(
      /cycle === "annual"\s*\?\s*"billed annually"\s*:\s*"\/month"/
    );
  });

  it("the FAQ describes annual as a single annual charge, not a monthly rate", () => {
    const src = read(PRICING_CLIENT);
    expect(src).toMatch(/billed annually as a single charge/i);
    expect(src).not.toMatch(/Pro is \$7\.50\/mo billed annually \(vs/);
  });
});

describe("/api/pricing-preview is reachable for signed-out visitors", () => {
  it("the route is in the middleware isPublicApi allowlist", () => {
    const src = read(MIDDLEWARE);
    expect(src).toMatch(/["']\/api\/pricing-preview["']/);
  });

  it("the route is excluded from the middleware matcher", () => {
    const src = read(MIDDLEWARE);
    const matcher = src.match(/matcher:\s*\[([\s\S]+?)\]/);
    expect(matcher, "matcher block not found").toBeTruthy();
    // The negative-lookahead list must include pricing-preview.
    expect(matcher![1]).toMatch(/pricing-preview/);
  });
});

describe("comparison table makes the Gauge column unmistakable", () => {
  it("the Gauge header background is at least 10% orange", () => {
    const src = read(PRICING_CLIENT);
    expect(src).toMatch(/bg-\[#F26522\]\/\[0\.1[0-9]\]/);
  });

  it("the Gauge cells have a visible side border", () => {
    const src = read(PRICING_CLIENT);
    expect(src).toMatch(/border-x-2 border-\[#F26522\]/);
  });
});

describe("disabled Subscribe button does not lie about signup", () => {
  it("falls back to 'Unavailable' when the Paddle preview fails", () => {
    const src = read(PRICING_CLIENT);
    expect(src).toMatch(
      /\)\s*:\s*paddleError\s*&&\s*isPaddle\s*\?\s*\(\s*\n?\s*"Unavailable"/
    );
  });
});
