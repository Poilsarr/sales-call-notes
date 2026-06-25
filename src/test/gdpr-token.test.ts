import { describe, it, expect } from "vitest";
import { getExportTokenExpiryMs, isExportTokenValid, issueExportToken, computeExportTokenHash } from "@/lib/gdpr-token";

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
    const token = issueExportToken(userId, 24 * 60 * 60 * 1000);
    expect(token).not.toBeNull();
    expect(isExportTokenValid(token!, userId, Date.now())).toBe(true);
  });

  it("rejects an expired token", () => {
    const pastMs = Date.now() - 1000;
    // Forge a token whose expiry is in the past but hash is correct
    // for that userId+expiry. This proves expiry alone can deny access.
    const pastHash = computeExportTokenHash(userId, pastMs);
    expect(isExportTokenValid(`exp_${pastMs}_${pastHash}_${userId}`, userId, Date.now())).toBe(false);
  });

  it("rejects a token whose userId does not match", () => {
    expect(isExportTokenValid(`exp_${futureMs}_hash_other`, userId, Date.now())).toBe(false);
  });

  it("rejects a malformed token", () => {
    expect(isExportTokenValid("garbage", userId, Date.now())).toBe(false);
  });

  // Regression: previously, isExportTokenValid accepted any hash
  // value as long as expiry + userId matched. The download route
  // shared the same bug. A malicious caller who knows a victim
  // userId could mint `exp_<futureMs>_anything_<victim>` and
  // download the victim's full data export. This test pins the
  // contract: an unknown hash MUST be rejected.
  it("rejects a token whose hash was not issued (REGRESSION)", () => {
    expect(isExportTokenValid(`exp_${futureMs}_FAKE_HASH_${userId}`, userId, Date.now())).toBe(false);
  });
});

describe("issueExportToken", () => {
  const userId = "u1";

  it("produces a token that round-trips through isExportTokenValid", () => {
    const token = issueExportToken(userId, 24 * 60 * 60 * 1000);
    expect(isExportTokenValid(token, userId, Date.now())).toBe(true);
  });

  it("produces a token that fails validation for a different userId", () => {
    const token = issueExportToken(userId, 24 * 60 * 60 * 1000);
    expect(isExportTokenValid(token, "attacker-id", Date.now())).toBe(false);
  });

  it("produced tokens are distinct for distinct users (no collision)", () => {
    const a = issueExportToken("user-a", 60_000);
    const b = issueExportToken("user-b", 60_000);
    expect(a).not.toBe(b);
  });
});
