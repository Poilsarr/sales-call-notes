import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

describe("SLO Events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trackSLO calls vercel analytics track", async () => {
    vi.stubGlobal("window", {});

    const { trackSLO } = await import("@/lib/analytics");
    const { track } = await import("@vercel/analytics");

    trackSLO("transcription_latency", 15000);

    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "transcription_latency",
        expect.objectContaining({ value: 15000 }),
      );
    });
  });

  it("trackTranscriptionLatency wraps correctly", async () => {
    vi.stubGlobal("window", {});

    const { trackTranscriptionLatency } = await import("@/lib/analytics");
    const { track } = await import("@vercel/analytics");

    trackTranscriptionLatency(12000, 5000000);

    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "transcription_latency",
        expect.objectContaining({ value: 12000, fileSize: 5000000 }),
      );
    });
  });

  it("tracks are no-ops on server side", async () => {
    vi.stubGlobal("window", undefined);

    const { trackSLO } = await import("@/lib/analytics");
    const { track } = await import("@vercel/analytics");

    trackSLO("transcription_latency", 15000);

    expect(track).not.toHaveBeenCalled();
  });
});
