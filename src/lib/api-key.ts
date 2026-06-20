/**
 * API key primitives (Level 5.3).
 *
 * Format:   cn_live_<32 url-safe chars>      production / default
 *           cn_test_<32 url-safe chars>      test mode (NODE_ENV !== production)
 *
 * Storage:  the raw key is shown to the user ONCE on creation. We store
 *           sha-256(key) in `ApiKey.hash` plus the 12-char prefix in
 *           `ApiKey.prefix` (for lookup). The raw key cannot be recovered.
 *
 * Lookup:   by prefix → fetch candidate row → compare hash.
 *           Prefix uniqueness is enforced by Prisma's @unique.
 *
 * Scopes:   "read"      GET endpoints only
 *           "read_write" GET + POST/PUT/PATCH/DELETE
 */

import { createHash, randomBytes } from "node:crypto";

export type ApiKeyScope = "read" | "read_write";

const KEY_BYTES = 24; // 24 random bytes → 32 url-safe chars after base64
const PREFIX_LEN = 12; // visible in `cn_live_xxxx` for human identification

export function generateApiKey(env: string = process.env.NODE_ENV ?? "development"): {
  raw: string;
  prefix: string;
  hash: string;
} {
  const envTag = env === "production" ? "live" : "test";
  const random = randomBytes(KEY_BYTES)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  const raw = `cn_${envTag}_${random}`;
  const prefix = raw.slice(0, PREFIX_LEN);
  const hash = hashKey(raw);
  return { raw, prefix, hash };
}

export function hashKey(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

/**
 * Extract the raw key from an Authorization: Bearer header.
 * Returns null if the header is missing, malformed, or doesn't look like our key.
 */
export function extractBearerKey(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null;
  const m = /^Bearer\s+(\S+)$/.exec(authHeader.trim());
  if (!m) return null;
  const candidate = m[1];
  if (!candidate.startsWith("cn_live_") && !candidate.startsWith("cn_test_")) return null;
  if (candidate.length < 20) return null;
  return candidate;
}

export function prefixOf(raw: string): string {
  return raw.slice(0, PREFIX_LEN);
}

export function isReadMethod(method: string): boolean {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

export function scopeAllowsMethod(scope: string, method: string): boolean {
  if (scope === "read_write") return true;
  if (scope === "read") return isReadMethod(method);
  return false;
}