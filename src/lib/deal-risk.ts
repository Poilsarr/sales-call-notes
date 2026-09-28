/**
 * Deal-risk scoring engine (Part 5A).
 *
 * PURE + SYNC + DETERMINISTIC: no LLM, no network, no I/O, no Date.now().
 * Same input always produces the same output. Safe to compute on read.
 */

export type MeddpiccKey =
  | "metrics"
  | "economicBuyer"
  | "decisionCriteria"
  | "paperProcess"
  | "pain"
  | "champion";

export type BantKey = "budget" | "authority" | "need" | "timeline";

export interface DealFieldResult {
  found: boolean;
  evidence?: string;
}

export interface DealScoreInput {
  transcript?: string;
  summary?: string;
  actionItems?: string[];
  competitors?: string[];
  healthScore?: number;
  sentiment?: string;
}

export interface DealScore {
  meddpicc: Record<MeddpiccKey, DealFieldResult>;
  bant: Record<BantKey, DealFieldResult>;
  missingFields: string[];
  riskFlags: string[];
  riskScore: number;
  nextQuestions: string[];
}

export const MEDDPICC_KEYS: MeddpiccKey[] = [
  "metrics",
  "economicBuyer",
  "decisionCriteria",
  "paperProcess",
  "pain",
  "champion",
];

export const BANT_KEYS: BantKey[] = ["budget", "authority", "need", "timeline"];

/** Priority order for missing-field surfacing (highest risk weight first). */
export const FIELD_PRIORITY: Array<MeddpiccKey | BantKey> = [
  "economicBuyer",
  "timeline",
  "budget",
  "authority",
  "need",
  "metrics",
  "decisionCriteria",
  "paperProcess",
  "pain",
  "champion",
];

/** Additive risk weights. Sum is capped at RISK_MAX. */
export const RISK_WEIGHTS = {
  missingEconomicBuyer: 25,
  missingTimeline: 15,
  missingBudget: 10,
  missingAuthority: 10,
  missingNeed: 5,
  missingMetrics: 5,
  missingDecisionCriteria: 5,
  missingPaperProcess: 5,
  missingPain: 5,
  missingChampion: 5,
  competitorMentioned: 10,
  noNextStep: 15,
  negativeSentiment: 10,
  lowHealthScore: 10,
} as const;

export const RISK_MAX = 100;
export const LOW_HEALTH_THRESHOLD = 60;
export const MAX_NEXT_QUESTIONS = 3;
export const EVIDENCE_WINDOW = 80;

export const NEXT_QUESTION_TEMPLATES: Record<MeddpiccKey | BantKey, string> = {
  economicBuyer: "Who is the economic buyer who can sign off on this purchase?",
  timeline: "What is the target timeline or go-live deadline?",
  budget: "Is there an approved budget, and what range has been allocated?",
  authority: "Who else needs to approve this decision besides your Ferdowsi?",
  need: "What business need or goal is driving this evaluation?",
  metrics: "How will you measure success — what ROI or KPIs matter most?",
  decisionCriteria: "What criteria will you use to evaluate and compare options?",
  paperProcess: "What does your procurement or legal review process look like?",
  pain: "What is the biggest pain point with your current process?",
  champion: "Who on your team would champion this internally?",
};

/** Case-insensitive keyword/phrase evidence scan per field. */
const FIELD_KEYWORDS: Record<MeddpiccKey | BantKey, string[]> = {
  metrics: [
    "roi",
    "metrics",
    "metric",
    "kpi",
    "cost saving",
    "savings",
    "revenue",
    "%",
    "reduce cost",
    "payback",
    "measurement",
    "benchmark",
  ],
  economicBuyer: [
    "economic buyer",
    "cfo",
    "ceo",
    "vp ",
    "vice president",
    "budget holder",
    "budget owner",
    "sign off",
    "sign-off",
    "final approval",
    "decision maker",
  ],
  decisionCriteria: [
    "decision criteria",
    "criteria",
    "requirements",
    "must-have",
    "must have",
    "evaluation",
    "scorecard",
    "looking for",
  ],
  paperProcess: [
    "paper process",
    "procurement",
    "legal review",
    "contract review",
    "redline",
    "red line",
    "msa",
    "dpa",
    "security review",
    "signing process",
    "purchase order",
  ],
  pain: [
    "pain",
    "problem",
    "struggling",
    "struggle",
    "frustrat",
    "bottleneck",
    "inefficient",
    "manual process",
    "losing",
    "churn",
    "missed",
    "broken",
  ],
  champion: [
    "champion",
    "will advocate",
    "advocate",
    "internal sell",
    "sell internally",
    "on our side",
    "coach",
  ],
  budget: ["budget", "price", "pricing", "cost", "quote", "$"],
  authority: [
    "authority",
    "decision maker",
    "decision-maker",
    "approver",
    "approve",
    "sign off",
    "sign-off",
    "Ferdowsi",
    "authorized",
  ],
  need: [
    "need",
    "want",
    "looking for",
    "goal",
    "objective",
    "trying to",
    "use case",
  ],
  timeline: [
    "timeline",
    "deadline",
    "go-live",
    "go live",
    "launch date",
    "by q",
    "close date",
    "start date",
    "kickoff",
    "kick-off",
    "next quarter",
    "this quarter",
    "decide by",
  ],
};

