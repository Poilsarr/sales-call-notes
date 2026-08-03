export interface ScoreField {
  score: number;
  evidence: string;
}

export interface Scorecard {
  meddic: {
    metrics: ScoreField;
    economicBuyer: ScoreField;
    decisionCriteria: ScoreField;
    decisionProcess: ScoreField;
    identifyPain: ScoreField;
    champion: ScoreField;
  };
  bant: {
    budget: ScoreField;
    authority: ScoreField;
    need: ScoreField;
    timeline: ScoreField;
  };
  spin: {
    situation: ScoreField;
    problem: ScoreField;
    implication: ScoreField;
    needPayoff: ScoreField;
  };
  overallScore: number;
}

const EMPTY_FIELD: ScoreField = { score: 0, evidence: '' };

const MEDDIC_KEYS: (keyof Scorecard['meddic'])[] = [
  'metrics',
  'economicBuyer',
  'decisionCriteria',
  'decisionProcess',
  'identifyPain',
  'champion',
];

const BANT_KEYS: (keyof Scorecard['bant'])[] = ['budget', 'authority', 'need', 'timeline'];

const SPIN_KEYS: (keyof Scorecard['spin'])[] = [
  'situation',
  'problem',
  'implication',
  'needPayoff',
];

function clampScore(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(10, v));
}

function clampOverall(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

function coerceField(value: unknown): ScoreField {
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return {
      score: clampScore(obj.score),
      evidence: typeof obj.evidence === 'string' ? obj.evidence : '',
    };
  }
  const score = clampScore(value);
  return { score, evidence: '' };
}

function coerceFramework<T extends Record<string, ScoreField>>(
  raw: unknown,
  keys: (keyof T)[],
): T {
  const group: Record<string, ScoreField> = {};
  const rawGroup = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  for (const key of keys) {
    group[key as string] = coerceField(rawGroup[key as string]);
  }
  return group as T;
}

export function normalizeScorecard(raw: unknown): Scorecard {
  const rawObj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  return {
    meddic: coerceFramework<Scorecard['meddic']>(rawObj.meddic, MEDDIC_KEYS),
    bant: coerceFramework<Scorecard['bant']>(rawObj.bant, BANT_KEYS),
    spin: coerceFramework<Scorecard['spin']>(rawObj.spin, SPIN_KEYS),
    overallScore: clampOverall(rawObj.overallScore),
  };
}
