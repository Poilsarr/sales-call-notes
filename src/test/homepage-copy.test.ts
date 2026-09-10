import { describe, it, expect } from "vitest";
import { HOMEPAGE_COPY, HERO_VARIANTS } from "@/lib/homepage-copy";
import { PLANS } from "@/lib/plans";
import { TIER_DEFINITIONS } from "@/lib/pricing-tiers";

/**
 * Pins homepage copy against pricing truth (FRONTPAGE-PITCH-PLAN §6).
 * A plan change in src/lib/plans.ts that isn't mirrored in
 * src/lib/homepage-copy.ts fails here instead of silently lying on `/`.
 */
describe("homepage copy stays pinned to pricing truth", () => {
  it("Free tier says 300 min/mo (plans.ts free.minuteLimit)", () => {
    expect(PLANS.free.minuteLimit).toBe(300);
    expect(HOMEPAGE_COPY.pricing.freeMinutes).toBe(300);
    expect(HOMEPAGE_COPY.pricing.freeMinutes).toBe(PLANS.free.minuteLimit);
  });

  it("Pro tier says 1200 min/mo + $9 flat (plans.ts pro)", () => {
    expect(PLANS.pro.minuteLimit).toBe(1200);
    expect(PLANS.pro.priceLabel).toBe("$9");
    expect(PLANS.pro.price).toBe(900);
    expect(HOMEPAGE_COPY.pricing.proMinutes).toBe(1200);
    expect(HOMEPAGE_COPY.pricing.proMinutes).toBe(PLANS.pro.minuteLimit);
    expect(HOMEPAGE_COPY.pricing.proPriceLabel).toBe(PLANS.pro.priceLabel);
    expect(HOMEPAGE_COPY.pricing.proPriceFlat).toMatch(/\$9/);
    expect(HOMEPAGE_COPY.heroSub).toMatch(/\$9\/mo/);
  });

  it("tier definitions agree (Free 300 / Pro 1200)", () => {
    const free = TIER_DEFINITIONS.find((t) => t.name === "Free");
    const pro = TIER_DEFINITIONS.find((t) => t.name === "Pro");
    expect(free).toBeDefined();
    expect(pro).toBeDefined();
    expect(free!.features.join(" ")).toMatch(/300 transcription minutes\/mo/);
    expect(pro!.features.join(" ")).toMatch(/1,200 transcription minutes\/mo/);
  });
});

describe("hero variants", () => {
  it("exposes exactly 3 H1 variants with variant B as the default", () => {
    expect(HERO_VARIANTS).toHaveLength(3);
    expect(HERO_VARIANTS.map((v) => v.key)).toEqual(["A", "B", "C"]);
    expect(HERO_VARIANTS[0].h1).toBe(
      "Know the second a rival enters your deal."
    );
    expect(HERO_VARIANTS[1].h1).toBe(
      "AI notetaker for sales calls that flags competitors."
    );
    expect(HERO_VARIANTS[2].h1).toBe(
      "Stop writing notes. Never miss a rival mention again."
    );
    expect(HOMEPAGE_COPY.heroH1Variant).toBe("B");
    expect(HOMEPAGE_COPY.heroH1).toBe(HERO_VARIANTS[1].h1);
  });

  it("keeps the plain-English eyebrow + beta line free of internal jargon", () => {
    expect(HOMEPAGE_COPY.eyebrow).toBe("Gauge — AI sales-call notetaker");
    expect(HOMEPAGE_COPY.betaLine).toBe("Currently in private beta");
    for (const banned of ["Open Intelligence", "MEDDIC", "Whisper"]) {
      expect(HOMEPAGE_COPY.eyebrow).not.toMatch(banned);
      expect(HOMEPAGE_COPY.heroH1).not.toMatch(banned);
      expect(HOMEPAGE_COPY.heroSub).not.toMatch(banned);
    }
  });
});
