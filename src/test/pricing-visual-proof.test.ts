import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Pins the Q1 pricing visual-proof redesign
 * (PRICING-FEATURES-REDESIGN-PLAN §2 Q1): visual treatment may evolve,
 * but the structure must stay — single CTA headline, product-still proof
 * visual, mono trust strip, migration steps, honest stat cards —
 * and the auth-gate hrefs must stay byte-identical.
 */

const PRICING_CLIENT = path.join(
  process.cwd(),
  "src/components/pricing-client.tsx"
);
const SOCIAL_PROOF = path.join(
  process.cwd(),
  "src/components/pricing-social-proof.tsx"
);

function read(file: string): string {
  return fs.readFileSync(file, "utf-8");
}

describe("pricing CTA is a single headline + motif", () => {
  // Scope to the CTA section: the page-level FAQ keeps its own H2, the
  // dedupe target was the two H2s inside the bottom CTA card.
  function ctaSection(): string {
    const src = read(PRICING_CLIENT);
    const start = src.indexOf("{/* CTA — single H2");
    const end = src.indexOf("<ExitIntentModal");
    expect(start, "CTA section marker not found").toBeGreaterThan(-1);
    expect(end, "CTA section end not found").toBeGreaterThan(start);
    return src.slice(start, end);
  }

  it("has exactly one H2 (the double-H2 is deduped)", () => {
    const cta = ctaSection();
    const h2Count = (cta.match(/<h2[\s>]/g) || []).length;
    expect(h2Count).toBe(1);
    expect(cta).not.toMatch(/One tool that pays for itself/);
    expect(cta).toMatch(/Ready to save hours every week\?/);
  });

  it("keeps the /sign-up pill for the bottom CTA", () => {
    const src = read(PRICING_CLIENT);
    expect(src).toMatch(/href="\/sign-up"/);
    expect(src).toMatch(/pricing_cta_click", \{ section: "bottom" \}/);
  });
});

describe("pricing hero-right is a product still (no coded mock, no washi)", () => {
  it("renders summary-owners still inside product-chrome with caption, no binaries beyond /product/", () => {
    const src = read(PRICING_CLIENT);
    expect(src).toMatch(/pricing-pro-visual/);
    expect(src).toMatch(/product-chrome/);
    expect(src).toMatch(/PRODUCT_STILLS\.summary/);
    expect(src).toMatch(/Pro · \$9\/mo flat/);
    expect(src).not.toMatch(/bg-film-amber\/60/);
    expect(src).not.toMatch(/animate-pulse.*Pro|Pro.*animate-pulse/);
    expect(src).not.toMatch(/<Image|<video/);
    expect(src).not.toMatch(/\.png|\.jpg/);
  });
});

describe("pricing trust badges are a mono strip, not peach cards", () => {
  it("keeps the three badge promises verbatim", () => {
    const src = read(PRICING_CLIENT);
    expect(src).toMatch(/No credit card for Free/);
    expect(src).toMatch(/Cancel anytime/);
    expect(src).toMatch(/14-day money-back guarantee/);
  });

  it("drops the 3x peach doppel cards for a single strip + integration row", () => {
    const src = read(PRICING_CLIENT);
    expect(src).not.toMatch(
      /doppel-outer flex flex-col items-center text-center/
    );
    for (const name of ["HubSpot", "Salesforce", "Slack", "Google Meet"]) {
      expect(src, `integration row lost ${name}`).toMatch(new RegExp(name));
    }
  });
});

describe("pricing switching section has a migration visual", () => {
  it("keeps the switching copy and adds export → import → searchable steps", () => {
    const src = read(PRICING_CLIENT);
    expect(src).toMatch(/Moving from Fireflies, Otter, or Fathom\?/);
    expect(src).toMatch(/How migration works/);
    expect(src).toMatch(/Export/);
    expect(src).toMatch(/Import/);
    expect(src).toMatch(/Searchable/);
  });
});

describe("pricing auth-gate hrefs stay byte-identical", () => {
  it("keeps /sign-up redirect, /welcome success, and sales mailto", () => {
    const src = read(PRICING_CLIENT);
    expect(src).toMatch("window.location.href = `/sign-up?redirect=/pricing`");
    expect(src).toMatch('window.location.href = "/welcome"');
    expect(src).toMatch(/successUrl: `\$\{window\.location\.origin\}\/welcome`/);
    expect(src).toMatch(
      "mailto:sales@usegauge.com?subject=Enterprise%20Plan%20Inquiry"
    );
  });
});

describe("pricing social-proof stays honest with stat cards", () => {
  it("keeps the no-fake-quotes disclaimer verbatim", () => {
    const src = read(SOCIAL_PROOF);
    expect(src).toMatch(
      /Customer testimonials are coming as we collect real feedback\. No fake quotes here\./
    );
  });

  it("shows plans.ts-truth stats, not invented testimonials", () => {
    const src = read(SOCIAL_PROOF);
    expect(src).toMatch(/1,200/);
    expect(src).toMatch(/\$29/);
    expect(src).toMatch(/Business flat — unlimited seats/);
    expect(src).toMatch(/One tool across every seat/);
  });
});
