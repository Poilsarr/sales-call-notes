import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

// Security arc W-A (SECURITY-HARDENING-PLAN): private blobs + validate-
// before-store + free-plan cleanup nulls audioUrl + list payload strips
// audioUrl. Multipart upload tests drive POST /api/analyze end-to-end with
// mocked AI services (same scaffold style as analyze-byok-route.test.ts).

const {
  mockAuth,
  mockGetUserByClerkId,
  mockGetByokKeys,
  mockCaptureApiError,
  mockPrismaCallCreate,
  mockPrismaCallUpdate,
  mockPrismaCallFindMany,
  mockPrismaCallCount,
  mockPrismaCallInsightUpsert,
  mockPrismaKnowledgeEntityUpsert,
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
  mockWebhookTrigger,
  mockDiarize,
  mockBlobPut,
  mockBlobDel,
  mockCacheGet,
  mockCacheSet,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetUserByClerkId: vi.fn(),
  mockGetByokKeys: vi.fn(),
  mockCaptureApiError: vi.fn(),
  mockPrismaCallCreate: vi.fn(),
  mockPrismaCallUpdate: vi.fn(),
  mockPrismaCallFindMany: vi.fn(),
  mockPrismaCallCount: vi.fn(),
  mockPrismaCallInsightUpsert: vi.fn(),
  mockPrismaKnowledgeEntityUpsert: vi.fn(),
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
  mockWebhookTrigger: vi.fn(),
  mockDiarize: vi.fn(),
  mockBlobPut: vi.fn(),
  mockBlobDel: vi.fn(),
  mockCacheGet: vi.fn(),
  mockCacheSet: vi.fn(),
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
    call: {
      create: mockPrismaCallCreate,
      update: mockPrismaCallUpdate,
      findMany: mockPrismaCallFindMany,
      count: mockPrismaCallCount,
    },
    callInsight: { upsert: mockPrismaCallInsightUpsert },
    knowledgeEntity: { upsert: mockPrismaKnowledgeEntityUpsert, findUnique: vi.fn() },
    knowledgeRelation: { create: vi.fn() },
    integration: { findMany: vi.fn().mockResolvedValue([]) },
    user: { update: vi.fn() },
  },
}));

