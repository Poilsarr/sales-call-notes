/**
 * Only fetch blobs from our own Vercel Blob store. Without this allow-list an
 * authenticated user could point blobUrl at an arbitrary server and receive
 * the BLOB_READ_WRITE_TOKEN (Bearer exfiltration) or probe internal
 * endpoints (SSRF). BLOB_STORE_ID is the store we hand out presigned URLs for
 * in /api/upload-url.
 */
export function isTrustedBlobUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  const storeId = process.env.BLOB_STORE_ID;
  if (storeId) {
    return parsed.hostname === `${storeId}.blob.vercel-storage.com`;
  }
  return parsed.hostname.endsWith('.blob.vercel-storage.com');
}
