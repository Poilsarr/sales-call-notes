import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// 32-byte test key (base64). Deterministic so envelopes can be reproduced.
const TEST_KEY = "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY="; // "abcdefghijklmnopqrstuvwxyz123456"

const { secretValue } = vi.hoisted(() => ({ secretValue: { value: "" } }));

vi.mock("@/lib/secrets", () => ({
  getSecret: (key: string) => (key === "ENCRYPTION_KEY" ? secretValue.value : ""),
}));

import { encryptConfig, decryptConfig } from "@/lib/integrations/config-crypto";

const SAMPLE_CONFIG = JSON.stringify({
  accessToken: "secret-access-token",
  refreshToken: "secret-refresh-token",
  expiresAt: "2030-01-01T00:00:00.000Z",
});

describe("config-crypto (at-rest token encryption)", () => {
  beforeEach(() => {
    secretValue.value = "";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("ENCRYPTION_KEY missing (Hobby fail-open policy)", () => {
    it("encryptConfig returns plaintext unchanged and warns exactly once per process", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = encryptConfig(SAMPLE_CONFIG);
      encryptConfig("{}");

      expect(result).toBe(SAMPLE_CONFIG);
      const warnCalls = warnSpy.mock.calls.filter((c) =>
        String(c[0]).includes("ENCRYPTION_KEY is not set"),
      );
      expect(warnCalls).toHaveLength(1);
    });

    it("decryptConfig passes legacy plaintext through without a key", () => {
      expect(decryptConfig(SAMPLE_CONFIG)).toBe(SAMPLE_CONFIG);
    });

    it("decryptConfig returns null for null input", () => {
      expect(decryptConfig(null)).toBeNull();
      expect(decryptConfig("")).toBeNull();
    });
  });

  describe("ENCRYPTION_KEY set (encryption active)", () => {
    beforeEach(() => {
      secretValue.value = TEST_KEY;
    });

    it("round-trips a config through encrypt -> decrypt", () => {
      const envelope = encryptConfig(SAMPLE_CONFIG);
      expect(decryptConfig(envelope)).toBe(SAMPLE_CONFIG);
    });

    it("produces the v1:nonce:tag:ciphertext envelope format and hides the plaintext", () => {
      const envelope = encryptConfig(SAMPLE_CONFIG);

      expect(envelope.startsWith("v1:")).toBe(true);
      const parts = envelope.split(":");
      expect(parts).toHaveLength(4);

      // nonce must be 12 bytes base64url, tag 16 bytes base64url
      expect(Buffer.from(parts[1], "base64url").length).toBe(12);
      expect(Buffer.from(parts[2], "base64url").length).toBe(16);
      expect(Buffer.from(parts[3], "base64url").length).toBeGreaterThan(0);

      // the token must not appear anywhere in the envelope
      expect(envelope).not.toContain("secret-access-token");
      expect(envelope).not.toContain("secret-refresh-token");
      expect(envelope).not.toContain("accessToken");
    });

    it("uses a fresh random nonce so identical plaintexts encrypt differently", () => {
      const a = encryptConfig(SAMPLE_CONFIG);
      const b = encryptConfig(SAMPLE_CONFIG);
      expect(a).not.toBe(b);
      expect(decryptConfig(a)).toBe(decryptConfig(b));
    });

    it("legacy plaintext still passes through when a key is set (lazy migration)", () => {
      expect(decryptConfig(SAMPLE_CONFIG)).toBe(SAMPLE_CONFIG);
    });

    it("returns null for a tampered envelope (auth tag mismatch)", () => {
      const envelope = encryptConfig(SAMPLE_CONFIG);
      const parts = envelope.split(":");
      // flip a character in the ciphertext segment
      const ct = parts[3];
      const flipped = ct[0] === "A" ? "B" + ct.slice(1) : "A" + ct.slice(1);
      const tampered = [parts[0], parts[1], parts[2], flipped].join(":");

      expect(decryptConfig(tampered)).toBeNull();
    });

    it("returns null for a malformed envelope", () => {
      expect(decryptConfig("v1:not-an-envelope")).toBeNull();
      expect(decryptConfig("v1:a:b:c:d:e")).toBeNull();
      expect(decryptConfig("v1::")).toBeNull();
    });

    it("returns null when the wrong key is used (key rotation mismatch)", () => {
      const envelope = encryptConfig(SAMPLE_CONFIG);
      secretValue.value = "YmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejEyMzQ1Ng=="; // different 32 bytes
      expect(decryptConfig(envelope)).toBeNull();
    });
  });

  describe("ENCRYPTION_KEY invalid (set but wrong shape)", () => {
    it("encryptConfig throws a clear error (fail closed on operator error)", () => {
      secretValue.value = "too-short";

      expect(() => encryptConfig(SAMPLE_CONFIG)).toThrow(
        /ENCRYPTION_KEY must be 32 bytes/,
      );
    });

    it("decryptConfig never throws — invalid key means unconfigured", () => {
      secretValue.value = "too-short";
      const envelope = (() => {
        secretValue.value = TEST_KEY;
        return encryptConfig(SAMPLE_CONFIG);
      })();
      secretValue.value = "too-short";

      expect(() => decryptConfig(envelope)).not.toThrow();
      expect(decryptConfig(envelope)).toBeNull();
    });
  });
});
