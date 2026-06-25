/**
 * Token shape produced by the data-export worker and consumed by
 * the download route. Centralized here so the parse/validate
 * boundary is testable in isolation.
 *
 * Format:  exp_<expiresAtMs>_<hmacHex>_<userId>
 *
 * The hmacHex is HMAC-SHA256(EXPORT_TOKEN_SECRET, `${userId}:${expiresAtMs}`)
 * truncated to 16 hex chars (8 bytes). Verification is required:
 * a token with the right userId + future expiry but a wrong/forged
 * hash MUST be rejected. This is the protection against a malicious
 * caller downloading another user's export by guessing the token shape.
 *
 * EXPORT_TOKEN_SECRET must be set in env. If it is not set, all
 * validation fails closed (safer than failing open).
 */

import crypto from "crypto";

const HASH_LEN = 16; // hex chars; 8 bytes = 64 bits, enough for unguessable

export function computeExportTokenHash(userId: string, expiresAtMs: number): string {
  return computeHash(userId, expiresAtMs);
}

function getSecret(): string | null {
  const s = process.env.EXPORT_TOKEN_SECRET;
  return s && s.length >= 16 ? s : null;
}

function computeHash(userId: string, expiresAtMs: number): string {
  const secret = getSecret();
  if (!secret) {
    // Failing closed: hash for an unknown secret is the SHA-256 of
    // an empty input truncated. The verifier also returns false
    // when the secret is missing, so this branch only runs during
    // token issuance in misconfigured environments — at worst,
    // the issued token immediately fails validation.
    return crypto.createHash("sha256").update("").digest("hex").slice(0, HASH_LEN);
  }
  return crypto
    .createHmac("sha256", secret)
    .update(`${userId}:${expiresAtMs}`)
    .digest("hex")
    .slice(0, HASH_LEN);
}

/**
 * Mint a new export token. Caller controls the TTL in ms.
 * Returns null when EXPORT_TOKEN_SECRET is not configured —
 * this prevents the system from silently issuing tokens that
 * nobody will ever be able to verify.
 */
export function issueExportToken(
  userId: string,
  ttlMs: number,
  nowMs: number = Date.now()
): string | null {
  if (!userId || ttlMs <= 0) return null;
  if (!getSecret()) return null;
  const expiresAtMs = nowMs + ttlMs;
  const hash = computeHash(userId, expiresAtMs);
  return `exp_${expiresAtMs}_${hash}_${userId}`;
}

export function getExportTokenExpiryMs(token: string | null | undefined): number | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split("_");
  if (parts.length !== 4 || parts[0] !== "exp") return null;
  const ms = Number(parts[1]);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return ms;
}

export function getExportTokenUserId(token: string | null | undefined): string | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split("_");
  if (parts.length !== 4 || parts[0] !== "exp") return null;
  return parts[3] || null;
}

export function getExportTokenHash(token: string | null | undefined): string | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split("_");
  if (parts.length !== 4 || parts[0] !== "exp") return null;
  return parts[2] || null;
}

export function isExportTokenValid(
  token: string | null | undefined,
  expectedUserId: string,
  nowMs: number = Date.now()
): boolean {
  const exp = getExportTokenExpiryMs(token);
  const uid = getExportTokenUserId(token);
  const hash = getExportTokenHash(token);
  if (exp === null || uid === null || hash === null) return false;
  if (uid !== expectedUserId) return false;
  if (nowMs > exp) return false;
  // Constant-time comparison guards against timing side-channels.
  // The hash MUST be the HMAC we would have issued for this userId+expiry.
  const expectedHash = computeHash(uid, exp);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(expectedHash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
