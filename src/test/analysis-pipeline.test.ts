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

import { analysisPipeline } from "@/lib/analysis-pipeline";

const SAMPLE_TRANSCRIPT =
  "Rep: Hi Sarah. Prospect: $250k budget approved by VP Jane. " +
  "Losing 40 hours/week. Decision by end of quarter.";

function mockExtract() {
  return {
    choices: [{
      message: {
        content: JSON.stringify({
          actionItems: [{ task: "Send proposal", owner: "Rep", due: "Friday" }],
          decisions: [{ who: "Prospect", what: "Approved budget", by: "End of quarter" }],
          nextSteps: [{ step: "Follow-up call", date: "Next Monday", owner: "Rep" }],
        }),
      },
    }],
  };
}

function mockScore() {
  return {
    choices: [{
      message: {
        content: JSON.stringify({
          bant: {
            budget: { score: 0.8, evidence: "$250k approved" },
            authority: { score: 0.7, evidence: "VP Jane approved" },
            need: { score: 0.9, evidence: "Losing 40 hrs/week" },
            timeline: { score: 0.6, evidence: "End of quarter" },
          },
          meddic: {
            metrics: { score: 0.8, evidence: "40 hrs/week" },
            economicBuyer: { score: 0.7, evidence: "VP Jane" },
            decisionCriteria: { score: 0.6, evidence: "Analytics module" },
            decisionProcess: { score: 0.5, evidence: "End of quarter" },
            identifyPain: { score: 0.9, evidence: "Manual reporting" },
            champion: { score: 0.5, evidence: "Sarah engaged" },
          },
        }),
      },
    }],
  };
}

function mockEnrich() {
  return {
    choices: [{
      message: {
        content: JSON.stringify({
          strengths: ["Good discovery"],
          improvements: ["Quantify ROI earlier"],
          tips: ["Use MEDDIC scoring"],
          closeProbability: 72,
        }),
      },
    }],
  };
}

describe("analysisPipeline", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("runs extract then score then enrich and returns a full analysis", async () => {
    mockCreate
      .mockResolvedValueOnce(mockExtract())
      .mockResolvedValueOnce(mockScore())
      .mockResolvedValueOnce(mockEnrich());

    const result = await analysisPipeline(SAMPLE_TRANSCRIPT, "call_123");

    expect(result.callId).toBe("call_123");
    expect(result.extracted.actionItems).toHaveLength(1);
    expect(result.extracted.actionItems[0].task).toBe("Send proposal");
    expect(result.score.bant.budget.score).toBe(0.8);
    expect(result.score.meddic.identifyPain.score).toBe(0.9);
    expect(result.enrichment.coaching.strengths).toContain("Good discovery");
    expect(result.enrichment.closeProbability).toBe(72);
    expect(mockCreate).toHaveBeenCalledTimes(3);
  });

  it("calls each stage with JSON response_format and passes transcript to extract", async () => {
    mockCreate
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ actionItems: [], decisions: [], nextSteps: [] }) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ bant: {}, meddic: {} }) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ strengths: [], improvements: [], tips: [], closeProbability: 50 }) } }] });

    await analysisPipeline("transcript text", "call_456");

    for (let i = 0; i < 3; i++) {
      expect(mockCreate).toHaveBeenNthCalledWith(
        i + 1,
        expect.objectContaining({ response_format: { type: "json_object" } }),
      );
    }
    const extractCall = mockCreate.mock.calls[0][0] as any;
    const userMsg = extractCall.messages.find((m: any) => m.role === "user");
    expect(userMsg.content).toBe("transcript text");
  });

  it("falls back to safe defaults when extract returns invalid JSON", async () => {
    mockCreate
      .mockResolvedValueOnce({ choices: [{ message: { content: "not json" } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ bant: {}, meddic: {} }) } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ strengths: [], improvements: [], tips: [], closeProbability: 40 }) } }] });

    const result = await analysisPipeline("hi", "call_789");

    expect(result.extracted.actionItems).toEqual([]);
    expect(result.extracted.decisions).toEqual([]);
    expect(result.extracted.nextSteps).toEqual([]);
    expect(result.enrichment.closeProbability).toBe(40);
  });
});
