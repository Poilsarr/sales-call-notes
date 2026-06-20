/**
 * Per-team branding helpers (Level 5.1).
 *
 * - brandColor: CSS hex string ("#5b21b6"). Validated against a tight pattern.
 * - logoUrl:    absolute URL (https). Validated to prevent javascript:/data: injection.
 *
 * The validator is intentionally strict — we inject the color via a CSS custom
 * property and the URL into an <img src>, so anything other than a real https URL
 * is rejected.
 */

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const HTTPS_URL = /^https:\/\/[^\s]+$/i;

export function isValidBrandColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

export function isValidLogoUrl(value: unknown): value is string {
  return typeof value === "string" && HTTPS_URL.test(value);
}

export type TeamBrandingUpdate = {
  brandColor?: string | null;
  logoUrl?: string | null;
};

export function validateBrandingUpdate(input: unknown): {
  ok: true;
  data: TeamBrandingUpdate;
} | {
  ok: false;
  error: string;
} {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const body = input as Record<string, unknown>;
  const out: TeamBrandingUpdate = {};

  if ("brandColor" in body) {
    const v = body.brandColor;
    if (v === null || v === "") {
      out.brandColor = null;
    } else if (!isValidBrandColor(v)) {
      return { ok: false, error: "brandColor must be a hex color like #5b21b6" };
    } else {
      out.brandColor = v.toLowerCase();
    }
  }

  if ("logoUrl" in body) {
    const v = body.logoUrl;
    if (v === null || v === "") {
      out.logoUrl = null;
    } else if (!isValidLogoUrl(v)) {
      return { ok: false, error: "logoUrl must be an https:// URL" };
    } else {
      out.logoUrl = v;
    }
  }

  return { ok: true, data: out };
}

export const DEFAULT_BRAND_COLOR = "#5b21b6"; // tailwind violet-800