import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateClient, mockBuildPrompt } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockBuildPrompt: vi.fn().mockReturnValue("prompt"),
}));

vi.mock("@/lib/openai-client", () => ({
  createOpenAIClient: mockCreateClient,
}));

vi.mock("@/lib/transcription-options", () => ({
  buildTranscriptionPrompt: mockBuildPrompt,
}));

vi.mock("@/lib/secrets", () => ({
  getSecret: (k: string) => process.env[k] || "",
}));

import { TranscriptionServiceV2 } from "@/services/ai/transcription-v2";

const GROQ_BASE = "https://api.groq.com/openai/v1";
const OPENAI_KEY = "sk-proj-openai-key-1234567890abcdef";
const GROQ_KEY = "gsk_groq-key-1234567890abcdef";

function makeClient(baseURL?: string, apiKey?: string) {
  return {
    baseURL,
    apiKey,
    audio: {
      transcriptions: {
        create: vi.fn().mockResolvedValue({
          text: "transcribed text",
          language: "en",
          duration: 5.2,
          segments: [{ id: 0, text: "transcribed text", start: 0, end: 5.2, words: [] }],
        }),
      },
    },
  };
}

describe("TranscriptionServiceV2 — BYOK key isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
    delete process.env.GROQ_API_KEY;
    mockCreateClient.mockImplementation((args: { apiKey?: string; baseURL?: string }) =>
      makeClient(args.baseURL, args.apiKey)
    );
  });

  it("builds only an OpenAI client when only an OpenAI key exists", () => {
    const service = new TranscriptionServiceV2({ openaiKey: OPENAI_KEY });

    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockCreateClient).toHaveBeenCalledWith({ apiKey: OPENAI_KEY });
    const client = mockCreateClient.mock.results[0].value;
    expect(client.apiKey).toBe(OPENAI_KEY);
    expect(client.baseURL).not.toBe(GROQ_BASE);
  });

  it("never sends the OpenAI key to api.groq.com when a Groq key also exists", () => {
    const service = new TranscriptionServiceV2({ openaiKey: OPENAI_KEY, groqKey: GROQ_KEY });

    const calls = mockCreateClient.mock.calls;
    expect(calls).toHaveLength(2);
    const groqCall = calls.find((c) => c[0]?.baseURL === GROQ_BASE);
    expect(groqCall).toBeDefined();
    expect(groqCall![0].apiKey).toBe(GROQ_KEY);
    expect(groqCall![0].apiKey).not.toBe(OPENAI_KEY);
    const openaiCall = calls.find((c) => !c[0]?.baseURL);
    expect(openaiCall![0].apiKey).toBe(OPENAI_KEY);
    void service;
  });

  it("builds only the Groq client when only a Groq key exists (no empty-bearer OpenAI client)", () => {
    const service = new TranscriptionServiceV2({ groqKey: GROQ_KEY });

    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    const [args] = mockCreateClient.mock.calls[0];
    expect(args.baseURL).toBe(GROQ_BASE);
    expect(args.apiKey).toBe(GROQ_KEY);
    void service;
  });

  it("throws an actionable error for explicit whisper-1 when no OpenAI key exists", async () => {
    const service = new TranscriptionServiceV2({ groqKey: GROQ_KEY });

    await expect(service.transcribe(Buffer.from("x"), "whisper-1")).rejects.toThrow(
      /whisper-1 transcription requires an OpenAI API key/
    );

    const groqClient = mockCreateClient.mock.results[0].value;
    expect(groqClient.audio.transcriptions.create).not.toHaveBeenCalled();
  });

  it("throws an actionable error on transcribe when no keys exist anywhere", async () => {
    const service = new TranscriptionServiceV2({});

    await expect(service.transcribe(Buffer.from("x"), "whisper-1")).rejects.toThrow(
      /Transcription unavailable/
    );
  });

  it("falls back to whisper-1 when whisper-large-v3 is requested without a Groq key", async () => {
    const service = new TranscriptionServiceV2({ openaiKey: OPENAI_KEY });
    const openaiClient = mockCreateClient.mock.results[0].value;

    await service.transcribe(Buffer.from("x"), "whisper-large-v3");

    expect(openaiClient.audio.transcriptions.create).toHaveBeenCalledTimes(1);
    const args = openaiClient.audio.transcriptions.create.mock.calls[0][0];
    expect(args.model).toBe("whisper-1");
  });

  it("escalates to whisper-large-v3 on the Groq client when whisper-1 fails and a Groq key exists", async () => {
    const service = new TranscriptionServiceV2({ openaiKey: OPENAI_KEY, groqKey: GROQ_KEY });
    const openaiClient = mockCreateClient.mock.results.find((r) => !r.value.baseURL)!.value;
    const groqClient = mockCreateClient.mock.results.find((r) => r.value.baseURL === GROQ_BASE)!.value;
    openaiClient.audio.transcriptions.create.mockRejectedValueOnce(new Error("upstream error"));

    await service.transcribe(Buffer.from("x"), "whisper-1");

    expect(openaiClient.audio.transcriptions.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: "whisper-1" })
    );
    expect(groqClient.audio.transcriptions.create).toHaveBeenCalledTimes(1);
    expect(groqClient.audio.transcriptions.create.mock.calls[0][0].model).toBe("whisper-large-v3");
  });

  it("does not burn a doomed whisper-large-v3 retry when whisper-1 fails and no Groq key exists", async () => {
    const service = new TranscriptionServiceV2({ openaiKey: OPENAI_KEY });
    const openaiClient = mockCreateClient.mock.results[0].value;
    openaiClient.audio.transcriptions.create.mockRejectedValue(new Error("upstream error"));

    await expect(service.transcribe(Buffer.from("x"), "whisper-1")).rejects.toThrow(
      "upstream error"
    );

    expect(openaiClient.audio.transcriptions.create).toHaveBeenCalledTimes(1);
    expect(openaiClient.audio.transcriptions.create.mock.calls[0][0].model).toBe("whisper-1");
  });

  it("escalates to whisper-1 on the OpenAI client when a Groq outage fails large-v3", async () => {
    const service = new TranscriptionServiceV2({ openaiKey: OPENAI_KEY, groqKey: GROQ_KEY });
    const openaiClient = mockCreateClient.mock.results.find((r) => !r.value.baseURL)!.value;
    const groqClient = mockCreateClient.mock.results.find((r) => r.value.baseURL === GROQ_BASE)!.value;
    groqClient.audio.transcriptions.create.mockRejectedValueOnce(new Error("groq upstream error"));

    await service.transcribe(Buffer.from("x"), "whisper-large-v3");

    expect(groqClient.audio.transcriptions.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: "whisper-large-v3" })
    );
    expect(openaiClient.audio.transcriptions.create).toHaveBeenCalledTimes(1);
    expect(openaiClient.audio.transcriptions.create.mock.calls[0][0].model).toBe("whisper-1");
  });

  it("does not burn a doomed whisper-1 retry when Groq fails and no OpenAI key exists", async () => {
    const service = new TranscriptionServiceV2({ groqKey: GROQ_KEY });
    const groqClient = mockCreateClient.mock.results[0].value;
    groqClient.audio.transcriptions.create.mockRejectedValue(new Error("groq upstream error"));

    await expect(service.transcribe(Buffer.from("x"), "whisper-large-v3")).rejects.toThrow(
      /whisper-1 transcription requires an OpenAI API key/
    );

    expect(groqClient.audio.transcriptions.create).toHaveBeenCalledTimes(1);
    expect(groqClient.audio.transcriptions.create.mock.calls[0][0].model).toBe("whisper-large-v3");
  });

  it("lets BYOK keys override env-provided shared keys", async () => {
    process.env.OPENAI_API_KEY = "sk-env-key-1234567890abcdef";
    process.env.GROQ_API_KEY = "gsk_env_key_1234567890abcdef";

    const service = new TranscriptionServiceV2({ openaiKey: OPENAI_KEY });

    const calls = mockCreateClient.mock.calls;
    const openaiArgs = calls.find((c) => !c[0]?.baseURL)![0];
    expect(openaiArgs.apiKey).toBe(OPENAI_KEY);
    void service;
  });
});
