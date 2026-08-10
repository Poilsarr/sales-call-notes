import crypto from "node:crypto";
import { getSecret } from "@/lib/secrets";

/**
 * At-rest encryption for OAuth integration configs (INTEGRATIONS-FIX TRD, G2).
 *
 * Envelope format (AES-256-GCM):
 *   `v1:<nonceBase64url>:<authTagBase64url>:<ciphertextBase64url>`
 * The TRD specifies `v1:nonce:ciphertext`; the 16-byte GCM auth tag is stored
 * as its own colon-separated segment inside the envelope so decryption always
 * authenticates the ciphertext (tamper detection) without extra storage.
 *
 * ENCRYPTION_KEY — server-env only, never exposed across the HTTP boundary.
 * 32 random bytes, base64-encoded. Generate with `openssl rand -base64 32`.
 * A 64-char hex key is also accepted.
 *
 * Missing-key policy (Hobby-friendly, fail-open): when ENCRYPTION_KEY is
 * unset, `encryptConfig` returns the input unchanged (legacy plaintext) and
 * logs a one-time warning. Tradeoff: new writes remain plaintext until the
 * key is provisioned — identical to today's posture, so a deploy where the
 * env var hasn't been added yet does not break OAuth connect flows, and the
 * lazy migration keeps reading pre-existing plaintext rows either way. The
 * stricter alternative (throw on every write) would 500 every connect
 * attempt on a misconfigured deploy, which is worse for a single-region
 * Hobby app. A key that is SET but invalid (wrong length/encoding) DOES
 * throw from `encryptConfig`: that signals operator error, not absence, and
 * silently writing plaintext under a broken key would be worse than failing.
 *
 * `decryptConfig` NEVER throws: legacy plaintext is returned as-is, and any
 * envelope that cannot be decrypted (missing/invalid key, malformed or
 * tampered payload) is logged and treated as unconfigured (null) so a bad
 * row can never crash a request.
 */

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const NONCE_BYTES = 12;
const TAG_BYTES = 16;
const ENVELOPE_PREFIX = "v1:";
const ENV_KEY_NAME = "ENCRYPTION_KEY";

let warnedMissingKey = false;

type KeyLoad = { key: Buffer | null; error: string | null };

function loadKey(): KeyLoad {
  const raw = getSecret(ENV_KEY_NAME);
  if (!raw) return { key: null, error: null };

  const base64 = Buffer.from(raw, "base64");
  if (base64.length === KEY_BYTES) return { key: base64, error: null };

  const hex = Buffer.from(raw, "hex");
  if (hex.length === KEY_BYTES) return { key: hex, error: null };

  return {
    key: null,
    error:
      `[config-crypto] ENCRYPTION_KEY must be ${KEY_BYTES} bytes ` +
      `(base64, e.g. \`openssl rand -base64 32\`, or 64 hex chars); ` +
      `got ${raw.length} chars`,
  };
}

function warnMissingKeyOnce() {
  if (warnedMissingKey) return;
  warnedMissingKey = true;
  console.warn(
    "[config-crypto] ENCRYPTION_KEY is not set — integration configs will be " +
      "stored as legacy plaintext. Set it (`openssl rand -base64 32`) to " +
      "encrypt OAuth tokens at rest.",
  );
}

/**
 * Encrypts a plaintext JSON config string. Returns the `v1:` envelope, or the
 * input unchanged when ENCRYPTION_KEY is absent (see policy above).
 * Throws a clear error when ENCRYPTION_KEY is set but invalid.
 */
export function encryptConfig(plaintext: string): string {
  const { key, error } = loadKey();
  if (!key) {
    if (error) throw new Error(error);
    warnMissingKeyOnce();
    return plaintext;
  }

  const nonce = crypto.randomBytes(NONCE_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  // ENVELOPE_PREFIX already carries the trailing colon — build the rest
  // without double-separating (`v1::nonce:...` would be malformed).
  return ENVELOPE_PREFIX + [nonce.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(":");
}

/**
 * Decrypts a stored config payload. Never throws.
 * - null → null
 * - legacy plaintext (no `v1:` prefix) → returned as-is (lazy migration)
 * - `v1:` envelope → decrypted; on any failure (missing/invalid key,
 *   malformed/tampered payload) logs and returns null (treated as
 *   unconfigured by callers).
 */
export function decryptConfig(payload: string | null): string | null {
  if (!payload) return null;
  if (!payload.startsWith(ENVELOPE_PREFIX)) return payload;

  const parts = payload.split(":");
  if (parts.length !== 4) {
    console.error("[config-crypto] malformed encrypted config envelope — treating as unconfigured");
    return null;
  }

  const { key, error } = loadKey();
  if (!key) {
    console.error(
      error
        ? `${error} — cannot decrypt stored config, treating as unconfigured`
        : "[config-crypto] ENCRYPTION_KEY is not set but an encrypted config was found — treating as unconfigured",
    );
    return null;
  }

  try {
    const [, nonceB64, tagB64, ciphertextB64] = parts;
    const nonce = Buffer.from(nonceB64, "base64url");
    const tag = Buffer.from(tagB64, "base64url");
    const ciphertext = Buffer.from(ciphertextB64, "base64url");

    if (nonce.length !== NONCE_BYTES || tag.length !== TAG_BYTES) {
      console.error("[config-crypto] invalid envelope segment lengths — treating as unconfigured");
      return null;
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, nonce);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString("utf8");
  } catch {
    console.error(
      "[config-crypto] decryption failed (key mismatch or tampered payload) — treating as unconfigured",
    );
    return null;
  }
}
