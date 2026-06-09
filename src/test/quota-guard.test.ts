import { describe, it, expect } from "vitest";
import { isQuotaError, quotaErrorResponse } from "@/lib/quota-guard";

describe("isQuotaError", () => {
  it("returns true for 429", () => {
    expect(isQuotaError({ status: 429 })).toBe(true);
  });
  it("returns true for insufficient_quota code", () => {
    expect(isQuotaError({ code: "insufficient_quota" })).toBe(true);
  });
  it("returns true for nested insufficient_quota", () => {
    expect(isQuotaError({ error: { code: "insufficient_quota" } })).toBe(true);
  });
  it("returns false for unrelated error", () => {
    expect(isQuotaError({ code: "invalid_api_key" })).toBe(false);
  });
  it("returns false for null", () => {
    expect(isQuotaError(null)).toBe(false);
  });
  it("returns false for string", () => {
    expect(isQuotaError("rate limited")).toBe(false);
  });
});

describe("quotaErrorResponse", () => {
  it("returns 503 with retry-after hint", () => {
    const r = quotaErrorResponse();
    expect(r.status).toBe(503);
  });
  it("includes retryAfterSeconds in body", async () => {
    const r = quotaErrorResponse();
    const body = await r.json();
    expect(body.retryAfterSeconds).toBe(60);
  });
});
