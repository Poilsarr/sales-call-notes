import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockGetUserByClerkId,
  mockGetByokKeys,
  mockCaptureApiError,
  mockPrismaCallCreate,
  mockTranscribe,
  mockTranscriptionCtorArgs,
  mockPostProcess,
  mockAnalyze,
  mockIndexCall,
  mockRedact,
  mockAnalyzeCall,
  mockValidate,
  mockPreprocess,
  mockSelectModel,
  mockEnforceRetention,
  mockTrack,
  mockDiarize,
  mockPrismaCallInsightUpsert,
  mockPrismaKnowledgeEntityUpsert,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetUserByClerkId: vi.fn(),
  mockGetByokKeys: vi.fn(),
  mockCaptureApiError: vi.fn(),
  mockPrismaCallCreate: vi.fn(),
  mockTranscribe: vi.fn(),
  mockTranscriptionCtorArgs: [] as unknown[],
  mockPostProcess: vi.fn(),
  mockAnalyze: vi.fn(),
  mockIndexCall: vi.fn(),
  mockRedact: vi.fn(),
  mockAnalyzeCall: vi.fn(),
  mockValidate: vi.fn(),
  mockPreprocess: vi.fn(),
  mockSelectModel: vi.fn(),
  mockEnforceRetention: vi.fn(),
  mockTrack: vi.fn(),
  mockDiarize: vi.fn(),
  mockPrismaCallInsightUpsert: vi.fn(),
  mockPrismaKnowledgeEntityUpsert: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/get-user", () => ({
  getUserByClerkId: mockGetUserByClerkId,
}));

vi.mock("@/lib/byok-resolver", () => ({
  getByokKeys: mockGetByokKeys,
}));

vi.mock("@/lib/sentry", () => ({
  captureApiError: mockCaptureApiError,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    call: { create: mockPrismaCallCreate },
    callInsight: { upsert: mockPrismaCallInsightUpsert },
    knowledgeEntity: { upsert: mockPrismaKnowledgeEntityUpsert, findUnique: vi.fn() },
    knowledgeRelation: { create: vi.fn() },
    integration: { findMany: vi.fn().mockResolvedValue([]) },
    user: { update: vi.fn() },
  },
}));

vi.mock("@/services/ai/transcription-v2", () => {
  class MockTranscriptionServiceV2 {
    constructor(opts: unknown) {
      mockTranscriptionCtorArgs.push(opts);
    }
    transcribe = mockTranscribe;
  }
  return { TranscriptionServiceV2: MockTranscriptionServiceV2 };
});

vi.mock("@/services/ai/post-processing", () => {
  class MockPostProcessing {
    constructor(public apiKey?: string) {}
    correctEntities = mockPostProcess;
  }
  return { PostProcessingService: MockPostProcessing };
});

vi.mock("@/services/ai/analysis", () => {
  class MockAnalysis {
    constructor(public opts: unknown) {}
    analyze = mockAnalyze;
  }
  return { AnalysisService: MockAnalysis };
});

vi.mock("@/services/ai/knowledge-graph", () => {
  class MockKG {
    indexCall = mockIndexCall;
  }
  return { KnowledgeGraphService: MockKG };
});

vi.mock("@/services/ai/pii-redactor", () => {
  class MockPII {
    redact = mockRedact;
  }
  return { PIIRedactorService: MockPII };
});

vi.mock("@/services/ai/analytics", () => {
  class MockAnalytics {
    analyzeCall = mockAnalyzeCall;
  }
  return { AnalyticsService: MockAnalytics };
});

vi.mock("@/services/ai/personalization", () => {
  class MockPersonalization {
    generatePersonalizedHooks = vi.fn().mockResolvedValue({ hooks: [] });
  }
  return { PersonalizationService: MockPersonalization };
});

vi.mock("@/services/ai/audio-preprocessing", () => {
  class MockPreprocess {
    preprocess = mockPreprocess;
    selectModel = mockSelectModel;
  }
  return { AudioPreprocessingService: MockPreprocess };
});

vi.mock("@/services/ai/diarization", () => {
  class MockDiarize {
    diarize = mockDiarize;
  }
  return { DiarizationService: MockDiarize };
});

