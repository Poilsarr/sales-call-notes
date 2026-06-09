import crypto from "crypto";

/**
 * Verify a HubSpot webhook signature.
 * HubSpot v3: HMAC-SHA256(secret, requestBody) base64-encoded, in `X-HubSpot-Signature-v3`.
 */
export function verifyHubSpotSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string,
  version: "v3" = "v3"
): boolean {
  if (!signature || !secret) return false;
  try {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("base64");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Verify a Salesforce outbound notification.
 * Salesforce signs the request as sha256(clientSecret + body), in `X-SF-Signature`.
 */
export function verifySalesforceSignature(
  rawBody: string,
  signature: string | null | undefined,
  clientSecret: string
): boolean {
  if (!signature || !clientSecret) return false;
  try {
    const expected = crypto
      .createHash("sha256")
      .update(clientSecret + rawBody)
      .digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
