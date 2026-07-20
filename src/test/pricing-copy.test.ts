import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Pins the corrected pricing copy. Without this test the previous version
 * shipped three factual lies in marketing:
 *
 *   1. "5 reps on us = your local price"  — vague and non-defensible
 *   2. "All paid plans are flat-rate — no per-seat math"  — Pro caps at 5
 *   3. Pro description "One price — bring your whole team"  — Pro = 5 seats
 *
 * If anyone reintroduces those lines, the test fails with a clear
 * message naming the old copy.
 */

const PRICING_CLIENT = path.join(
  process.cwd(),
  "src/components/pricing-client.tsx"
);
const PRICING_TIERS = path.join(
  process.cwd(),
  "src/lib/pricing-tiers.ts"
);

function read(file: string): string {
  return fs.readFileSync(file, "utf-8");
}

describe("pricing copy is honest", () => {
  it("the Fireflies-vs-Gauge callout names a real price", () => {
    const src = read(PRICING_CLIENT);
    expect(src, "old vague callout slipped back in").not.toMatch(
      /5 reps on us = your local price/i
    );
    expect(src, "callout should name Gauge's real $9 Pro price").toMatch(
      /\$9\/mo flat for 5 seats/i
    );
    // The "~$50/mo" Fireflies number is the real comparator.
    expect(src).toMatch(/\$50\/mo/);
  });

  it("the 'flat-rate' footer no longer claims every plan is unlimited", () => {
    const src = read(PRICING_CLIENT);
    expect(
      src,
      "the old 'all paid plans are flat-rate' line lied about Pro"
    ).not.toMatch(/All paid plans are\s*<strong[^>]*>\s*flat-rate\s*<\/strong>/i);
    // Honest replacement: name the Pro cap explicitly.
    expect(src).toMatch(/Pro is flat for up to 5 seats/i);
    expect(src).toMatch(/Business is flat for unlimited seats/i);
  });

  it("the Pro tier description matches the actual seat cap in plans.ts", () => {
    const tiers = read(PRICING_TIERS);
    const plans = read(path.join(process.cwd(), "src/lib/plans.ts"));
    expect(plans).toMatch(/teamMemberLimit:\s*5/); // sanity: Pro really is 5
    expect(
      tiers,
      "Pro description should name the $9 price + 5-seat cap, not 'whole team'"
    ).toMatch(/\$9\/mo flat for the whole 5-seat workspace/i);
    expect(
      tiers,
      "the old 'bring your whole team' line is the original blunder"
    ).not.toMatch(/bring your whole team/i);
  });
});
