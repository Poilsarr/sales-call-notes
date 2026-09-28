import { describe, it, expect } from "vitest";
import {
  scoreDeal,
  RISK_WEIGHTS,
  RISK_MAX,
  MAX_NEXT_QUESTIONS,
  LOW_HEALTH_THRESHOLD,
  NEXT_QUESTION_TEMPLATES,
  FIELD_PRIORITY,
  type DealScoreInput,
} from "@/lib/deal-risk";

const STRONG_TRANSCRIPT = [
  "Our CFO gave final approval and signed off as economic buyer.",
  "The budget of $120k is approved with pricing agreed.",
  "Their evaluation criteria and requirements include a must-have security review.",
  "Procurement will run the paper process with legal review and an MSA redline.",
  "They are struggling with a manual process that is losing revenue.",
  "Our champion will advocate and sell internally; she is on our side.",
].join(" ");

const STRONG_SUMMARY = [
  "Strong pain point costing 20% in churn.",
  "The decision maker team will approve.",
  "They need this to hit their Q3 goal and the use case is clear.",
  "Timeline: go-live next quarter with a deadline to decide by end of September.",
  "ROI payback looks strong against KPI benchmarks and projected savings.",
  "We will send the proposal and schedule a demo as a next step.",
].join(" ");

const STRONG_INPUT: DealScoreInput = {
  transcript: STRONG_TRANSCRIPT,
  summary: STRONG_SUMMARY,
  actionItems: ["Send proposal by Friday", "Schedule technical demo"],
  competitors: [],
  healthScore: 85,
  sentiment: "positive",
};

const WEAK_INPUT: DealScoreInput = {
  transcript:
    "Sam joined an introductory call. " +
    "Small team, early conversation. " +
    "Sam listened to a platform overview. " +
    "General interest was expressed.",
  summary: "Introductory call with Sam.",
  actionItems: [],
};

describe("scoreDeal — strong deal (low risk)", () => {
  it("scores a fully-qualified deal at 0 risk", () => {
    expect(scoreDeal(STRONG_INPUT).riskScore).toBe(0);
  });

  it("marks every MEDDPICC field found with quoted evidence", () => {
    const { meddpicc } = scoreDeal(STRONG_INPUT);
    for (const key of Object.keys(meddpicc) as Array<keyof typeof meddpicc>) {
      expect(meddpicc[key].found, key).toBe(true);
      expect(meddpicc[key].evidence, key).toBeTruthy();
    }
  });

  it("marks every BANT field found with quoted evidence", () => {
    const { bant } = scoreDeal(STRONG_INPUT);
    for (const key of Object.keys(bant) as Array<keyof typeof bant>) {
      expect(bant[key].found, key).toBe(true);
      expect(bant[key].evidence, key).toBeTruthy();
    }
  });

  it("reports no missing fields, flags, or follow-up questions", () => {
    const r = scoreDeal(STRONG_INPUT);
    expect(r.missingFields).toEqual([]);
    expect(r.riskFlags).toEqual([]);
    expect(r.nextQuestions).toEqual([]);
  });

  it("quotes the matched metrics snippet verbatim (evidence contains ROI)", () => {
    const r = scoreDeal(STRONG_INPUT);
    expect(r.meddpicc.metrics.evidence).toMatch(/ROI/i);
  });
});

describe("scoreDeal — weak deal (high risk)", () => {
  it("scores a thin deal at maximum risk (capped at 100)", () => {
    const r = scoreDeal(WEAK_INPUT);
    expect(r.riskScore).toBe(RISK_MAX);
    expect(r.riskScore).toBeLessThanOrEqual(100);
  });

  it("lists economicBuyer and timeline among missing fields", () => {
    const r = scoreDeal(WEAK_INPUT);
    expect(r.missingFields).toContain("economicBuyer");
    expect(r.missingFields).toContain("timeline");
    expect(r.missingFields).toHaveLength(FIELD_PRIORITY.length);
  });

  it("flags missing economic buyer and no next step", () => {
    const r = scoreDeal(WEAK_INPUT);
    expect(r.riskFlags).toContain("missing-economic-buyer");
    expect(r.riskFlags).toContain("no-next-step");
  });

  it("asks at most 3 next questions, starting with the economic buyer", () => {
    const r = scoreDeal(WEAK_INPUT);
    expect(r.nextQuestions.length).toBeLessThanOrEqual(MAX_NEXT_QUESTIONS);
    expect(r.nextQuestions).toHaveLength(3);
    expect(r.nextQuestions[0]).toBe(NEXT_QUESTION_TEMPLATES.economicBuyer);
    expect(r.nextQuestions[0].toLowerCase()).toContain("economic buyer");
  });
});

