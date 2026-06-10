import { describe, it, expect } from "vitest";
import { aggregateTrends } from "@/services/ai/trends";

function makeInsight(date: string, opts?: { sentiment?: number; objections?: string[]; closeProb?: number }) {
  return {
    createdAt: new Date(date),
    sentimentScore: opts?.sentiment ?? 0.5,
    objections: opts?.objections ? opts.objections.map((t) => ({ type: t })) : null,
    closeProbability: opts?.closeProb ?? 0.5,
  };
}

describe("aggregateTrends", () => {
  it("returns empty summary for no insights", () => {
    const r = aggregateTrends([]);
    expect(r.buckets).toEqual([]);
    expect(r.topObjections).toEqual([]);
    expect(r.totalCalls).toBe(0);
  });

  it("groups by week correctly", () => {
    const r = aggregateTrends([
      makeInsight("2026-06-01T12:00:00Z", { sentiment: 0.8 }),
      makeInsight("2026-06-02T12:00:00Z", { sentiment: 0.6 }),
    ], "week");
    expect(r.buckets).toHaveLength(1);
    expect(r.buckets[0].callCount).toBe(2);
    expect(r.buckets[0].avgSentiment).toBe(0.7);
  });

  it("groups by month correctly", () => {
    const r = aggregateTrends([
      makeInsight("2026-06-01T12:00:00Z"),
      makeInsight("2026-07-01T12:00:00Z"),
    ], "month");
    expect(r.buckets).toHaveLength(2);
  });

  it("aggregates top objections across all insights", () => {
    const r = aggregateTrends([
      makeInsight("2026-06-01T12:00:00Z", { objections: ["price", "timeline"] }),
      makeInsight("2026-06-02T12:00:00Z", { objections: ["price"] }),
    ]);
    expect(r.topObjections[0].type).toBe("price");
    expect(r.topObjections[0].count).toBe(2);
    expect(r.topObjections[1].type).toBe("timeline");
  });

  it("limits top objections to 10", () => {
    const types = Array.from({ length: 15 }, (_, i) => `obj${i}`);
    const r = aggregateTrends([
      makeInsight("2026-06-01T12:00:00Z", { objections: types }),
    ]);
    expect(r.topObjections.length).toBeLessThanOrEqual(10);
  });

  it("calculates overall avg sentiment", () => {
    const r = aggregateTrends([
      makeInsight("2026-06-01T12:00:00Z", { sentiment: 0.9 }),
      makeInsight("2026-06-02T12:00:00Z", { sentiment: 0.5 }),
    ]);
    expect(r.overallAvgSentiment).toBe(0.7);
    expect(r.totalCalls).toBe(2);
  });
});