vi.mock("@/lib/cache", () => ({
  cacheGet: mockCacheGet,
  cacheSet: mockCacheSet,
  makeCacheKey: (...parts: string[]) => parts.join(":"),
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
vi.mock("@/services/webhooks", () => ({
  WebhookService: class {
    trigger = mockWebhookTrigger;
  },
}));
vi.mock("@/services/email", () => ({ sendTranscriptReadyEmail: vi.fn() }));
vi.mock("@/services/crm/hubspot", () => ({ HubSpotService: class {} }));
vi.mock("@/services/crm/salesforce", () => ({ SalesforceService: class {} }));
vi.mock("@/lib/audit-logger", () => ({ logAuditAction: vi.fn() }));
vi.mock("@/lib/integrations/token-refresh", () => ({
  refreshIntegrationToken: vi.fn(),
}));
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
vi.mock("@vercel/blob", () => ({ put: mockBlobPut, del: mockBlobDel }));

import { POST as AnalyzePOST } from "@/app/api/analyze/route";
import { GET as CallsGET } from "@/app/api/calls/route";

const BLOB_URL = "https://acme123.private.blob.vercel-storage.com/audio.wav";

const TRANSCRIPTION = {
  text: "hello world",
  segments: [{ id: 0, text: "hello world", start: 0, end: 2.5, words: [] }],
  language: "en",
  confidence: 0.95,
  model: "whisper-1",
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

function multipartRequest(bytes: Uint8Array, name = "call.wav"): Request {
  // jsdom's FormData/File classes don't survive undici's multipart brand
  // checks (webidl.is.File), so build a request stub like the other route
  // tests — the route only touches headers.get + formData in this branch.
  const fakeFile = {
    name,
    arrayBuffer: async () => bytes.buffer,
  };
  return {
    headers: { get: () => "multipart/form-data; boundary=----test" },
    formData: async () => ({
      get: (key: string) => (key === "file" ? fakeFile : null),
    }),
  } as unknown as Request;
}

describe("POST /api/analyze — legacy multipart upload privacy (W-A)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTranscriptionCtorArgs.length = 0;
    process.env.OPENAI_API_KEY = "sk-shared";
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    process.env.BLOB_STORE_ID = "store_acme123";
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
    mockBlobPut.mockResolvedValue({ url: BLOB_URL });
    mockBlobDel.mockResolvedValue(undefined);
    mockCacheGet.mockResolvedValue(null);
    mockCacheSet.mockResolvedValue(undefined);
  });

  it("stores the multipart audio blob with access 'private' (kept addRandomSuffix)", async () => {
    const response = await AnalyzePOST(multipartRequest(new Uint8Array(64 * 1024)));

    expect(response.status).toBe(200);
    expect(mockBlobPut).toHaveBeenCalledWith("call.wav", expect.any(Buffer), {
      access: "private",
      addRandomSuffix: true,
    });
    // The persisted call row keeps the (private) URL for the auth-gated proxy.
    const createArgs = mockPrismaCallCreate.mock.calls[0][0];
    expect(createArgs.data.audioUrl).toBe(BLOB_URL);
    // Pro plan: no free-plan cleanup — blob must NOT be deleted.
    expect(mockBlobDel).not.toHaveBeenCalled();
  });

  it("rejects a file over the free-plan cap (30MB) with 413 BEFORE writing any blob", async () => {
    mockGetUserByClerkId.mockResolvedValue({ id: "user-1", plan: "free" });
    const oversized = new Uint8Array(30 * 1024 * 1024 + 1);
    const response = await AnalyzePOST(multipartRequest(oversized, "big.wav"));

    expect(response.status).toBe(413);
    const body = await response.json();
    expect(body.error).toContain("30MB");
    expect(mockBlobPut).not.toHaveBeenCalled();
    expect(mockBlobDel).not.toHaveBeenCalled();
    expect(mockPrismaCallCreate).not.toHaveBeenCalled();
  });

  it("accepts a file exactly at the free-plan cap", async () => {
    mockGetUserByClerkId.mockResolvedValue({ id: "user-1", plan: "free" });

    const response = await AnalyzePOST(multipartRequest(new Uint8Array(30 * 1024 * 1024)));

    expect(response.status).toBe(200);
    expect(mockBlobPut).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid files with 400 BEFORE writing any blob", async () => {
    mockValidate.mockResolvedValue({ isValid: false, error: "Invalid audio file format. Please upload a valid audio file." });

    const response = await AnalyzePOST(multipartRequest(new Uint8Array(1024)));

    expect(response.status).toBe(400);
    expect(mockBlobPut).not.toHaveBeenCalled();
    expect(mockBlobDel).not.toHaveBeenCalled();
  });

  it("deletes the orphaned blob when transcription fails (no call row is persisted)", async () => {
    mockTranscribe.mockRejectedValue(new Error("boom"));

    const response = await AnalyzePOST(multipartRequest(new Uint8Array(64 * 1024)));

    expect(response.status).toBe(500);
    expect(mockBlobPut).toHaveBeenCalledTimes(1);
    expect(mockBlobDel).toHaveBeenCalledWith(BLOB_URL);
    expect(mockPrismaCallCreate).not.toHaveBeenCalled();
    expect(mockPrismaCallUpdate).not.toHaveBeenCalled();
  });

  it("deletes the orphaned blob when no AI provider key is configured", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.GROQ_API_KEY;
    mockGetByokKeys.mockResolvedValue({});

    const response = await AnalyzePOST(multipartRequest(new Uint8Array(64 * 1024)));

    expect(response.status).toBe(500);
    expect(mockBlobDel).toHaveBeenCalledWith(BLOB_URL);
    expect(mockPrismaCallCreate).not.toHaveBeenCalled();
  });

  it("free-plan cleanup deletes the blob AND nulls the persisted audioUrl", async () => {
    mockGetUserByClerkId.mockResolvedValue({ id: "user-1", plan: "free" });

    const response = await AnalyzePOST(multipartRequest(new Uint8Array(64 * 1024)));

    expect(response.status).toBe(200);
    expect(mockBlobDel).toHaveBeenCalledWith(BLOB_URL);
    expect(mockPrismaCallUpdate).toHaveBeenCalledWith({
      where: { id: "call-1" },
      data: { audioUrl: null },
    });
  });

  it("free-plan cleanup does NOT null audioUrl when the blob delete fails", async () => {
    mockGetUserByClerkId.mockResolvedValue({ id: "user-1", plan: "free" });
    mockBlobDel.mockRejectedValue(new Error("blob down"));

    const response = await AnalyzePOST(multipartRequest(new Uint8Array(64 * 1024)));

    expect(response.status).toBe(200);
    expect(mockPrismaCallUpdate).not.toHaveBeenCalled();
  });
});