vi.mock("@/services/validation/file-validation", () => {
  class MockValidation {
    validate = mockValidate;
  }
  return { FileValidationService: MockValidation };
});

vi.mock("@/services/call-retention", () => ({
  enforceCallRetention: mockEnforceRetention,
}));

vi.mock("@/services/slack", () => ({ SlackService: class {} }));
vi.mock("@/services/webhooks", () => ({ WebhookService: class {} }));
vi.mock("@/services/email", () => ({ sendTranscriptReadyEmail: vi.fn() }));
vi.mock("@/services/crm/hubspot", () => ({ HubSpotService: class {} }));
vi.mock("@/services/crm/salesforce", () => ({ SalesforceService: class {} }));
vi.mock("@/lib/audit-logger", () => ({ logAuditAction: vi.fn() }));
vi.mock("@/lib/integrations/token-refresh", () => ({
  refreshIntegrationToken: vi.fn(),
}));
vi.mock("@/lib/analytics", () => ({ trackEvent: mockTrack }));
vi.mock("@/lib/audio-types", () => ({
  detectAudioType: vi.fn().mockReturnValue({ mimeType: "audio/wav", extension: "wav" }),
}));
vi.mock("@/lib/transcription-options", () => ({
  parseRemoveFillers: vi.fn().mockReturnValue(true),
  buildTranscriptionPrompt: vi.fn().mockReturnValue("prompt"),
}));
vi.mock("@/lib/quota-guard", () => ({
  isQuotaError: (e: unknown) =>
    Boolean(
      e && typeof e === "object" &&
        ((e as { status?: number }).status === 429 ||
          (e as { code?: string }).code === "insufficient_quota")
    ),
  quotaErrorResponse: () =>
    new Response(JSON.stringify({ error: "service_overloaded" }), { status: 503 }),
  captureQuotaEvent: vi.fn(),
}));
vi.mock("@vercel/blob", () => ({ put: vi.fn(), del: vi.fn() }));

import { POST } from "@/app/api/analyze/route";

const URL = "https://usegauge.com/api/analyze";

function jsonRequest(overrides: Record<string, unknown> = {}): Request {
  return new Request(URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      blobUrl: "https://test.private.blob.vercel-storage.com/call.wav",
      filename: "call.wav",
      removeFillers: true,
      ...overrides,
    }),
  });
}

const TRANSCRIPTION = {
  text: "hello world",
  segments: [{ id: 0, text: "hello world", start: 0, end: 2.5, words: [] }],
  language: "en",
  confidence: 0.95,
  model: "whisper-1",
};

const TWO_GAP_TRANSCRIPTION = {
  ...TRANSCRIPTION,
  segments: [
    { id: 0, text: "first", start: 0, end: 1.0, words: [] },
    { id: 1, text: "second", start: 3.0, end: 4.0, words: [] },
  ],
};

const ANALYSIS = {
  executiveSummary: "Summary",
  callType: "discovery",
  participants: [],
  keyEntities: {},
  salesScorecard: { overallScore: 80 },
  stakeholderMap: [],
  painPoints: [],
  goals: [],
  objections: [],
  commitments: [],
  actionItems: [],
  nextSteps: [],
  coachingNotes: { strengths: [], improvements: [], tips: [] },
  riskFlags: [],
  closeProbability: 40,
  talkRatio: { rep: 0.5, prospect: 0.5 },
  sentimentTimeline: [],
};

