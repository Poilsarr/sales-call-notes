import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createOpenAIClient: vi.fn(),
  callFindMany: vi.fn(),
  callFindUnique: vi.fn(),
  hasSharedKey: true,
}));

vi.mock("@/lib/openai-client", () => ({ createOpenAIClient: mocks.createOpenAIClient }));
vi.mock("@/lib/prisma", () => ({
  default: {
    call: { findMany: mocks.callFindMany, findUnique: mocks.callFindUnique },
  },
}));
vi.mock("@/lib/secrets", () => ({
  getSecret: (k: string) => (mocks.hasSharedKey && k === "OPENAI_API_KEY" ? "sk-shared-key" : ""),
}));

import {
  KnowledgeGraphService,
  _resetSharedOpenAIClientForTests,
} from "@/services/ai/knowledge-graph";

function embeddingsClient() {
  return {
    embeddings: {
      create: vi.fn().mockResolvedValue({ data: [{ embedding: [0.1, 0.2] }] }),
    },
  };
}

function indexedCall(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    filename: "recording-1.mp3",
    title: null,
    summary: "quarterly renewal talk",
    transcript: "we should renew",
    createdAt: new Date("2026-06-01T10:00:00.000Z"),
    embedding: [0.3, 0.4],
    ...overrides,
  };
}

describe("KnowledgeGraphService — no empty-bearer OpenAI client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetSharedOpenAIClientForTests();
    mocks.hasSharedKey = true;
    mocks.createOpenAIClient.mockImplementation(() => embeddingsClient());
  });

  it("throws an actionable error when no OpenAI key exists and builds no client", async () => {
    mocks.hasSharedKey = false;
    const kg = new KnowledgeGraphService();

    await expect(kg.searchByQuery("renewal discussion", "u1")).rejects.toThrow(
      /Embeddings unavailable: set OPENAI_API_KEY/
    );
    expect(mocks.createOpenAIClient).not.toHaveBeenCalled();
  });

  it("throws the same actionable error from indexCall when no key exists", async () => {
    mocks.hasSharedKey = false;
    mocks.callFindUnique.mockResolvedValue({ transcript: "hello", summary: "summary" });
    const kg = new KnowledgeGraphService();

    await expect(kg.indexCall("c1")).rejects.toThrow(/Embeddings unavailable/);
    expect(mocks.createOpenAIClient).not.toHaveBeenCalled();
  });
});

describe("KnowledgeGraphService.searchByQuery — retrieval semantics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetSharedOpenAIClientForTests();
    mocks.hasSharedKey = true;
    mocks.createOpenAIClient.mockImplementation(() => embeddingsClient());
  });

  it("returns [] when no calls have embeddings", async () => {
    mocks.callFindMany.mockResolvedValue([]);
    const kg = new KnowledgeGraphService();

    const results = await kg.searchByQuery("renewal", "u1");

    expect(results).toEqual([]);
    expect(mocks.createOpenAIClient).toHaveBeenCalledTimes(1);
  });

  it("returns results ranked descending by similarity", async () => {
    mocks.callFindMany.mockResolvedValue([
      indexedCall({ id: "c1" }),
      indexedCall({ id: "c2", embedding: [0.9, 0.9] }),
      indexedCall({ id: "c3", embedding: [0.2, 0.1] }),
    ]);
    const kg = new KnowledgeGraphService();

    const results = await kg.searchByQuery("renewal", "u1");

    expect(results.map((r) => r.id)).toEqual(["c1", "c2", "c3"]);
    const similarities = results.map((r) => r.similarity);
    expect(similarities).toEqual([...similarities].sort((a, b) => b - a));
    expect(similarities[0]).toBeGreaterThan(similarities[1]);
    expect(similarities[1]).toBeGreaterThan(similarities[2]);
  });

  it("honors the limit", async () => {
    mocks.callFindMany.mockResolvedValue([
      indexedCall({ id: "c1" }),
      indexedCall({ id: "c2", embedding: [0.9, 0.9] }),
      indexedCall({ id: "c3", embedding: [0.2, 0.1] }),
    ]);
    const kg = new KnowledgeGraphService();

    const results = await kg.searchByQuery("renewal", "u1", 2);

    expect(results).toHaveLength(2);
  });

  it("embeds the query with the user BYOK key when provided", async () => {
    mocks.callFindMany.mockResolvedValue([]);
    const kg = new KnowledgeGraphService();

    await kg.searchByQuery("renewal", "u1", 5, "sk-proj-byok-key");

    expect(mocks.createOpenAIClient).toHaveBeenCalledTimes(1);
    expect(mocks.createOpenAIClient).toHaveBeenCalledWith({
      apiKey: "sk-proj-byok-key",
      timeout: 30000,
    });
  });

  it("embeds with the shared key when no BYOK key is provided", async () => {
    mocks.callFindMany.mockResolvedValue([]);
    const kg = new KnowledgeGraphService();

    await kg.searchByQuery("renewal", "u1");

    expect(mocks.createOpenAIClient).toHaveBeenCalledTimes(1);
    expect(mocks.createOpenAIClient).toHaveBeenCalledWith({ timeout: 30000 });
  });
});
