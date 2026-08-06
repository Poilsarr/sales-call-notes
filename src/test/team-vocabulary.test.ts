import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();

function makeMockOpenAI() {
  return class MockOpenAI {
    chat = { completions: { create: mockCreate } };
  };
}

vi.mock("openai", () => {
  const MockOpenAI = makeMockOpenAI();
  return { default: MockOpenAI, OpenAI: MockOpenAI };
});

vi.mock("@/lib/secrets", () => ({
  getSecret: (key: string) => (key === "OPENAI_API_KEY" ? "test-key" : ""),
}));

vi.mock("@/lib/prompts-registry", () => ({
  loadPromptTemplate: vi.fn().mockResolvedValue("You are an expert sales call analyst."),
  isValidTemplate: vi.fn().mockReturnValue(true),
}));

import {
  buildVocabularyPrompt,
  validateVocabularyEntry,
  VOCABULARY_TERM_MAX,
  VOCABULARY_DEFINITION_MAX,
  MAX_PROMPT_ENTRIES,
} from "@/lib/team-vocabulary";
import { AnalysisService } from "@/services/ai/analysis";

function makeEntries(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `e${i}`,
    term: `Term ${i}`,
    definition: `Definition for term ${i}`,
  }));
}

describe("validateVocabularyEntry", () => {
  it("accepts trimmed term + definition", () => {
    expect(validateVocabularyEntry({ term: "  Lighthouse deal ", definition: "  $50k+ tier " })).toEqual({
      term: "Lighthouse deal",
      definition: "$50k+ tier",
    });
  });

  it("rejects missing / non-string input", () => {
    expect("error" in validateVocabularyEntry({ term: "", definition: "x" })).toBe(true);
    expect("error" in validateVocabularyEntry({ term: "x", definition: "" })).toBe(true);
    expect("error" in validateVocabularyEntry({ term: 42, definition: "x" })).toBe(true);
  });

  it("rejects overlong term and definition", () => {
    const longTerm = "a".repeat(VOCABULARY_TERM_MAX + 1);
    const longDef = "b".repeat(VOCABULARY_DEFINITION_MAX + 1);
    expect("error" in validateVocabularyEntry({ term: longTerm, definition: "x" })).toBe(true);
    expect("error" in validateVocabularyEntry({ term: "x", definition: longDef })).toBe(true);
  });

  it("accepts boundary-length values", () => {
    const result = validateVocabularyEntry({
      term: "a".repeat(VOCABULARY_TERM_MAX),
      definition: "b".repeat(VOCABULARY_DEFINITION_MAX),
    });
    expect("error" in result).toBe(false);
  });
});

describe("buildVocabularyPrompt", () => {
  it("returns empty string for no entries", () => {
    expect(buildVocabularyPrompt([])).toBe("");
  });

  it("formats term: definition lines with a header", () => {
    const out = buildVocabularyPrompt(makeEntries(2));
    expect(out).toContain("TEAM GLOSSARY");
    expect(out).toContain("- Term 0: Definition for term 0");
    expect(out).toContain("- Term 1: Definition for term 1");
    expect(out).toContain("END OF TEAM GLOSSARY");
  });

  it("caps the block and notes omitted terms", () => {
    const out = buildVocabularyPrompt(makeEntries(MAX_PROMPT_ENTRIES + 20));
    const count = (out.match(/- Term \d+:/g) || []).length;
    expect(count).toBe(MAX_PROMPT_ENTRIES);
    expect(out).toContain("20 more terms");
  });
});

describe("AnalysisService vocabulary injection", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({}) } }],
    });
  });

  it("appends the glossary to the system prompt when vocabulary is passed", async () => {
    const service = new AnalysisService();
    await service.analyze("Hello there", undefined, "b2b-sales", makeEntries(1));

    const messages = mockCreate.mock.calls[0][0].messages;
    const systemPrompt = messages.find((m: any) => m.role === "system").content;
    expect(systemPrompt).toContain("You are an expert sales call analyst.");
    expect(systemPrompt).toContain("TEAM GLOSSARY");
    expect(systemPrompt).toContain("- Term 0: Definition for term 0");
  });

  it("leaves the prompt untouched when no vocabulary is passed", async () => {
    const service = new AnalysisService();
    await service.analyze("Hello there", undefined, "b2b-sales");

    const messages = mockCreate.mock.calls[0][0].messages;
    const systemPrompt = messages.find((m: any) => m.role === "system").content;
    expect(systemPrompt).not.toContain("TEAM GLOSSARY");
  });
});
