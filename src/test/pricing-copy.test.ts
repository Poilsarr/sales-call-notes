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
const VS_OTTER = path.join(process.cwd(), "src/app/vs/otter-ai/page.tsx");
const VS_FIREFLIES = path.join(process.cwd(), "src/app/vs/fireflies/page.tsx");
const OTTER_ALT = path.join(process.cwd(), "src/app/otter-alternative/page.tsx");
const VS_TLDV = path.join(process.cwd(), "src/app/vs/tldv/page.tsx");
const VS_FATHOM = path.join(process.cwd(), "src/app/vs/fathom/page.tsx");
const VS_GONG = path.join(process.cwd(), "src/app/vs/gong/page.tsx");
const CALCULATOR = path.join(process.cwd(), "src/components/pricing-calculator.tsx");
const PRICING_PAGE = path.join(process.cwd(), "src/app/pricing/page.tsx");
const DEMO_CAROUSEL = path.join(process.cwd(), "src/components/demo-carousel.tsx");
const FREE_PLAN_BANNER = path.join(process.cwd(), "src/components/free-plan-banner.tsx");

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

describe("comparison pages don't overclaim the free tier", () => {
  const pages: Array<[string, string]> = [
    ["vs/otter-ai", read(VS_OTTER)],
    ["vs/fireflies", read(VS_FIREFLIES)],
    ["otter-alternative", read(OTTER_ALT)],
    ["vs/gong", read(VS_GONG)],
  ];

  it("never claim '600 free minutes' (plans.ts free = 300)", () => {
    for (const [name, src] of pages) {
      expect(src, `${name} still says 600 free minutes`).not.toMatch(
        /600\s*free\s*minutes/i
      );
    }
  });

  it("never claim unlimited free imports (plans.ts free = 3)", () => {
    const plans = read(path.join(process.cwd(), "src/lib/plans.ts"));
    expect(plans).toMatch(/fileImportLimit:\s*3/); // sanity: free really is 3
    for (const [name, src] of pages) {
      expect(src, `${name} still claims unlimited imports`).not.toMatch(
        /unlimited\s*imports/i
      );
    }
  });

  it("describe Gauge's free tier as 300 min + 3 lifetime imports", () => {
    for (const [name, src] of pages) {
      expect(src, `${name} should say 300 min/mo`).toMatch(/300\s*min\/?mo?/i);
      expect(src, `${name} should say 3 lifetime imports`).toMatch(
        /3 lifetime imports/i
      );
    }
  });
});

describe("vs/gong hedges every unverified competitor number", () => {
  const gong = read(VS_GONG);

  it("never states a Gong price without the 'reported' hedge (R15)", () => {
    // Every Gong-side figure must carry "reported" — Gong does not publish
    // pricing; the numbers come from third-party cost analyses.
    expect(gong).toMatch(/\$1,300–\$1,600\/user\/yr \(reported\)/);
    expect(gong).toMatch(/\$5,000–\$15,000\+\/yr \(reported\)/);
    expect(gong).toMatch(/25–56%/);
    expect(gong).toMatch(/5–8%/);
    const hedgeCount = (gong.match(/reported/gi) || []).length;
    expect(hedgeCount, "every Gong claim should carry a reported hedge").toBeGreaterThanOrEqual(10);
  });

  it("uses the honest pricing footnote, not the public-pricing-pages footer", () => {
    // The shared component default says "from their public pricing pages" —
    // false for Gong. The page must set its own footnote.
    expect(gong).toMatch(/Gong does not publish pricing/);
    expect(gong).not.toMatch(/from their public pricing pages/);
  });

  it("names Gauge's real prices from plans.ts ($9 flat, $29 flat, 300 min, 3 imports)", () => {
    expect(gong).toMatch(/\$9\/mo flat for 5 seats|\$9\/mo flat/);
    expect(gong).toMatch(/\$29\/mo flat for unlimited/);
    expect(gong).toMatch(/300 min\/mo, 3 lifetime imports/);
  });

  it("never claims a new latency number (60-second surfaces are shared-component only)", () => {
    expect(gong).not.toMatch(/under 60 seconds|summary in 30|summaries in 30/i);
  });
});

