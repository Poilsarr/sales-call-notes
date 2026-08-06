import { describe, expect, it } from "vitest";
import { buildCallsCsv, formatExportTimestamp } from "@/lib/calls-export";

describe("buildCallsCsv", () => {
  it("keeps existing columns and appends an Action Item Timestamps column", () => {
    const csv = buildCallsCsv([
      {
        filename: "call1.mp3",
        createdAt: "2026-01-01T00:00:00.000Z",
        healthScore: 80,
        sentiment: "positive",
        summary: "Good call",
        actionItems: [{ timestamp: 75 }, { timestamp: 754 }],
      },
    ]);

    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe(
      "Filename,Date,Health Score,Sentiment,Action Items,Summary,Action Item Timestamps",
    );

    const row = lines[1].split(",");
    expect(row).toHaveLength(7);
    expect(row[5]).toBe('"Good call"');
    expect(row[6]).toBe('"1:15 | 12:34"');
  });

  it("emits an empty timestamp cell when no action items have a timestamp", () => {
    const csv = buildCallsCsv([
      { filename: "a.mp3", createdAt: "2026-01-01T00:00:00.000Z", actionItems: [{ timestamp: null }, {}] },
    ]);

    const row = csv.trim().split("\n")[1].split(",");
    expect(row[4]).toBe('"2"');
    expect(row[6]).toBe('""');
  });

  it("preserves the existing escaping via the shared cell sanitizer", () => {
    const csv = buildCallsCsv([
      { filename: 'quote".mp3', createdAt: "2026-01-01T00:00:00.000Z", actionItems: [] },
    ]);

    expect(csv.trim().split("\n")[1]).toContain('"quote"".mp3"');
  });
});

describe("formatExportTimestamp", () => {
  it("formats seconds as M:SS", () => {
    expect(formatExportTimestamp(75)).toBe("1:15");
    expect(formatExportTimestamp(754)).toBe("12:34");
    expect(formatExportTimestamp(0)).toBe("0:00");
  });
});
