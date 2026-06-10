export interface TrendBucket {
  date: string;
  avgSentiment: number;
  objectionCount: number;
  callCount: number;
  avgCloseProbability: number;
}

export interface TrendSummary {
  buckets: TrendBucket[];
  topObjections: Array<{ type: string; count: number }>;
  overallAvgSentiment: number;
  totalCalls: number;
}

export function aggregateTrends(
  insights: Array<{
    createdAt: Date;
    sentimentScore?: number | null;
    objections?: Array<{ type: string }> | null;
    closeProbability?: number | null;
  }>,
  groupBy: "week" | "month" = "week",
): TrendSummary {
  if (!insights.length) {
    return { buckets: [], topObjections: [], overallAvgSentiment: 0, totalCalls: 0 };
  }

  const buckets = new Map<string, TrendBucket>();
  const objectionCounts = new Map<string, number>();

  for (const ins of insights) {
    const key = bucketKey(ins.createdAt, groupBy);

    const existing = buckets.get(key) || {
      date: key,
      avgSentiment: 0,
      objectionCount: 0,
      callCount: 0,
      avgCloseProbability: 0,
    };

    existing.callCount++;
    existing.avgSentiment += ins.sentimentScore ?? 0.5;
    existing.avgCloseProbability += ins.closeProbability ?? 0.5;

    if (ins.objections) {
      existing.objectionCount += ins.objections.length;
      for (const o of ins.objections) {
        objectionCounts.set(o.type, (objectionCounts.get(o.type) || 0) + 1);
      }
    }

    buckets.set(key, existing);
  }

  const bucketList = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, b]) => ({
      ...b,
      avgSentiment: round(b.avgSentiment / b.callCount),
      avgCloseProbability: round(b.avgCloseProbability / b.callCount),
    }));

  const totalCalls = insights.length;
  const overallAvgSentiment = round(
    insights.reduce((s, i) => s + (i.sentimentScore ?? 0.5), 0) / totalCalls,
  );

  const topObjections = Array.from(objectionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([type, count]) => ({ type, count }));

  return { buckets: bucketList, topObjections, overallAvgSentiment, totalCalls };
}

function bucketKey(date: Date, groupBy: "week" | "month"): string {
  const d = new Date(date);
  if (groupBy === "week") {
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    start.setHours(0, 0, 0, 0);
    return start.toISOString().slice(0, 10);
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
