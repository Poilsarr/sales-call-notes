import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createOpenAIClient: vi.fn(),
  callFindMany: vi.fn(),
  callFindUnique: vi.fn(),
}));

vi.mock("@/lib/openai-client", () => ({ createOpenAIClient: mocks.createOpenAIClient }));
vi.mock("@/lib/prisma", () => ({
  default: {
    call: { findMany: mocks.callFindMany, findUnique: mocks.callFindUnique },
  },
}));
vi.mock("@/lib/secrets", () => ({
  getSecret: () => "",
}));

import { KnowledgeGraphService } from "@/services/ai/knowledge-graph";

describe("KnowledgeGraphService — no empty-bearer OpenAI client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws an actionable error when no OpenAI key exists and builds no client", async () => {
    const kg = new KnowledgeGraphService();

    await expect(kg.searchByQuery("renewal discussion", "u1")).rejects.toThrow(
      /Embeddings unavailable: set OPENAI_API_KEY/
    );
    expect(mocks.createOpenAIClient).not.toHaveBeenCalled();
    expect(mocks.callFindMany).not.toHaveBeenCalled();
  });

  it("throws the same actionable error from indexCall when no key exists", async () => {
    mocks.callFindUnique.mockResolvedValue({ transcript: "hello", summary: "summary" });
    const kg = new KnowledgeGraphService();

    await expect(kg.indexCall("c1")).rejects.toThrow(/Embeddings unavailable/);
    expect(mocks.createOpenAIClient).not.toHaveBeenCalled();
  });
});
