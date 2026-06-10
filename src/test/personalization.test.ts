import { describe, it, expect } from "vitest";
import { buildPersonalization } from "@/services/ai/personalization";

describe("buildPersonalization", () => {
  it("returns balanced defaults when no insights", () => {
    const r = buildPersonalization([]);
    expect(r.tone).toBe("balanced");
    expect(r.emphasizeRubrics).toEqual([]);
    expect(r.coachTips).toEqual([]);
    expect(r.commonObjections).toEqual([]);
  });

  it("detects common objections from recent insights", () => {
    const r = buildPersonalization([
      { objections: [{ type: "price" }, { type: "timeline" }] },
      { objections: [{ type: "price" }] },
      { objections: [{ type: "competitor" }] },
    ]);
    expect(r.commonObjections[0]).toBe("price");
    expect(r.commonObjections).toContain("timeline");
    expect(r.commonObjections).toContain("competitor");
  });

  it("sets tone to detailed when rep talks > 65%", () => {
    const r = buildPersonalization([
      { talkRatio: { rep: 0.8 }, objections: [], coachingNotes: {} },
      { talkRatio: { rep: 0.7 }, objections: [], coachingNotes: {} },
    ]);
    expect(r.tone).toBe("detailed");
  });

  it("collects top 3 coach tips across insights", () => {
    const r = buildPersonalization([
      { coachingNotes: { tips: ["Ask more open-ended questions", "Slow down"] } },
      { coachingNotes: { tips: ["Summarize next steps"] } },
    ]);
    expect(r.coachTips.length).toBeLessThanOrEqual(3);
    expect(r.coachTips).toContain("Ask more open-ended questions");
  });
});