describe("GET /api/calls — list payload strips audioUrl (W-A)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "clerk-1" });
    mockGetUserByClerkId.mockResolvedValue({ id: "user-1" });
    mockCacheGet.mockResolvedValue(null);
    mockCacheSet.mockResolvedValue(undefined);
    mockPrismaCallCount.mockResolvedValue(1);
    mockPrismaCallFindMany.mockImplementation((args: { select?: Record<string, boolean> }) => {
      // Emulate Prisma's projection: when a select is passed, only the
      // selected fields come back — so audioUrl must not appear in the
      // payload the route returns.
      const row: Record<string, unknown> = {
        id: "c1",
        userId: "user-1",
        filename: "recording-1.mp3",
        title: null,
        audioUrl: BLOB_URL,
        transcript: "transcript text",
        summary: "summary",
        healthScore: 80,
        sentiment: "positive",
        duration: 120,
        source: "upload",
        createdAt: new Date("2026-06-01T10:00:00.000Z"),
      };
      if (args?.select) {
        const select = args.select;
        return Promise.resolve([
          Object.fromEntries(
            Object.entries(row).filter(([key]) => select[key as string])
          ),
        ]);
      }
      return Promise.resolve([row]);
    });
  });

  it("returns calls without an audioUrl field and never selects it", async () => {
    const response = await CallsGET(
      new Request("https://usegauge.com/api/calls") as unknown as NextRequest
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.calls).toHaveLength(1);
    expect(payload.calls[0]).not.toHaveProperty("audioUrl");
    expect(JSON.stringify(payload)).not.toContain("audioUrl");
    expect(JSON.stringify(payload)).not.toContain(BLOB_URL);

    const findArgs = mockPrismaCallFindMany.mock.calls[0][0];
    expect(findArgs.select).not.toHaveProperty("audioUrl");
    expect(findArgs.select).toEqual(
      expect.objectContaining({ id: true, filename: true, createdAt: true })
    );
  });

  it("still serves cached payloads as-is (60s TTL may carry the field — accepted)", async () => {
    mockCacheGet.mockResolvedValue({
      calls: [{ id: "c1", filename: "a.mp3", audioUrl: BLOB_URL }],
      total: 1,
    });

    const response = await CallsGET(
      new Request("https://usegauge.com/api/calls") as unknown as NextRequest
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.calls[0].audioUrl).toBe(BLOB_URL);
    expect(mockPrismaCallFindMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/analyze — JSON blobUrl branch privacy (presigned orphan + size gate)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "sk-shared";
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    process.env.BLOB_STORE_ID = "store_acme123";
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
    mockBlobPut.mockResolvedValue({ url: BLOB_URL });
    mockBlobDel.mockResolvedValue(undefined);
    mockCacheGet.mockResolvedValue(null);
    mockCacheSet.mockResolvedValue(undefined);
    global.fetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array(4096).buffer, { status: 200 })
    );
  });

  function jsonRequest(blobUrl = BLOB_URL, overrides: Record<string, unknown> = {}): Request {
    return new Request("https://usegauge.com/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        blobUrl,
        filename: "call.wav",
        ...overrides,
      }),
    });
  }

  it("deletes the presigned blob when JSON validation fails (orphan leak fix) — 400 with del", async () => {
    mockValidate.mockResolvedValue({ isValid: false, error: "Invalid audio file format. Please upload a valid audio file." });
    global.fetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array(1024).buffer, { status: 200 })
    );

    const response = await AnalyzePOST(jsonRequest());

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Invalid audio file");
    expect(mockBlobDel).toHaveBeenCalledWith(BLOB_URL);
    expect(mockBlobDel).toHaveBeenCalledTimes(1);
    expect(mockPrismaCallCreate).not.toHaveBeenCalled();
    expect(mockTranscribe).not.toHaveBeenCalled();
  });

  it("JSON validation-fail does not leave orphan — deletes even though isBlobUpload true but uploadedOwnBlob false", async () => {
    mockValidate.mockResolvedValue({ isValid: false, error: "bad file" });
    global.fetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array(2048).buffer, { status: 200 })
    );

    const response = await AnalyzePOST(jsonRequest());

    expect(response.status).toBe(400);
    expect(mockBlobDel).toHaveBeenCalledWith(BLOB_URL);
    expect(mockBlobDel).toHaveBeenCalledTimes(1);
  });

  it("rejects JSON blob over free-plan cap (30MB) with 413 and deletes orphan — presigned bypass gate", async () => {
    mockGetUserByClerkId.mockResolvedValue({ id: "user-1", plan: "free" });
    const oversized = new Uint8Array(30 * 1024 * 1024 + 1);
    global.fetch = vi.fn().mockResolvedValue(
      new Response(oversized.buffer, { status: 200 })
    );

    const response = await AnalyzePOST(jsonRequest());

    expect(response.status).toBe(413);
    const body = await response.json();
    expect(body.error).toContain("30MB");
    expect(mockBlobDel).toHaveBeenCalledWith(BLOB_URL);
    expect(mockPrismaCallCreate).not.toHaveBeenCalled();
    expect(mockTranscribe).not.toHaveBeenCalled();
    expect(mockValidate).not.toHaveBeenCalled();
  });

  it("accepts JSON blob exactly at free-plan cap (30MB) — 200 with free-plan cleanup", async () => {
    mockGetUserByClerkId.mockResolvedValue({ id: "user-1", plan: "free" });
    const exactly = new Uint8Array(30 * 1024 * 1024);
    global.fetch = vi.fn().mockResolvedValue(
      new Response(exactly.buffer, { status: 200 })
    );
    mockValidate.mockResolvedValue({ isValid: true, error: null });

    const response = await AnalyzePOST(jsonRequest());

    expect(response.status).toBe(200);
    // free-plan success triggers blob cleanup + nulls audioUrl (W-A retention)
    expect(mockBlobDel).toHaveBeenCalledWith(BLOB_URL);
    expect(mockPrismaCallUpdate).toHaveBeenCalledWith({
      where: { id: "call-1" },
      data: { audioUrl: null },
    });
    expect(mockPrismaCallCreate).toHaveBeenCalledTimes(1);
  });

  it("enforces pro plan cap (200MB) in JSON branch — free rejects 31MB but pro allows", async () => {
    mockGetUserByClerkId.mockResolvedValue({ id: "user-1", plan: "pro" });
    const thirtyOneMB = new Uint8Array(31 * 1024 * 1024);
    global.fetch = vi.fn().mockResolvedValue(
      new Response(thirtyOneMB.buffer, { status: 200 })
    );

    const response = await AnalyzePOST(jsonRequest());

    expect(response.status).toBe(200);
    expect(mockBlobDel).not.toHaveBeenCalled();
    expect(mockPrismaCallCreate).toHaveBeenCalledTimes(1);
  });

  it("rejects JSON blob over pro cap (200MB) with 413 and deletes orphan", async () => {
    mockGetUserByClerkId.mockResolvedValue({ id: "user-1", plan: "pro" });
    const oversized = new Uint8Array(200 * 1024 * 1024 + 1);
    global.fetch = vi.fn().mockResolvedValue(
      new Response(oversized.buffer, { status: 200 })
    );

    const response = await AnalyzePOST(jsonRequest());

    expect(response.status).toBe(413);
    expect(mockBlobDel).toHaveBeenCalledWith(BLOB_URL);
    expect(mockPrismaCallCreate).not.toHaveBeenCalled();
  });

  it("does not call blobDel on successful JSON upload for pro (paid keeps audio)", async () => {
    mockGetUserByClerkId.mockResolvedValue({ id: "user-1", plan: "pro" });
    global.fetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array(4096).buffer, { status: 200 })
    );

    const response = await AnalyzePOST(jsonRequest());

    expect(response.status).toBe(200);
    expect(mockBlobDel).not.toHaveBeenCalled();
  });
});
