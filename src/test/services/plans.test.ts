import { describe, it, expect } from "vitest";
import { PLANS, getPlan, hasFeature, getFeatureLimit } from "@/lib/plans";

describe("Plans Configuration", () => {
  it("should have four plan tiers", () => {
    const tiers = Object.keys(PLANS);
    expect(tiers).toHaveLength(4);
    expect(tiers).toContain("free");
    expect(tiers).toContain("pro");
    expect(tiers).toContain("business");
    expect(tiers).toContain("enterprise");
  });

  it("free plan should have zero price", () => {
    expect(PLANS.free.price).toBe(0);
  });

  it("pro plan should be $9 ($900 in cents)", () => {
    expect(PLANS.pro.price).toBe(900);
  });

  it("business plan should be $29 ($2900 in cents)", () => {
    expect(PLANS.business.price).toBe(2900);
  });

  it("should return free plan for unknown tier", () => {
    expect(getPlan("unknown").tier).toBe("free");
  });

  it("free plan should have upload_audio feature", () => {
    expect(hasFeature(PLANS.free, "upload_audio")).toBe(true);
  });

  it("free plan should NOT have crm_sync", () => {
    expect(hasFeature(PLANS.free, "crm_sync")).toBe(false);
  });

  it("pro plan should have crm_sync", () => {
    expect(hasFeature(PLANS.pro, "crm_sync")).toBe(true);
  });

  it("enterprise plan should have sso_saml", () => {
    expect(hasFeature(PLANS.enterprise, "sso_saml")).toBe(true);
  });

  it("free plan should have 5 upload limit", () => {
    expect(PLANS.free.uploadLimit).toBe(5);
  });
});