describe("POST /api/analyze — BYOK branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTranscriptionCtorArgs.length = 0;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.DIARIZATION_PROVIDER;
    delete process.env.DEEPGRAM_API_KEY;
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    process.env.BLOB_STORE_ID = "store_test";
    mockAuth.mockResolvedValue({ userId: "clerk-1" });
    mockGetUserByClerkId.mockResolvedValue({ id: "user-1", plan: "PRO" });
    mockGetByokKeys.mockResolvedValue({});
    mockValidate.mockResolvedValue({ isValid: true, error: null });
    mockPreprocess.mockResolvedValue({ buffer: new ArrayBuffer(4), duration: 60 });
    mockSelectModel.mockImplementation((groqAvailable: boolean) =>
      groqAvailable ? "whisper-large-v3" : "whisper-1"
    );
    mockTranscribe.mockResolvedValue(TRANSCRIPTION);
    mockPostProcess.mockResolvedValue({ correctedText: "hello world", corrections: [] });
    mockAnalyze.mockResolvedValue(ANALYSIS);
    mockRedact.mockResolvedValue({ redactedText: "hello world" });
    mockAnalyzeCall.mockResolvedValue({ speakerMetrics: {}, interruptions: [], questionsAsked: [] });
    mockIndexCall.mockResolvedValue(undefined);
    mockEnforceRetention.mockResolvedValue(0);
    mockPrismaCallCreate.mockResolvedValue({ id: "call-1" });
    mockPrismaCallInsightUpsert.mockResolvedValue({});
    mockPrismaKnowledgeEntityUpsert.mockResolvedValue({ id: "ent-1" });
    mockDiarize.mockRejectedValue(new Error("deepgram unavailable"));
    global.fetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array(4096).buffer, { status: 200 })
    );
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST(jsonRequest());

    expect(response.status).toBe(401);
  });

  it("rejects a blobUrl that does not point to our blob store (token-exfiltration guard)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array(4096).buffer, { status: 200 })
    );
    global.fetch = fetchMock;

    const response = await POST(jsonRequest({ blobUrl: "https://evil.example.com/capture?token=hijack" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid blobUrl: must point to this store" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid files before touching BYOK resolution", async () => {
    mockValidate.mockResolvedValue({ isValid: false, error: "Invalid file type" });

    const response = await POST(jsonRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid file type" });
    expect(mockGetByokKeys).not.toHaveBeenCalled();
  });

  it("fails closed with an actionable message when no keys exist anywhere", async () => {
    mockGetByokKeys.mockResolvedValue({});

    const response = await POST(jsonRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain("Transcription requires an AI API key");
    expect(mockTranscribe).not.toHaveBeenCalled();
  });

  it("constructs the transcription service with shared-only keys when BYOK is empty", async () => {
    process.env.OPENAI_API_KEY = "sk-shared";

    const response = await POST(jsonRequest());

    expect(response.status).toBe(200);
    expect(mockTranscriptionCtorArgs).toEqual([{}]);
  });

  it("plumbs a user's OpenAI key into transcription, post-processing, and the knowledge graph", async () => {
    mockGetByokKeys.mockResolvedValue({ openaiKey: "sk-user-1234567890" });

    const response = await POST(jsonRequest());

    expect(response.status).toBe(200);
    expect(mockTranscriptionCtorArgs).toEqual([{ openaiKey: "sk-user-1234567890" }]);
    expect(mockPostProcess).toHaveBeenCalledTimes(1);
    expect(mockIndexCall).toHaveBeenCalledWith("call-1", "sk-user-1234567890");
  });

  it("routes to whisper-large-v3 for Groq BYOK users in the preprocess-success branch", async () => {
    mockGetByokKeys.mockResolvedValue({ groqKey: "gsk_user_1234567890" });
    mockPreprocess.mockResolvedValue({ buffer: new ArrayBuffer(4), duration: 60 });

    await POST(jsonRequest());

    expect(mockSelectModel).toHaveBeenCalledWith(true);
    expect(mockTranscribe).toHaveBeenCalledWith(
      expect.anything(),
      "whisper-large-v3",
      undefined,
      expect.anything()
    );
  });

  it("routes to whisper-large-v3 for Groq BYOK users in the preprocess-fallback branch", async () => {
    mockGetByokKeys.mockResolvedValue({ groqKey: "gsk_user_1234567890" });
    mockPreprocess.mockRejectedValue(new Error("ffmpeg unavailable"));

    await POST(jsonRequest());

    // Preprocess failed, so selectModel never runs — the provider heuristic
    // (Groq available → large-v3) is baked into the initial model choice.
    expect(mockSelectModel).not.toHaveBeenCalled();
    expect(mockTranscribe).toHaveBeenCalledWith(
      expect.anything(),
      "whisper-large-v3",
      undefined,
      expect.anything()
    );
  });

  it("routes to whisper-large-v3 when only the shared GROQ_API_KEY env is set", async () => {
    process.env.GROQ_API_KEY = "gsk_shared_1234567890";
    process.env.OPENAI_API_KEY = "sk-shared";

    await POST(jsonRequest());

    expect(mockSelectModel).toHaveBeenCalledWith(true);
    expect(mockTranscribe).toHaveBeenCalledWith(
      expect.anything(),
      "whisper-large-v3",
      undefined,
      expect.anything()
    );
  });

  it("uses whisper-1 when no Groq key is available anywhere", async () => {
    process.env.OPENAI_API_KEY = "sk-shared";
    mockPreprocess.mockResolvedValue({ buffer: new ArrayBuffer(4), duration: 60 });

    await POST(jsonRequest());

    expect(mockSelectModel).toHaveBeenCalledWith(false);
    expect(mockTranscribe).toHaveBeenCalledWith(
      expect.anything(),
      "whisper-1",
      undefined,
      expect.anything()
    );
  });

  it("uses whisper-1 in the preprocess-fallback branch when no Groq key exists, regardless of file size", async () => {
    process.env.OPENAI_API_KEY = "sk-shared";
    mockPreprocess.mockRejectedValue(new Error("ffmpeg unavailable"));

    await POST(jsonRequest());

    expect(mockSelectModel).not.toHaveBeenCalled();
    expect(mockTranscribe).toHaveBeenCalledWith(
      expect.anything(),
      "whisper-1",
      undefined,
      expect.anything()
    );
  });

  it("returns a 500 pointing at Settings → API Keys when the saved key 401s", async () => {
    mockGetByokKeys.mockResolvedValue({ openaiKey: "sk-dead" });
    mockTranscribe.mockRejectedValue(new Error("401 Incorrect API key"));

    const response = await POST(jsonRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain("Settings → API Keys");
  });

  it("returns the quota response when transcription is rate-limited", async () => {
    mockGetByokKeys.mockResolvedValue({ openaiKey: "sk-quota" });
    mockTranscribe.mockRejectedValue({ status: 429 });

    const response = await POST(jsonRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ error: "service_overloaded" });
  });

  it("includes a byokWarning when a stored key failed to decrypt", async () => {
    mockGetByokKeys.mockResolvedValue({ groqKey: "gsk_ok_1234567890", dropped: ["openai"] });

    const response = await POST(jsonRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.byokWarning).toContain("could not be decrypted");
    expect(body.byokWarning).not.toMatch(/sk-|gsk_/);
  });

  it("omits byokWarning on the clean happy path", async () => {
    mockGetByokKeys.mockResolvedValue({ openaiKey: "sk-user-1234567890" });

    const body = await (await POST(jsonRequest())).json();

    expect(body.analysisAvailable).toBe(true);
    expect(body.byokWarning).toBeUndefined();
    expect(body.id).toBe("call-1");
  });

  it("normalizes action items with timestamp: null when the LLM omits it", async () => {
    mockGetByokKeys.mockResolvedValue({ openaiKey: "sk-user-1234567890" });
    mockAnalyze.mockResolvedValue({
      ...ANALYSIS,
      actionItems: [{ task: "Send proposal", owner: "Jane", priority: "high", due: "Friday" }],
    });

    await POST(jsonRequest());

    const createArgs = mockPrismaCallCreate.mock.calls[0][0];
    expect(createArgs.data.actionItems.create).toEqual([
      { task: "Send proposal", owner: "Jane", due: "Friday", timestamp: null },
    ]);
  });

  it("normalizes action items with the LLM-provided timestamp", async () => {
    mockGetByokKeys.mockResolvedValue({ openaiKey: "sk-user-1234567890" });
    mockAnalyze.mockResolvedValue({
      ...ANALYSIS,
      actionItems: [
        { task: "Send proposal", owner: "Jane", priority: "high", due: "Friday", timestamp: 754 },
      ],
    });

    await POST(jsonRequest());

    const createArgs = mockPrismaCallCreate.mock.calls[0][0];
    expect(createArgs.data.actionItems.create).toEqual([
      { task: "Send proposal", owner: "Jane", due: "Friday", timestamp: 754 },
    ]);
  });

  it("skips Deepgram and runs pause-gap fallback when DIARIZATION_PROVIDER is unset", async () => {
    process.env.OPENAI_API_KEY = "sk-shared";
    mockTranscribe.mockResolvedValue(TWO_GAP_TRANSCRIPTION);

    const response = await POST(jsonRequest());

    expect(response.status).toBe(200);
    expect(mockDiarize).not.toHaveBeenCalled();
    const createArgs = mockPrismaCallCreate.mock.calls[0][0];
    expect(createArgs.data.speakers.create).toHaveLength(2);
    expect(createArgs.data.speakers.create.map((s: { label: string }) => s.label)).toEqual([
      "SPEAKER_00",
      "SPEAKER_01",
    ]);
  });

  it("skips Deepgram when DIARIZATION_PROVIDER=deepgram but DEEPGRAM_API_KEY is missing", async () => {
    process.env.OPENAI_API_KEY = "sk-shared";
    process.env.DIARIZATION_PROVIDER = "deepgram";
    mockTranscribe.mockResolvedValue(TWO_GAP_TRANSCRIPTION);

    const response = await POST(jsonRequest());

    expect(response.status).toBe(200);
    expect(mockDiarize).not.toHaveBeenCalled();
    const createArgs = mockPrismaCallCreate.mock.calls[0][0];
    expect(createArgs.data.speakers.create).toHaveLength(2);
  });

  it("calls Deepgram diarization when provider=deepgram and DEEPGRAM_API_KEY is set", async () => {
    process.env.OPENAI_API_KEY = "sk-shared";
    process.env.DIARIZATION_PROVIDER = "deepgram";
    process.env.DEEPGRAM_API_KEY = "test-key";
    mockDiarize.mockResolvedValue({
      speakers: [
        { label: "Speaker A", segments: [{ speaker: "Speaker A", start: 0, end: 2.5 }], duration: 2.5 },
      ],
      transcript: "hello world",
    });

    const response = await POST(jsonRequest());

    expect(response.status).toBe(200);
    expect(mockDiarize).toHaveBeenCalledTimes(1);
    const createArgs = mockPrismaCallCreate.mock.calls[0][0];
    expect(createArgs.data.speakers.create).toEqual([
      expect.objectContaining({ label: "Speaker A", duration: 3 }),
    ]);
  });

  it("populates CallInsight with sentimentScore, talkRatio, objections, topics", async () => {
    process.env.OPENAI_API_KEY = "sk-shared";
    mockAnalyze.mockResolvedValue({
      ...ANALYSIS,
      salesScorecard: { overallScore: 85 },
      topics: ["pricing", "timeline"],
    });
    mockAnalyzeCall.mockResolvedValue({
      sentiment: "positive",
      talkRatio: { "Speaker A": 0.6, "Speaker B": 0.4 },
      objections: ["price_too_high"],
    });

    const response = await POST(jsonRequest());

    expect(response.status).toBe(200);
    expect(mockPrismaCallInsightUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { callId: "call-1" },
        create: expect.objectContaining({
          callId: "call-1",
          sentimentScore: 0.85,
          talkRatio: { "Speaker A": 0.6, "Speaker B": 0.4 },
          objections: [{ type: "price_too_high" }],
          topics: ["pricing", "timeline"],
        }),
      })
    );
  });

  it("populates knowledge entities when transcript is present", async () => {
    process.env.OPENAI_API_KEY = "sk-shared";
    mockPostProcess.mockResolvedValue({
      correctedText: "Sarah Chen, CEO of Beta Inc, bought $50k of ProTool.",
      corrections: [],
    });
    mockRedact.mockImplementation(async (text: string) => ({ redactedText: text }));

    const response = await POST(jsonRequest());

    expect(response.status).toBe(200);
    expect(mockPrismaKnowledgeEntityUpsert).toHaveBeenCalled();
  });
});
