import { describe, it, expect } from "vitest";
import {
  isValidBrandColor,
  isValidLogoUrl,
  validateBrandingUpdate,
  DEFAULT_BRAND_COLOR,
} from "@/lib/team-branding";

describe("isValidBrandColor", () => {
  it("accepts 3-digit hex", () => {
    expect(isValidBrandColor("#abc")).toBe(true);
    expect(isValidBrandColor("#FFF")).toBe(true);
  });
  it("accepts 6-digit hex", () => {
    expect(isValidBrandColor("#5b21b6")).toBe(true);
    expect(isValidBrandColor("#000000")).toBe(true);
  });
  it("rejects non-hex", () => {
    expect(isValidBrandColor("purple")).toBe(false);
    expect(isValidBrandColor("#xyz")).toBe(false);
    expect(isValidBrandColor("rgb(0,0,0)")).toBe(false);
    expect(isValidBrandColor("#12345")).toBe(false); // 5-digit
  });
  it("rejects empty / null", () => {
    expect(isValidBrandColor(null)).toBe(false);
    expect(isValidBrandColor(undefined)).toBe(false);
    expect(isValidBrandColor("")).toBe(false);
  });
});

describe("isValidLogoUrl", () => {
  it("accepts https:// URLs", () => {
    expect(isValidLogoUrl("https://cdn.example.com/logo.png")).toBe(true);
  });
  it("rejects http:// (mixed content)", () => {
    expect(isValidLogoUrl("http://cdn.example.com/logo.png")).toBe(false);
  });
  it("rejects javascript: / data: (XSS)", () => {
    expect(isValidLogoUrl("javascript:alert(1)")).toBe(false);
    expect(isValidLogoUrl("data:image/png;base64,abc")).toBe(false);
  });
  it("rejects empty / null / non-string", () => {
    expect(isValidLogoUrl("")).toBe(false);
    expect(isValidLogoUrl(null)).toBe(false);
    expect(isValidLogoUrl(42)).toBe(false);
  });
});

describe("validateBrandingUpdate", () => {
  it("rejects non-object body", () => {
    expect(validateBrandingUpdate(null).ok).toBe(false);
    expect(validateBrandingUpdate("x").ok).toBe(false);
    expect(validateBrandingUpdate(42).ok).toBe(false);
  });

  it("returns ok with empty object when no fields provided (caller rejects 400)", () => {
    const r = validateBrandingUpdate({});
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual({});
  });

  it("lowercases brandColor", () => {
    const r = validateBrandingUpdate({ brandColor: "#ABCDEF" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.brandColor).toBe("#abcdef");
  });

  it("treats null / empty as a clear (sets to null)", () => {
    expect(validateBrandingUpdate({ brandColor: null }).ok).toBe(true);
    expect(validateBrandingUpdate({ brandColor: "" }).ok).toBe(true);
  });

  it("rejects javascript: URL", () => {
    const r = validateBrandingUpdate({ logoUrl: "javascript:alert(1)" });
    expect(r.ok).toBe(false);
  });

  it("keeps https URL untouched", () => {
    const r = validateBrandingUpdate({ logoUrl: "https://x.example.com/a.png" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.logoUrl).toBe("https://x.example.com/a.png");
  });
});

describe("DEFAULT_BRAND_COLOR", () => {
  it("is a valid hex color", () => {
    expect(isValidBrandColor(DEFAULT_BRAND_COLOR)).toBe(true);
  });
});