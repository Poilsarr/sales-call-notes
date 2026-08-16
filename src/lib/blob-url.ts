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
    // Vercel Blob's canonical URL is `${storeId}.${access}.blob.vercel-storage.com`
    // (the presigned PUT response returns the access-qualified hostname, e.g.
    // store_x.private.blob.vercel-storage.com). Accept the bare form too so
    // server-constructed URLs keep working.
    const bare = `${storeId}.blob.vercel-storage.com`;
    return (
      parsed.hostname === bare ||
      parsed.hostname === `${storeId}.private.blob.vercel-storage.com` ||
      parsed.hostname === `${storeId}.public.blob.vercel-storage.com`
    );
  }
  return parsed.hostname.endsWith('.blob.vercel-storage.com');
}