const COMPETITOR_KEYWORDS = [
  "competitor",
  "alternative",
  "evaluating",
  "also looking at",
  " incumbent",
];

const NEXT_STEP_KEYWORDS = [
  "next step",
  "next steps",
  "follow-up",
  "follow up",
  "will send",
  "will share",
  "schedule",
  "calendar invite",
  "next meeting",
  "demo",
];

function buildCorpus(input: DealScoreInput): { original: string; lower: string } {
  const parts: string[] = [];
  if (input.transcript) parts.push(input.transcript);
  if (input.summary) parts.push(input.summary);
  if (input.actionItems) parts.push(input.actionItems.join("\n"));
  const original = parts.join("\n");
  return { original, lower: original.toLowerCase() };
}

/** First case-insensitive hit, quoted as an ~EVIDENCE_WINDOW char snippet. */
function findEvidence(
  original: string,
  lower: string,
  keywords: string[],
): string | undefined {
  for (const kw of keywords) {
    const needle = kw.toLowerCase();
    const idx = lower.indexOf(needle);
    if (idx !== -1) {
      const start = Math.max(0, idx - EVIDENCE_WINDOW / 2);
      const end = Math.min(
        original.length,
        idx + needle.length + EVIDENCE_WINDOW / 2,
      );
      const prefix = start > 0 ? "…" : "";
      const suffix = end < original.length ? "…" : "";
      return `${prefix}${original.slice(start, end).trim()}${suffix}`;
    }
  }
  return undefined;
}

function scanField(
  original: string,
  lower: string,
  key: MeddpiccKey | BantKey,
): DealFieldResult {
  const evidence = findEvidence(original, lower, FIELD_KEYWORDS[key]);
  if (evidence !== undefined) return { found: true, evidence };
  return { found: false };
}

export function scoreDeal(input: DealScoreInput): DealScore {
  const { original, lower } = buildCorpus(input);

  const meddpicc = {} as Record<MeddpiccKey, DealFieldResult>;
  for (const key of MEDDPICC_KEYS) meddpicc[key] = scanField(original, lower, key);

  const bant = {} as Record<BantKey, DealFieldResult>;
  for (const key of BANT_KEYS) bant[key] = scanField(original, lower, key);

  const found = (key: MeddpiccKey | BantKey): boolean =>
    key in meddpicc ? meddpicc[key as MeddpiccKey].found : bant[key as BantKey].found;

  const missingFields = FIELD_PRIORITY.filter((key) => !found(key));

  // --- risk flags + weighted score ---------------------------------------
  const riskFlags: string[] = [];
  let riskScore = 0;

  const missingWeightKey: Record<string, keyof typeof RISK_WEIGHTS> = {
    economicBuyer: "missingEconomicBuyer",
    timeline: "missingTimeline",
    budget: "missingBudget",
    authority: "missingAuthority",
    need: "missingNeed",
    metrics: "missingMetrics",
    decisionCriteria: "missingDecisionCriteria",
    paperProcess: "missingPaperProcess",
    pain: "missingPain",
    champion: "missingChampion",
  };
  const flagFor = (key: string): string =>
    `missing-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

  for (const key of missingFields) {
    riskFlags.push(flagFor(key));
    riskScore += RISK_WEIGHTS[missingWeightKey[key]];
  }

  // Competitor pressure: explicit names (tracked mentions) or generic signals.
  const competitorNames = (input.competitors ?? []).filter(Boolean);
  const genericHit = findEvidence(original, lower, COMPETITOR_KEYWORDS);
  if (competitorNames.length > 0 || genericHit !== undefined) {
    riskFlags.push("competitor-mentioned");
    riskScore += RISK_WEIGHTS.competitorMentioned;
  }

  // No next step: no action items and no forward-motion language.
  const hasActionItems = (input.actionItems ?? []).length > 0;
  const hasNextStepLanguage =
    findEvidence(original, lower, NEXT_STEP_KEYWORDS) !== undefined;
  if (!hasActionItems && !hasNextStepLanguage) {
    riskFlags.push("no-next-step");
    riskScore += RISK_WEIGHTS.noNextStep;
  }

  // Negative sentiment signal.
  if ((input.sentiment ?? "").toLowerCase().includes("neg")) {
    riskFlags.push("negative-sentiment");
    riskScore += RISK_WEIGHTS.negativeSentiment;
  }

  // Low health score signal.
  if (
    typeof input.healthScore === "number" &&
    Number.isFinite(input.healthScore) &&
    input.healthScore < LOW_HEALTH_THRESHOLD
  ) {
    riskFlags.push("low-health-score");
    riskScore += RISK_WEIGHTS.lowHealthScore;
  }

  riskScore = Math.min(RISK_MAX, riskScore);

  const nextQuestions = missingFields
    .slice(0, MAX_NEXT_QUESTIONS)
    .map((key) => NEXT_QUESTION_TEMPLATES[key]);

  return { meddpicc, bant, missingFields, riskFlags, riskScore, nextQuestions };
}
