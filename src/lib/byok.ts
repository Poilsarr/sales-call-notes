/**
 * BYOK (bring-your-own-key) primitives.
 *
 * Users on Pro+ can supply their own OpenAI / Groq API keys so their
 * calls bill against their key instead of Gauge's shared pool. Raw keys
 * are encrypted at rest with AES-256-GCM using a master key from the
 * BYOK_MASTER_KEY env var. We can never recover the plaintext without
 * that key — DB dumps leak nothing.
 *
 * Payload format: `<iv>.<authTag>.<ciphertext>` (each base64).
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getSecret } from "@/lib/secrets";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;

function masterKey(): Buffer {
  const raw = getSecret("BYOK_MASTER_KEY");
  if (!raw) {
    throw new Error(
      "BYOK_MASTER_KEY is not set. Add it to Vercel env vars (a long random string, " +
      "e.g. `openssl rand -base64 32`). Without it, user-supplied AI keys cannot be saved."
    );
  }
  return createHash("sha256").update(raw, "utf8").digest();
}

export function encryptSecret(plain: string): string {
  if (!plain) {
    throw new Error(
      "Cannot encrypt an empty secret. Callers must treat empty input as a deletion."
    );
  }
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, masterKey(), iv);
  // Bind the IV as additional authenticated data so a corrupted or
  // swapped IV fails GCM auth on decrypt instead of silently yielding
  // a wrong plaintext key.
  cipher.setAAD(iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(".");
}

export function decryptSecret(payload: string): string {
  const parts = payload.split(".");
  if (parts.length !== 3 || parts.some((p) => !p)) {
    throw new Error("Malformed encrypted secret");
  }
  const iv = Buffer.from(parts[0], "base64");
  const decipher = createDecipheriv(ALGO, masterKey(), iv);
  decipher.setAAD(iv);
  decipher.setAuthTag(Buffer.from(parts[1], "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(parts[2], "base64")),
    decipher.final(),
  ]).toString("utf8");
}

const MAX_KEY_LENGTH = 256;

/**
 * Plausibility gate for user-supplied provider keys. Rejects junk before
 * it gets encrypted + stored (and later stuffed into an Authorization
 * header). Provider prefixes are case-sensitive:
 *   OpenAI: sk-… / sk_…    Groq: gsk_…
 */
export function isPlausibleKey(provider: "openai" | "groq", key: string): boolean {
  const trimmed = key.trim();
  if (trimmed.length < 20 || trimmed.length > MAX_KEY_LENGTH) return false;
  if (/\s/.test(trimmed)) return false;
  if (provider === "openai") return trimmed.startsWith("sk-") || trimmed.startsWith("sk_");
  if (provider === "groq") return trimmed.startsWith("gsk_");
  return false;
}

/** Display helper: `sk-…abcd` style preview. Never show more than the tail. */
export function maskKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "•".repeat(trimmed.length);
  return `${trimmed.slice(0, 3)}…${trimmed.slice(-4)}`;
}
