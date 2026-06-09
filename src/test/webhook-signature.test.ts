import { describe, it, expect, beforeEach, vi } from "vitest";
import { verifyHubSpotSignature, verifySalesforceSignature } from "@/lib/webhook-signatures";

describe("verifyHubSpotSignature", () => {
  const secret = "test_hubspot_secret_123";
  const body = '{"eventId":1,"subscriptionType":"contact.creation","portalId":42}';

  it("returns true for a valid signature", () => {
    const crypto = require("crypto");
    const sig = crypto
      .createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("base64");
    expect(verifyHubSpotSignature(body, sig, secret, "v3")).toBe(true);
  });

  it("returns false for an invalid signature", () => {
    expect(verifyHubSpotSignature(body, "invalidsig", secret, "v3")).toBe(false);
  });

  it("returns false when secret is empty", () => {
    expect(verifyHubSpotSignature(body, "any", "", "v3")).toBe(false);
  });

  it("is timing-safe (constant-time compare)", () => {
    // This is a behavior contract; we just ensure it doesn't throw
    // and returns the right boolean for a known-bad sig.
    expect(verifyHubSpotSignature(body, "x".repeat(40), secret, "v3")).toBe(false);
  });
});

describe("verifySalesforceSignature", () => {
  it("returns true for a valid SHA-256 of body with secret", () => {
    const crypto = require("crypto");
    const secret = "sf_secret_456";
    const body = '{"event":"contact.updated"}';
    const sig = crypto.createHash("sha256").update(secret + body).digest("hex");
    expect(verifySalesforceSignature(body, sig, secret)).toBe(true);
  });

  it("returns false for a bad signature", () => {
    expect(verifySalesforceSignature("{}", "deadbeef", "secret")).toBe(false);
  });
});
