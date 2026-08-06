import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/openai-client", () => ({
  createOpenAIClient: mockCreateClient,
}));

vi.mock("@/lib/secrets", () => ({
  getSecret: (k: string) => process.env[k] || "",
}));

import { AnalysisService } from "@/services/ai/analysis";

const GROQ_BASE = "https://api.groq.com/openai/v1";
const OPENAI_KEY = "sk-proj-openai-key-1234567890abcdef";
const GROQ_KEY = "gsk_groq-key-1234567890abcdef";

function makeClient(baseURL?: string) {
  return {
    baseURL,
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({ executiveSummary: "ok" }),
              },
            },
          ],
        }),
      },
    },
  };
}

function validAnalysis(): ReturnType<typeof makeClient> {
  return makeClient();
}

describe("AnalysisService — no empty-bearer OpenAI client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
    delete process.env.GROQ_API_KEY;
    mockCreateClient.mockImplementation((args: { apiKey?: string; baseURL?: string }) =>
      makeClient(args.baseURL)
    );
  });

  it("builds no OpenAI client when only a Groq key exists", () => {
    const service = new AnalysisService({ groqKey: GROQ_KEY });

    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    const [args] = mockCreateClient.mock.calls[0];
    expect(args.baseURL).toBe(GROQ_BASE);
    expect(args.apiKey).toBe(GROQ_KEY);
    void service;
  });

  it("analyzes via Groq directly when no OpenAI key exists — zero calls to api.openai.com", async () => {
    const service = new AnalysisService({ groqKey: GROQ_KEY });
    const groqClient = mockCreateClient.mock.results[0].value;

    const analysis = await service.analyze("some transcript");

    expect(groqClient.chat.completions.create).toHaveBeenCalledTimes(1);
    const args = groqClient.chat.completions.create.mock.calls[0][0];
    expect(args.model).toBe("llama-3.3-70b-versatile");
    expect(analysis.executiveSummary).toBe("ok");
  });

  it("throws an actionable error when no keys exist anywhere", async () => {
    const service = new AnalysisService({});

    await expect(service.analyze("some transcript")).rejects.toThrow(
      /Analysis unavailable: set OPENAI_API_KEY or GROQ_API_KEY/
    );
    expect(mockCreateClient).toHaveBeenCalledTimes(0);
  });

  it("keeps the OpenAI-first, Groq-overflow path when an OpenAI key exists", async () => {
    const service = new AnalysisService({ openaiKey: OPENAI_KEY, groqKey: GROQ_KEY });
    const openaiClient = mockCreateClient.mock.results[0].value;
    const groqClient = mockCreateClient.mock.results[1].value;

    const analysis = await service.analyze("some transcript");

    expect(openaiClient.chat.completions.create).toHaveBeenCalledTimes(1);
    expect(openaiClient.chat.completions.create.mock.calls[0][0].model).toBe("gpt-4o-mini");
    expect(groqClient.chat.completions.create).not.toHaveBeenCalled();
    expect(analysis.executiveSummary).toBe("ok");
  });

  it("falls back to Groq when OpenAI fails", async () => {
    const service = new AnalysisService({ openaiKey: OPENAI_KEY, groqKey: GROQ_KEY });
    const openaiClient = mockCreateClient.mock.results[0].value;
    const groqClient = mockCreateClient.mock.results[1].value;
    openaiClient.chat.completions.create.mockRejectedValueOnce(new Error("rate limited"));

    const analysis = await service.analyze("some transcript");

    expect(groqClient.chat.completions.create).toHaveBeenCalledTimes(1);
    expect(groqClient.chat.completions.create.mock.calls[0][0].model).toBe(
      "llama-3.3-70b-versatile"
    );
    expect(analysis.executiveSummary).toBe("ok");
  });

  it("rethrows the original error when OpenAI fails and no Groq key exists", async () => {
    const service = new AnalysisService({ openaiKey: OPENAI_KEY });
    const openaiClient = mockCreateClient.mock.results[0].value;
    openaiClient.chat.completions.create.mockRejectedValueOnce(new Error("upstream error"));

    await expect(service.analyze("some transcript")).rejects.toThrow("upstream error");
  });

  it("appends [MM:SS] timeline anchors to the user message when segments are provided", async () => {
    const service = new AnalysisService({ openaiKey: OPENAI_KEY });
    const openaiClient = mockCreateClient.mock.results[0].value;

    const segments = [
      { id: 1, text: "hello, thanks for joining today", start: 0, end: 5 },
      { id: 2, text: "budget is approved for Q1, send the proposal", start: 754, end: 762 },
    ];

    await service.analyze("transcript text", segments);

    const args = openaiClient.chat.completions.create.mock.calls[0][0];
    const userMessage = args.messages.find((m: { role: string }) => m.role === "user").content;
    expect(userMessage).toContain("[timeline]");
    expect(userMessage).toContain("[0:00]");
    expect(userMessage).toContain("[12:34]");
    expect(userMessage.startsWith("transcript text")).toBe(true);
  });
});
