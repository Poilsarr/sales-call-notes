/**
 * Only fetch blobs from our own Vercel Blob store. Without this allow-list an
 * authenticated user could point blobUrl at an arbitrary server and receive
 * the BLOB_READ_WRITE_TOKEN (Bearer exfiltration) or probe internal
 * endpoints (SSRF). BLOB_STORE_ID is the store we hand out presigned URLs for
 * in /api/upload-url.
 */
const BLOB_HOST_SUFFIX = '.blob.vercel-storage.com';

/**
 * Vercel Blob's canonical hostname is `{storeId}.{access}.blob.vercel-storage.com`
 * with a PREFIX-LESS storeId — the SDK strips `store_` via normalizeStoreId
 * (node_modules/@vercel/blob/dist/chunk-CIIQSN42.js) before constructing any
 * URL, and the presigned PUT response's `url` field uses this prefix-less
 * form. The env var may be set either way, so accept hostnames built from
 * both the raw and normalized id (bare, `.private`, and `.public` access).
 */
function isOurStoreHostname(hostname: string): boolean {
  const raw = process.env.BLOB_STORE_ID;
  if (!raw) return false;
  const normalized = raw.startsWith('store_') ? raw.slice('store_'.length) : raw;
  // new URL().hostname is lowercased, but BLOB_STORE_ID (and thus the SDK's
  // canonical URLs) preserves the store id's original case, so compare
  // case-insensitively.
  const ids = new Set([
    raw.toLowerCase(),
    normalized.toLowerCase(),
    `store_${normalized.toLowerCase()}`,
  ]);
  for (const id of ids) {
    if (
      hostname === `${id}.blob.vercel-storage.com` ||
      hostname === `${id}.private.blob.vercel-storage.com` ||
      // `.public` acceptance is LEGACY compat only: blobs written before
      // 2026-08-19 (the public `blobPut` in analyze/route.ts) must keep
      // playing for existing calls. All new writes are private.
      hostname === `${id}.public.blob.vercel-storage.com`
    ) {
      return true;
    }
  }
  return false;
}

export function isTrustedBlobUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  // Only the default HTTPS port. Anything else lets an authenticated user
  // drive our serverless function at arbitrary ports on Vercel's shared blob
  // edge IPs (port probing / non-standard egress).
  if (parsed.port && parsed.port !== '443') return false;
  if (process.env.BLOB_STORE_ID) {
    return isOurStoreHostname(parsed.hostname);
  }
  return parsed.hostname.endsWith(BLOB_HOST_SUFFIX);
}