describe("scoreDeal — competitor deal", () => {
  const input: DealScoreInput = {
    ...STRONG_INPUT,
    transcript: `${STRONG_TRANSCRIPT} They are also evaluating RivalCo as an alternative.`,
    competitors: ["RivalCo"],
    healthScore: 75,
    sentiment: "neutral",
  };

  it("flags competitor pressure with exactly the competitor weight", () => {
    const r = scoreDeal(input);
    expect(r.riskFlags).toContain("competitor-mentioned");
    expect(r.riskScore).toBe(RISK_WEIGHTS.competitorMentioned);
  });

  it("keeps all qualification fields found (no missing, no questions)", () => {
    const r = scoreDeal(input);
    expect(r.missingFields).toEqual([]);
    expect(r.nextQuestions).toEqual([]);
  });
});

describe("scoreDeal — empty input", () => {
  it("reports max missing, capped risk, and at most 3 questions", () => {
    const r = scoreDeal({});
    expect(r.missingFields).toHaveLength(FIELD_PRIORITY.length);
    expect(r.riskScore).toBe(RISK_MAX);
    expect(r.nextQuestions).toHaveLength(MAX_NEXT_QUESTIONS);
    expect(r.riskFlags).toContain("no-next-step");
  });
});

describe("scoreDeal — signals and robustness", () => {
  it("adds the negative-sentiment weight on negative sentiment", () => {
    const r = scoreDeal({ ...STRONG_INPUT, sentiment: "negative" });
    expect(r.riskFlags).toContain("negative-sentiment");
    expect(r.riskScore).toBe(RISK_WEIGHTS.negativeSentiment);
  });

  it("adds the low-health weight below the threshold only", () => {
    const low = scoreDeal({ ...STRONG_INPUT, healthScore: LOW_HEALTH_THRESHOLD - 1 });
    expect(low.riskFlags).toContain("low-health-score");
    expect(low.riskScore).toBe(RISK_WEIGHTS.lowHealthScore);

    const ok = scoreDeal({ ...STRONG_INPUT, healthScore: LOW_HEALTH_THRESHOLD });
    expect(ok.riskFlags).not.toContain("low-health-score");
    expect(ok.riskScore).toBe(0);
  });

  it("detects keywords case-insensitively", () => {
    const r = scoreDeal({ transcript: "Spoke with the CFO about BUDGET and TIMELINE." });
    expect(r.meddpicc.economicBuyer.found).toBe(true);
    expect(r.bant.budget.found).toBe(true);
    expect(r.bant.timeline.found).toBe(true);
  });

  it("is pure and deterministic: sync return, stable across calls", () => {
    const a = scoreDeal(WEAK_INPUT);
    const b = scoreDeal(WEAK_INPUT);
    expect(a).not.toBeInstanceOf(Promise);
    expect(a).toEqual(b);
  });

  it("exposes thresholds as consts for contract tests", () => {
    expect(RISK_WEIGHTS.missingEconomicBuyer).toBe(25);
    expect(RISK_WEIGHTS.missingTimeline).toBe(15);
    expect(RISK_WEIGHTS.competitorMentioned).toBe(10);
    expect(RISK_WEIGHTS.noNextStep).toBe(15);
    expect(RISK_WEIGHTS.negativeSentiment).toBe(10);
    expect(RISK_MAX).toBe(100);
    expect(MAX_NEXT_QUESTIONS).toBe(3);
  });
});
