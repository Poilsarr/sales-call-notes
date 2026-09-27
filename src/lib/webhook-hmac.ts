import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Sign a webhook payload body with HMAC-SHA256.
 *
 * Returns `sha256=<hex>` so receivers can compare against the
 * `X-Gauge-Signature` header value directly.
 */
export function sign(payload: string, secret: string): string {
  const hex = createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  return `sha256=${hex}`;
}

/**
 * Verify a `sha256=<hex>` signature produced by {@link sign}.
 * Uses timing-safe comparison. Returns false for missing/empty inputs
 * or malformed signatures instead of throwing.
 */
export function verify(
  payload: string,
  signature: string | null | undefined,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  try {
    const expected = sign(payload, secret);
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
