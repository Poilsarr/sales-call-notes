import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  publishLiveTranscriptionEvent: vi.fn(),
  subscribeToLiveTranscriptionSession: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/live-transcription-bus", () => mocks);

import { POST } from "@/app/api/transcribe/live/route";

describe("POST /api/transcribe/live session namespacing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("namespaces published sessions with the user id", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    const res = await POST({
      json: () => Promise.resolve({ text: "hello", sessionId: "sess-1" }),
    } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessionId).toBe("clerk-1:sess-1");
    expect(mocks.publishLiveTranscriptionEvent).toHaveBeenCalledWith(
      "clerk-1:sess-1",
      expect.objectContaining({ sessionId: "clerk-1:sess-1" }),
    );
  });

  it("namespaces the default session too", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-2" });
    const res = await POST({ json: () => Promise.resolve({ text: "hi" }) } as any);
    const body = await res.json();
    expect(body.sessionId).toBe("clerk-2:default");
  });
});
