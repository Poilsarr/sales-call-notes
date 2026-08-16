import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockAuth, mockGetUser, mockIssueSignedToken, mockPresignUrl } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetUser: vi.fn(),
  mockIssueSignedToken: vi.fn(),
  mockPresignUrl: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/get-user", () => ({
  getUserByClerkId: mockGetUser,
}));

vi.mock("@vercel/blob", () => ({
  issueSignedToken: mockIssueSignedToken,
  presignUrl: mockPresignUrl,
}));

import { POST } from "@/app/api/upload-url/route";

function jsonRequest(overrides: Record<string, unknown> = {}): Request {
  return new Request("https://usegauge.com/api/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      filename: "call.webm",
      fileSize: 1024 * 1024,
      contentType: "audio/webm",
      ...overrides,
    }),
  });
}

describe("POST /api/upload-url", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BLOB_STORE_ID = "store_4SiryHapG57GVkfq";
    mockAuth.mockResolvedValue({ userId: "clerk-1" });
    mockGetUser.mockResolvedValue({ id: "user-1", plan: "free" });
    mockIssueSignedToken.mockResolvedValue("signed-token");
    mockPresignUrl.mockResolvedValue({
      presignedUrl: "https://verify-upload.blob.vercel-storage.com/upload",
    });
  });

  afterEach(() => {
    delete process.env.BLOB_STORE_ID;
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST(jsonRequest());

    expect(response.status).toBe(401);
  });

  it("returns 500 when BLOB_STORE_ID is not set", async () => {
    delete process.env.BLOB_STORE_ID;

    const response = await POST(jsonRequest());

    expect(response.status).toBe(500);
  });

  it("rejects files over the plan's size limit", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1", plan: "free" });

    const response = await POST(jsonRequest({ fileSize: 31 * 1024 * 1024 }));

    expect(response.status).toBe(400);
    expect(mockIssueSignedToken).not.toHaveBeenCalled();
  });

  it("returns the SDK's presignedUrl plus a prefix-less .private blobUrl", async () => {
    const response = await POST(jsonRequest({ filename: "call.webm" }));

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(mockIssueSignedToken).toHaveBeenCalledWith({
      pathname: expect.stringMatching(/^uploads\/clerk-1\/[0-9a-f-]+\.webm$/),
      operations: ["put"],
      validUntil: expect.any(Number),
    });
    expect(mockPresignUrl).toHaveBeenCalledWith(
      "signed-token",
      expect.objectContaining({ access: "private" }),
    );
    expect(body.blobUrl).toBe(
      `https://4SiryHapG57GVkfq.private.blob.vercel-storage.com/${(mockIssueSignedToken as any).mock.calls[0][0].pathname}`,
    );
    expect(body.blobUrl).not.toContain("store_");
    expect(body.contentType).toBe("audio/webm");
  });

  it("derives content type and extension from the request", async () => {
    const response = await POST(jsonRequest({ filename: "recording.wav", contentType: "audio/wav" }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.contentType).toBe("audio/wav");
    expect((mockIssueSignedToken as any).mock.calls[0][0].pathname).toMatch(/\.wav$/);
  });

  it("falls back to audio/webm for malformed content types", async () => {
    const response = await POST(jsonRequest({ filename: "call.webm", contentType: "not a mime" }));

    expect(response.status).toBe(200);
    expect((await response.json()).contentType).toBe("audio/webm");
  });

  it("returns 500 with a readable error when blob signing throws", async () => {
    mockIssueSignedToken.mockRejectedValue(new Error("token rejected"));

    const response = await POST(jsonRequest());

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toContain("token rejected");
  });
});
