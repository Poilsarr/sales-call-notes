import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiarizationService } from "@/services/ai/diarization";

const mocks = vi.hoisted(() => ({
  transcribeFile: vi.fn(),
  getSecret: vi.fn(),
  readFile: vi.fn(async () => Buffer.from("fake")),
}));

vi.mock("@/lib/secrets", () => ({ getSecret: mocks.getSecret }));

vi.mock("@deepgram/sdk", () => ({
  DeepgramClient: function () {
    return { listen: { v1: { media: { transcribeFile: mocks.transcribeFile } } } };
  },
}));

vi.mock("fs/promises", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return { ...actual, default: { ...actual, readFile: mocks.readFile } };
});

const SAMPLE = {
  results: { channels: [{ alternatives: [{ transcript: "Hello there. Hi how are you?", words: [
    { word: "Hello", start: 0, end: 0.5, speaker: 0 },
    { word: "there.", start: 0.5, end: 0.9, speaker: 0 },
    { word: "Hi", start: 1.2, end: 1.5, speaker: 1 },
    { word: "how", start: 1.5, end: 1.7, speaker: 1 },
    { word: "are", start: 1.7, end: 1.9, speaker: 1 },
    { word: "you?", start: 1.9, end: 2.2, speaker: 1 },
  ] } ] } ] },
};

describe("Deepgram diarization", () => {
  beforeEach(() => {
    mocks.transcribeFile.mockReset();
    mocks.getSecret.mockReset();
    mocks.getSecret.mockReturnValue("test-key");
    mocks.transcribeFile.mockResolvedValue(SAMPLE);
  });

  it("reads DEEPGRAM_API_KEY via getSecret", async () => {
    await new DiarizationService().diarize("/tmp/x.wav");
    expect(mocks.getSecret).toHaveBeenCalledWith("DEEPGRAM_API_KEY");
  });

  it("calls Deepgram with nova-2 + diarize", async () => {
    await new DiarizationService().diarize("/tmp/x.wav");
    expect(mocks.transcribeFile).toHaveBeenCalledTimes(1);
    const opts = mocks.transcribeFile.mock.calls[0][1];
    expect(opts.model).toBe("nova-2");
    expect(opts.diarize).toBe(true);
  });

  it("maps speaker_id 0/1 to Speaker A/B", async () => {
    const r = await new DiarizationService().diarize("/tmp/x.wav");
    const labels = r.speakers.map((s) => s.label).sort();
    expect(labels).toEqual(["Speaker A", "Speaker B"]);
  });

  it("returns non-empty transcript", async () => {
    const r = await new DiarizationService().diarize("/tmp/x.wav");
    expect(r.transcript).toContain("Hello");
  });

  it("throws on missing key", async () => {
    mocks.getSecret.mockReturnValue("");
    await expect(new DiarizationService().diarize("/tmp/x.wav")).rejects.toThrow(/DEEPGRAM_API_KEY/);
  });
});
