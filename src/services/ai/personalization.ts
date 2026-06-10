export interface UserPattern {
  preferredTone: "terse" | "detailed" | "balanced";
  rubricEmphasis: string[];
  commonObjections: string[];
  avgCallDuration: number;
}

export interface CallPersonalization {
  tone: "terse" | "detailed" | "balanced";
  emphasizeRubrics: string[];
  coachTips: string[];
  commonObjections: string[];
}

const DEFAULT_PATTERN: UserPattern = {
  preferredTone: "balanced",
  rubricEmphasis: [],
  commonObjections: [],
  avgCallDuration: 0,
};

export class PersonalizationService {
  async generatePersonalizedHooks(
    _transcript: string,
    _analysis: unknown,
  ): Promise<{ hooks: string[] }> {
    return { hooks: [] };
  }
}

export function buildPersonalization(
  recentInsights: Array<{
    objections?: Array<{ type: string }>;
    coachingNotes?: { improvements?: string[]; tips?: string[] };
    salesScorecard?: { overallScore?: number };
    talkRatio?: { rep: number };
  }>,
): CallPersonalization {
  if (!recentInsights.length) {
    return {
      tone: "balanced",
      emphasizeRubrics: [],
      coachTips: [],
      commonObjections: [],
    };
  }

  const objectionCounts = new Map<string, number>();
  for (const i of recentInsights) {
    if (i.objections) {
      for (const o of i.objections) {
        objectionCounts.set(o.type, (objectionCounts.get(o.type) || 0) + 1);
      }
    }
  }
  const commonObjections = Array.from(objectionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type]) => type);

  const useDetailed = recentInsights.length >= 5;
  const avgRepTalk = recentInsights.reduce((s, i) => s + (i.talkRatio?.rep ?? 0.5), 0) / recentInsights.length;
  const repDominant = avgRepTalk > 0.65;

  return {
    tone: repDominant ? "detailed" : useDetailed ? "balanced" : "terse",
    emphasizeRubrics: recentInsights.length >= 3 ? ["bant", "meddic"].filter(() => true) : [],
    coachTips: recentInsights.flatMap((i) => i.coachingNotes?.tips ?? []).slice(0, 3),
    commonObjections,
  };
}
