import { describe, it, expect } from "vitest";
import {
  generateApiKey,
  hashKey,
  extractBearerKey,
  prefixOf,
  isReadMethod,
  scopeAllowsMethod,
} from "@/lib/api-key";

describe("generateApiKey", () => {
  it("returns a raw key with the right shape", () => {
    const out = generateApiKey("test");
    expect(out.raw.startsWith("cn_test_")).toBe(true);
    expect(out.prefix.length).toBe(12);
    expect(out.prefix).toBe(out.raw.slice(0, 12));
    expect(out.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("uses cn_live_ prefix when env is production", () => {
    const out = generateApiKey("production");
    expect(out.raw.startsWith("cn_live_")).toBe(true);
  });

  it("returns unique keys each call", () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.raw).not.toBe(b.raw);
    expect(a.hash).not.toBe(b.hash);
  });

  it("hash is reproducible from raw", () => {
    const out = generateApiKey();
    expect(hashKey(out.raw)).toBe(out.hash);
  });
});

describe("extractBearerKey", () => {
  it("returns null on missing header", () => {
    expect(extractBearerKey(null)).toBeNull();
    expect(extractBearerKey(undefined)).toBeNull();
    expect(extractBearerKey("")).toBeNull();
  });

  it("returns null on non-Bearer", () => {
    expect(extractBearerKey("Basic abc")).toBeNull();
  });

  it("returns null on wrong prefix", () => {
    expect(extractBearerKey("Bearer sk_live_abc")).toBeNull();
    expect(extractBearerKey("Bearer cn_other_abc")).toBeNull();
  });

  it("returns null on too-short key", () => {
    expect(extractBearerKey("Bearer cn_live_abc")).toBeNull();
  });

  it("returns the key for valid input", () => {
    expect(extractBearerKey("Bearer cn_live_abcdef1234567890")).toBe(
      "cn_live_abcdef1234567890",
    );
    // Trim leading/trailing whitespace from the header value.
    expect(extractBearerKey("  Bearer cn_test_xyz1234567890abcdef  ")).toBe(
      "cn_test_xyz1234567890abcdef",
    );
  });
});

describe("prefixOf", () => {
  it("returns first 12 chars", () => {
    expect(prefixOf("cn_live_abcd1234ef")).toBe("cn_live_abcd");
  });
});

describe("scope / method checks", () => {
  it("read scope allows GET", () => {
    expect(scopeAllowsMethod("read", "GET")).toBe(true);
    expect(scopeAllowsMethod("read", "HEAD")).toBe(true);
    expect(scopeAllowsMethod("read", "OPTIONS")).toBe(true);
  });

  it("read scope rejects POST/PUT/PATCH/DELETE", () => {
    expect(scopeAllowsMethod("read", "POST")).toBe(false);
    expect(scopeAllowsMethod("read", "PUT")).toBe(false);
    expect(scopeAllowsMethod("read", "PATCH")).toBe(false);
    expect(scopeAllowsMethod("read", "DELETE")).toBe(false);
  });

  it("read_write allows all", () => {
    for (const m of ["GET", "POST", "PUT", "DELETE", "PATCH"]) {
      expect(scopeAllowsMethod("read_write", m)).toBe(true);
    }
  });

  it("isReadMethod mirrors expectations", () => {
    expect(isReadMethod("GET")).toBe(true);
    expect(isReadMethod("POST")).toBe(false);
  });
});