import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockAuth, mockFindUnique, mockGetUser } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindUnique: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    call: {
      findUnique: mockFindUnique,
    },
  },
}));

vi.mock("@/lib/get-user", () => ({
  getUserByClerkId: mockGetUser,
}));

import { GET } from "@/app/api/calls/[id]/audio/route";

const VALID_BLOB =
  "https://4SiryHapG57GVkfq.private.blob.vercel-storage.com/uploads/user-1/uuid.webm";

function request(id = "call-1"): Request {
  return new Request(`https://usegauge.com/api/calls/${id}/audio`, { method: "GET" });
}

describe("GET /api/calls/[id]/audio — authenticated blob proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BLOB_STORE_ID = "store_4SiryHapG57GVkfq";
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    mockAuth.mockResolvedValue({ userId: "clerk-1" } as any);
    mockGetUser.mockResolvedValue({ id: "user-1", teamId: null, teamRole: "MEMBER" } as any);
  });

  afterEach(() => {
    delete process.env.BLOB_STORE_ID;
    delete process.env.BLOB_READ_WRITE_TOKEN;
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET(request(), { params: Promise.resolve({ id: "call-1" }) });

    expect(response.status).toBe(401);
  });

  it("returns 404 when the call does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);

    const response = await GET(request(), { params: Promise.resolve({ id: "call-1" }) });

    expect(response.status).toBe(404);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: "call-1" },
      select: expect.objectContaining({ audioUrl: true, filename: true }),
    });
  });

  it("returns 403 for a call the viewer cannot access", async () => {
    mockFindUnique.mockResolvedValue({
      userId: "user-owner",
      teamId: "team_1",
      sharedWithTeam: false,
      audioUrl: VALID_BLOB,
      filename: "rec.webm",
    } as any);

    const response = await GET(request(), { params: Promise.resolve({ id: "call-1" }) });

    expect(response.status).toBe(403);
  });

  it("returns 404 when the call has no audio", async () => {
    mockFindUnique.mockResolvedValue({
      userId: "user-1",
      teamId: null,
      sharedWithTeam: false,
      audioUrl: null,
      filename: "rec.webm",
    } as any);

    const response = await GET(request(), { params: Promise.resolve({ id: "call-1" }) });

    expect(response.status).toBe(404);
  });

  it("streams the blob with the Bearer token for an accessible call", async () => {
    mockFindUnique.mockResolvedValue({
      userId: "user-1",
      teamId: null,
      sharedWithTeam: false,
      audioUrl: VALID_BLOB,
      filename: "rec.webm",
    } as any);

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]));
        controller.close();
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(body, {
        status: 200,
        headers: { "content-type": "audio/webm" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      const response = await GET(request(), { params: Promise.resolve({ id: "call-1" }) });

      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledWith(VALID_BLOB, expect.objectContaining({
        headers: { Authorization: "Bearer test-token" },
      }));
      expect(response.headers.get("content-type")).toBe("audio/webm");
      expect(response.headers.get("content-disposition")).toContain("rec.webm");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("rejects a stored audioUrl that does not point to our blob store", async () => {
    mockFindUnique.mockResolvedValue({
      userId: "user-1",
      teamId: null,
      sharedWithTeam: false,
      audioUrl: "https://evil.example.com/capture.wav",
      filename: "rec.wav",
    } as any);

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    try {
      const response = await GET(request(), { params: Promise.resolve({ id: "call-1" }) });

      expect(response.status).toBe(403);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("returns 502 when the blob fetch fails", async () => {
    mockFindUnique.mockResolvedValue({
      userId: "user-1",
      teamId: null,
      sharedWithTeam: false,
      audioUrl: VALID_BLOB,
      filename: "rec.webm",
    } as any);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    try {
      const response = await GET(request(), { params: Promise.resolve({ id: "call-1" }) });

      expect(response.status).toBe(502);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
