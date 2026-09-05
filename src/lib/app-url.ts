import { getSecret } from "@/lib/secrets";

// Vercel deployment URLs that are known to be gone (historical project rename).
// These 410 permanently — the env var must never resolve to them.
const STALE_HOSTS = new Set([
  "sales-call-notes-kushagarh-singhs-projects.vercel.app",
]);

const CANONICAL_PROD_URL = "https://usegauge.vercel.app";
const FALLBACK_LOCAL_URL = "http://localhost:3000";

/**
 * Resolves the canonical app URL.
 *
 * Priority:
 *  1. NEXT_PUBLIC_APP_URL (if set and not stale)
 *  2. GOOGLE_REDIRECT_URI origin (only for google flows — not here)
 *  3. VERCEL_PROJECT_PRODUCTION_URL (Vercel sets this to the production alias)
 *  4. VERCEL_URL (current deployment URL — preview deployments)
 *  5. localhost fallback
 *
 * The stale-host guard prevents a 410 GONE regression when an operator
 * renames the Vercel project but forgets to rotate the env var. A stale
 * host silently falls back to the canonical prod URL (or Vercel-injected
 * URL) instead of redirecting the user to a dead deployment.
 *
 * @param requestOrigin - optional `req.nextUrl.origin` or `req.headers.get('origin')`
 *                        for request-aware fallback. When supplied and the env var
 *                        is missing, it wins over VERCEL_URL so OAuth redirects
 *                        match the host the browser actually hit.
 */
export function getAppUrl(requestOrigin?: string | null): string {
  const raw = getSecret("NEXT_PUBLIC_APP_URL");
  const cleaned = raw ? raw.trim().replace(/\/$/, "") : "";

  if (cleaned) {
    try {
      const host = new URL(cleaned).host;
      if (STALE_HOSTS.has(host)) {
        console.warn(
          `[app-url] NEXT_PUBLIC_APP_URL points to stale host ${host} — falling back to ${CANONICAL_PROD_URL}. Update the env var in Vercel.`
        );
        // Prefer request origin if caller supplied it (keeps preview OAuth on
        // the preview host rather than forcing prod), otherwise canonical prod.
        if (requestOrigin) {
          try {
            const originHost = new URL(requestOrigin).host;
            if (!STALE_HOSTS.has(originHost)) return requestOrigin.replace(/\/$/, "");
          } catch {
            // ignore malformed origin
          }
        }
        return CANONICAL_PROD_URL;
      }
      return cleaned;
    } catch {
      console.warn(`[app-url] NEXT_PUBLIC_APP_URL is not a valid URL: ${cleaned}`);
      // fall through to fallback chain
    }
  }

  if (requestOrigin) {
    try {
      const u = new URL(requestOrigin);
      // Never return a stale host even if the request itself is stale (edge case).
      if (!STALE_HOSTS.has(u.host)) return u.origin;
    } catch {
      // ignore
    }
  }

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) {
    const url = vercelProd.startsWith("http") ? vercelProd : `https://${vercelProd}`;
    try {
      if (!STALE_HOSTS.has(new URL(url).host)) return url.replace(/\/$/, "");
    } catch {
      // ignore
    }
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    const url = vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
    try {
      if (!STALE_HOSTS.has(new URL(url).host)) return url.replace(/\/$/, "");
    } catch {
      // ignore
    }
  }

  return process.env.NODE_ENV === "production" ? CANONICAL_PROD_URL : FALLBACK_LOCAL_URL;
}

/**
 * Whether the currently configured NEXT_PUBLIC_APP_URL is stale.
 * Exported for diagnostics (/api/health or integration status).
 */
export function isAppUrlStale(): boolean {
  const raw = getSecret("NEXT_PUBLIC_APP_URL");
  if (!raw) return false;
  try {
    return STALE_HOSTS.has(new URL(raw.trim()).host);
  } catch {
    return false;
  }
}
