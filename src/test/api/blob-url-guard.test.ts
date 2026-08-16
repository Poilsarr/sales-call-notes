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

  it("accepts the canonical prefix-less store id in hostnames", async () => {
    process.env.BLOB_STORE_ID = "store_abc";
    const { isTrustedBlobUrl } = await import("@/lib/blob-url");
    expect(isTrustedBlobUrl("https://abc.blob.vercel-storage.com/uploads/u1/a.webm")).toBe(true);
  });

  it("accepts prefix-less access-qualified (private) hostnames — the SDK's canonical form", async () => {
    process.env.BLOB_STORE_ID = "store_abc";
    const { isTrustedBlobUrl } = await import("@/lib/blob-url");
    expect(isTrustedBlobUrl("https://abc.private.blob.vercel-storage.com/uploads/u1/a.webm")).toBe(true);
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

  it("works when BLOB_STORE_ID is already prefix-less", async () => {
    process.env.BLOB_STORE_ID = "abc";
    const { isTrustedBlobUrl } = await import("@/lib/blob-url");
    expect(isTrustedBlobUrl("https://abc.private.blob.vercel-storage.com/uploads/u1/a.webm")).toBe(true);
    expect(isTrustedBlobUrl("https://store_abc.private.blob.vercel-storage.com/uploads/u1/a.webm")).toBe(true);
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
    expect(isTrustedBlobUrl("https://other.private.blob.vercel-storage.com/call.wav")).toBe(false);
  });

  it("rejects hostname suffix tricks", async () => {
    process.env.BLOB_STORE_ID = "store_abc";
    const { isTrustedBlobUrl } = await import("@/lib/blob-url");
    expect(isTrustedBlobUrl("https://store_abc.blob.vercel-storage.com.evil.example.com/x")).toBe(false);
    expect(isTrustedBlobUrl("https://abc.private.blob.vercel-storage.com.evil.example.com/x")).toBe(false);
  });

  it("accepts mixed-case store ids, matching the SDK's canonical URLs", async () => {
    process.env.BLOB_STORE_ID = "store_4SiryHapG57GVkfq";
    const { isTrustedBlobUrl } = await import("@/lib/blob-url");
    expect(isTrustedBlobUrl("https://4SiryHapG57GVkfq.private.blob.vercel-storage.com/uploads/u1/a.webm")).toBe(true);
    expect(isTrustedBlobUrl("https://4siryhapg57gvkfq.private.blob.vercel-storage.com/uploads/u1/a.webm")).toBe(true);
  });

  it("rejects non-443 ports on otherwise-valid store hostnames", async () => {
    process.env.BLOB_STORE_ID = "store_abc";
    const { isTrustedBlobUrl } = await import("@/lib/blob-url");
    expect(isTrustedBlobUrl("https://abc.private.blob.vercel-storage.com:8443/x")).toBe(false);
    expect(isTrustedBlobUrl("https://store_abc.blob.vercel-storage.com:9999/x")).toBe(false);
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
