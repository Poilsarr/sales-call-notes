import { describe, it, expect } from "vitest";
import { getExportTokenExpiryMs, isExportTokenValid } from "@/lib/gdpr-token";

// Pure unit tests — no DB, no HTTP. Token shape is the
// single most failure-prone part of the export pipeline
// (worker produces it, download route parses it, expiry
// is time-based). Cover the parse + validate boundary.

describe("getExportTokenExpiryMs", () => {
  it("parses well-formed exp_<ms>_<hash>_<userId> tokens", () => {
    const ms = 1_730_000_000_000;
    expect(getExportTokenExpiryMs(`exp_${ms}_abc1234_u1`)).toBe(ms);
  });

  it("returns null on wrong prefix", () => {
    expect(getExportTokenExpiryMs(`bad_${1}_h_user`)).toBeNull();
  });

  it("returns null when timestamp is non-numeric", () => {
    expect(getExportTokenExpiryMs(`exp_abc_h_user`)).toBeNull();
  });

  it("returns null when fewer than 4 parts", () => {
    expect(getExportTokenExpiryMs(`exp_1_h`)).toBeNull();
  });

  it("returns null on empty string", () => {
    expect(getExportTokenExpiryMs("")).toBeNull();
  });
});

describe("isExportTokenValid", () => {
  const userId = "u1";
  const futureMs = Date.now() + 24 * 60 * 60 * 1000;
  const pastMs = Date.now() - 1000;

  it("accepts a non-expired token with matching userId", () => {
    expect(isExportTokenValid(`exp_${futureMs}_hash_${userId}`, userId, Date.now())).toBe(true);
  });

  it("rejects an expired token", () => {
    expect(isExportTokenValid(`exp_${pastMs}_hash_${userId}`, userId, Date.now())).toBe(false);
  });

  it("rejects a token whose userId does not match", () => {
    expect(isExportTokenValid(`exp_${futureMs}_hash_other`, userId, Date.now())).toBe(false);
  });

  it("rejects a malformed token", () => {
    expect(isExportTokenValid("garbage", userId, Date.now())).toBe(false);
  });
});
