import { describe, it, expect, beforeEach } from "vitest";
import { encryptSecret, decryptSecret, maskKey, isPlausibleKey } from "@/lib/byok";

const MASTER = "test-master-key-0123456789abcdef";

describe("byok crypto", () => {
  beforeEach(() => {
    process.env.BYOK_MASTER_KEY = MASTER;
  });

  it("round-trips a secret through encrypt -> decrypt", () => {
    const secret = "sk-proj-1234567890abcdefghijklmnopqrstuvwxyz";
    const encrypted = encryptSecret(secret);
    expect(encrypted).not.toContain(secret);
    expect(decryptSecret(encrypted)).toBe(secret);
  });

  it("produces unique ciphertexts for the same secret (random IV)", () => {
    const a = encryptSecret("same-secret");
    const b = encryptSecret("same-secret");
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe("same-secret");
    expect(decryptSecret(b)).toBe("same-secret");
  });

  it("fails to decrypt tampered ciphertext (GCM auth tag)", () => {
    const encrypted = encryptSecret("precious");
    const tampered = encrypted.slice(0, -2) + (encrypted.endsWith("AA") ? "BB" : "AA");
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("fails loudly on malformed payloads", () => {
    expect(() => decryptSecret("not-a-valid-payload")).toThrow();
    expect(() => decryptSecret("a.b")).toThrow();
  });

  it("throws an actionable error when BYOK_MASTER_KEY is missing", () => {
    delete process.env.BYOK_MASTER_KEY;
    expect(() => encryptSecret("x")).toThrow(/BYOK_MASTER_KEY/);
    expect(() => decryptSecret("a.b.c")).toThrow(/BYOK_MASTER_KEY/);
  });

  it("masks keys for display, keeping only the first 3 and last 4 chars", () => {
    expect(maskKey("sk-proj-abcdef123456")).toBe("sk-…3456");
    expect(maskKey("short")).toBe("•••••");
  });

  it("cannot be decrypted with a different master key", () => {
    const encrypted = encryptSecret("secret-under-key-A");
    process.env.BYOK_MASTER_KEY = "a-different-master-key-entirely";
    expect(() => decryptSecret(encrypted)).toThrow();
  });

  it("fails to decrypt when the IV is tampered with (AAD binding)", () => {
    const encrypted = encryptSecret("precious-iv");
    const [iv, tag, ciphertext] = encrypted.split(".");
    const flippedIv = Buffer.from(iv, "base64");
    flippedIv[0] = flippedIv[0] ^ 0xff;
    const tampered = `${flippedIv.toString("base64")}.${tag}.${ciphertext}`;
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("round-trips unicode secrets", () => {
    const secret = "sk-proj-✈️ 日本語 émoji";
    expect(decryptSecret(encryptSecret(secret))).toBe(secret);
  });

  it("round-trips very long secrets (10KB)", () => {
    const secret = "sk-proj-" + "a".repeat(10 * 1024);
    expect(decryptSecret(encryptSecret(secret))).toBe(secret);
  });

  it("rejects empty-string secrets loudly (route clears keys with '' -> null)", () => {
    // An empty ciphertext part would be indistinguishable from corruption,
    // so empty input is a contract violation, not a valid round-trip.
    expect(() => encryptSecret("")).toThrow(/empty/i);
  });

  it("masks keys at length boundaries", () => {
    expect(maskKey("")).toBe("");
    expect(maskKey("  ")).toBe("");
    expect(maskKey("12345678")).toBe("••••••••");
    expect(maskKey("123456789")).toBe("123…6789");
  });
});

describe("isPlausibleKey", () => {
  it("accepts real-looking OpenAI keys (sk- and sk_)", () => {
    expect(isPlausibleKey("openai", "sk-proj-abcdefghijklmnopqrstuvwx")).toBe(true);
    expect(isPlausibleKey("openai", "sk_abcdefghijklmnopqrstuvwx")).toBe(true);
  });

  it("accepts real-looking Groq keys (gsk_)", () => {
    expect(isPlausibleKey("groq", "gsk_abcdefghijklmnopqrstuvwx")).toBe(true);
  });

  it("rejects the wrong provider prefix", () => {
    expect(isPlausibleKey("openai", "gsk_abcdefghijklmnopqrstuvwx")).toBe(false);
    expect(isPlausibleKey("groq", "sk-proj-abcdefghijklmnopqrstuvwx")).toBe(false);
  });

  it("rejects keys shorter than 20 chars or longer than 256", () => {
    expect(isPlausibleKey("openai", "sk-" + "a".repeat(16))).toBe(false);
    expect(isPlausibleKey("openai", "sk-" + "a".repeat(255))).toBe(false);
  });

  it("rejects keys containing whitespace", () => {
    expect(isPlausibleKey("openai", "sk-proj abcdefghijklmnopqrstuvw")).toBe(false);
    expect(isPlausibleKey("groq", "gsk_abcdefghijklmno pqrstuvwx")).toBe(false);
  });

  it("is case-sensitive (lowercase prefixes are not real keys)", () => {
    expect(isPlausibleKey("openai", "sk-proj-abcdefghijklmnopqrstuvwx".toUpperCase())).toBe(false);
  });

  it("trims surrounding whitespace before validating", () => {
    expect(isPlausibleKey("openai", "  sk-proj-abcdefghijklmnopqrstuvwx  ")).toBe(true);
  });
});
