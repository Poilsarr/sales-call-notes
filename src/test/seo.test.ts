import { describe, it, expect } from "vitest";
import { productJsonLd } from "@/lib/seo";

describe("productJsonLd", () => {
  const ld = JSON.parse(productJsonLd());

  it("declares schema.org SoftwareApplication", () => {
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("SoftwareApplication");
  });

  it("names the product", () => {
    expect(ld.name).toBe("CallNote Pro");
    expect(ld.url).toBe("https://callnotepro.com");
  });

  it("links the OG image", () => {
    expect(ld.image).toBe("https://callnotepro.com/og.png");
  });

  it("exposes Free + Pro offers with real prices", () => {
    expect(ld.offers).toHaveLength(2);
    const free = ld.offers.find((o: { name: string }) => o.name === "Free");
    const pro = ld.offers.find((o: { name: string }) => o.name === "Pro");
    expect(free.price).toBe("0");
    expect(free.priceCurrency).toBe("USD");
    expect(pro.price).toBe("9.00");
    expect(pro.priceCurrency).toBe("USD");
    expect(pro.priceSpecification.unitCode).toBe("MON");
  });

  it("does NOT include fake aggregateRating or review counts", () => {
    // Karpathy rule 5: don't ship what isn't true.
    expect(ld.aggregateRating).toBeUndefined();
    expect(ld.review).toBeUndefined();
    expect(ld.ratingValue).toBeUndefined();
    expect(ld.ratingCount).toBeUndefined();
  });

  it("lists real feature names we actually ship", () => {
    expect(ld.featureList.length).toBeGreaterThanOrEqual(5);
    const asString = JSON.stringify(ld);
    // Mentions the real wedges we built.
    expect(asString).toMatch(/transcription/i);
    expect(asString).toMatch(/competitive/i);
    expect(asString).toMatch(/HubSpot/i);
    expect(asString).toMatch(/Slack/i);
    expect(asString).toMatch(/API/);
  });

  it("valid JSON output", () => {
    expect(() => JSON.parse(productJsonLd())).not.toThrow();
  });
});