describe("every pricing-claim surface stays within plans.ts truth", () => {
  // All surfaces that talk about the free tier, including competitor rows
  // ("800 min" for Fireflies is *their* number and stays).
  const claimPages: Array<[string, string]> = [
    ["vs/otter-ai", read(VS_OTTER)],
    ["vs/fireflies", read(VS_FIREFLIES)],
    ["otter-alternative", read(OTTER_ALT)],
    ["vs/tldv", read(VS_TLDV)],
    ["vs/fathom", read(VS_FATHOM)],
    ["vs/gong", read(VS_GONG)],
    ["pricing-calculator", read(CALCULATOR)],
    ["app/pricing", read(PRICING_PAGE)],
  ];

  it("never claims 600 free minutes in any word order (free = 300)", () => {
    for (const [name, src] of claimPages) {
      expect(src, `${name} still says 600 free minutes`).not.toMatch(
        /600\s*free\s*minutes/i
      );
      expect(src, `${name} claims 600 min in another word order`).not.toMatch(
        /600\s*(free\s+)?min(utes)?/i
      );
    }
  });

  it("never claims unlimited imports (free = 3 lifetime)", () => {
    for (const [name, src] of claimPages) {
      expect(src, `${name} still claims unlimited imports`).not.toMatch(
        /unlimited\s*imports/i
      );
    }
  });

  it("never claims unlimited free storage or 'your history stays yours'", () => {
    // Competitor pages legitimately quote Fathom's "unlimited storage" as a
    // *them* row — the ban is on OUR-side phrases only.
    for (const [name, src] of claimPages) {
      expect(src, `${name} claims no storage cap`).not.toMatch(/no storage cap/i);
      expect(src, `${name} says history stays yours`).not.toMatch(/history stays yours/i);
      expect(src, `${name} says we never cap history`).not.toMatch(
        /never\s*caps?\s*(your\s*)?(storage|history)/i
      );
    }
  });

  it("never says 'bring your whole team' (Pro caps at 5 seats)", () => {
    for (const [name, src] of claimPages) {
      expect(src, `${name} brings the whole team`).not.toMatch(/bring your whole team/i);
    }
    expect(read(PRICING_CLIENT)).not.toMatch(/bring your whole team/i);
    expect(read(DEMO_CAROUSEL)).not.toMatch(/bring your whole team/i);
    expect(read(FREE_PLAN_BANNER)).not.toMatch(/bring your whole team/i);
  });

  it("Pro is never described as unlimited minutes or calls (Pro = 1,200)", () => {
    const carousel = read(DEMO_CAROUSEL);
    expect(carousel, "demo carousel calls Pro unlimited").not.toMatch(
      /unlimited\s*minutes/i
    );
    expect(carousel, "demo carousel should name the real Pro quota").toMatch(
      /1,200\s*minutes/i
    );
    const banner = read(FREE_PLAN_BANNER);
    expect(banner, "free-plan banner calls Pro unlimited calls").not.toMatch(
      /unlimited\s*calls/i
    );
    expect(banner, "free-plan banner should name the real upgrade value").toMatch(
      /4x more minutes/i
    );
  });

  it("the overage FAQ describes shipped behavior, not invented emails/pauses", () => {
    const client = read(PRICING_CLIENT);
    expect(client, "FAQ invented a 100% usage email that never ships").not.toMatch(
      /email at 100%/i
    );
    expect(client, "FAQ invented upload pausing that never ships").not.toMatch(
      /uploads pause/i
    );
    expect(client, "FAQ should describe the real archiving behavior").toMatch(
      /archived/i
    );
  });

  it("the pricing calculator quotes Business $29 above the 5-seat Pro cap", () => {
    const calculator = read(CALCULATOR);
    expect(calculator, "calculator must tier-switch above 5 reps").toMatch(
      /GAUGE_BUSINESS_MONTHLY|Unlimited seats — Business/i
    );
    expect(calculator, "calculator footnote must mention the Business tier").toMatch(
      /Business is \$29\/mo flat/i
    );
  });
});
