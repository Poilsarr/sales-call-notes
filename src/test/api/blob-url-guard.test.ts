import { describe, it, expect, afterEach } from "vitest";

const originalStoreId = process.env.BLOB_STORE_ID;

afterEach(() => {
  if (originalStoreId === undefined) delete process.env.BLOB_STORE_ID;
  else process.env.BLOB_STORE_ID = originalStoreId;
});

describe("isTrustedBlobUrl (SSRF / BLOB-token exfiltration guard)", () => {
  it("accepts https URLs on our own blob store", async () => {
    process.env.BLOB_STORE_ID = "store_abc";
    const { isTrustedBlobUrl } = await import("@/lib/blob-url");
    expect(isTrustedBlobUrl("https://store_abc.blob.vercel-storage.com/uploads/u1/a.webm")).toBe(true);
  });

  it("accepts access-qualified (private) blob store hostnames", async () => {
    process.env.BLOB_STORE_ID = "store_abc";
    const { isTrustedBlobUrl } = await import("@/lib/blob-url");
    expect(isTrustedBlobUrl("https://store_abc.private.blob.vercel-storage.com/uploads/u1/a.webm")).toBe(true);
  });

  it("accepts access-qualified (public) blob store hostnames", async () => {
    process.env.BLOB_STORE_ID = "store_abc";
    const { isTrustedBlobUrl } = await import("@/lib/blob-url");
    expect(isTrustedBlobUrl("https://store_abc.public.blob.vercel-storage.com/uploads/u1/a.webm")).toBe(true);
  });

  it("rejects arbitrary hosts (token exfiltration target)", async () => {
    process.env.BLOB_STORE_ID = "store_abc";
    const { isTrustedBlobUrl } = await import("@/lib/blob-url");
    expect(isTrustedBlobUrl("https://evil.example.com/capture?token=hijack")).toBe(false);
  });

  it("rejects access-qualified hostnames of a different store", async () => {
    process.env.BLOB_STORE_ID = "store_abc";
    const { isTrustedBlobUrl } = await import("@/lib/blob-url");
    expect(isTrustedBlobUrl("https://store_other.private.blob.vercel-storage.com/call.wav")).toBe(false);
  });

  it("rejects non-HTTPS and malformed URLs", async () => {
    process.env.BLOB_STORE_ID = "store_abc";
    const { isTrustedBlobUrl } = await import("@/lib/blob-url");
    expect(isTrustedBlobUrl("http://store_abc.blob.vercel-storage.com/x")).toBe(false);
    expect(isTrustedBlobUrl("not a url")).toBe(false);
  });

  it("rejects metadata endpoints (SSRF probe)", async () => {
    process.env.BLOB_STORE_ID = "store_abc";
    const { isTrustedBlobUrl } = await import("@/lib/blob-url");
    expect(isTrustedBlobUrl("https://169.254.169.254/latest/meta-data/")).toBe(false);
  });

  it("falls back to suffix check when BLOB_STORE_ID is unset", async () => {
    delete process.env.BLOB_STORE_ID;
    const { isTrustedBlobUrl } = await import("@/lib/blob-url");
    expect(isTrustedBlobUrl("https://other.blob.vercel-storage.com/x")).toBe(true);
    expect(isTrustedBlobUrl("https://evil.example.com/x")).toBe(false);
  });
});
