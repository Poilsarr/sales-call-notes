export type ObjectionType =
  | "price"
  | "timing"
  | "authority"
  | "need"
  | "trust"
  | "competitor"
  | "stall";

export interface DetectedObjection {
  text: string;
  type: ObjectionType;
  timestamp: number;
  speaker?: string;
  confidence: number;
}

interface Rule {
  type: ObjectionType;
  patterns: RegExp[];
}

const RULES: Rule[] = [
  {
    type: "price",
    patterns: [
      /\btoo (expensive|costly|pricey)\b/gi,
      /\b(costs?|price[ds]?) (too much|too high|out of (?:range|budget))\b/gi,
      /\b(can'?t|cannot|couldn'?t) (afford|justify (?:the )?(?:cost|price|investment))\b/gi,
      /\bbudget (issue|constraint|problem|concern)s?\b/gi,
    ],
  },
  {
    type: "timing",
    patterns: [
      /\bneed (more time|to think|to discuss|to (?:sleep on|consider))\b/gi,
      /\bnot (the right|ready|a good) time\b/gi,
      /\bcome back (later|next quarter|next (?:month|year))\b/gi,
      /\blater (this|next) (?:quarter|month|year)\b/gi,
    ],
  },
  {
    type: "authority",
    patterns: [
      /\bneed to (check|ask|run it by|talk to) (my )?(?:boss|manager|director|vp|team|board)\b/gi,
      /\bnot (the (?:right )?person|authorized|a (?:decision[- ]?maker))\b/gi,
      /\b(circle back|loop in)\b/gi,
    ],
  },
  {
    type: "need",
    patterns: [
      /\bnot (sure|convinced|interested|persuaded)\b/gi,
      /\bdon'?t (really )?(?:see|need|have) (?:a |the )?(?:need|value|use case|fit)\b/gi,
      /\b(problem is|issue is) we (already|currently)\b/gi,
    ],
  },
  {
    type: "trust",
    patterns: [
      /\b(worried|concerned) about\b/gi,
      /\bhesitant\b/gi,
      /\b(risk|risky|risks?)\b/gi,
      /\b(security|compliance|privacy) concerns?\b/gi,
    ],
  },
  {
    type: "competitor",
    patterns: [
      /\b(using|evaluating|looking at|considering|talking to) (your )?competitors?\b/gi,
      /\b(also|already) (talking|evaluating|using) (?:to )?(?:another|some other|other|alternative)\b/gi,
      /\b(alternative|competitor|vendor|provider) (?:is|are|was|were)\b/gi,
    ],
  },
  {
    type: "stall",
    patterns: [
      /\bsend (me|us) (some )?(?:info|information|details|deck|pricing)\b/gi,
      /\bfollow up (?:next|this|later)\b/gi,
      /\bno (?:need|rush|time) (?:right )?now\b/gi,
      /\b(let'?s|we'?ll) (revisit|reconnect) (?:later|next|soon)\b/gi,
    ],
  },
];

export function detectObjectionsByRules(
  text: string,
  getTimestamp: (matchIndex: number) => number = () => 0,
): DetectedObjection[] {
  const out: DetectedObjection[] = [];
  const seen = new Set<string>();

  for (const rule of RULES) {
    for (const pat of rule.patterns) {
      pat.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pat.exec(text)) !== null) {
        const raw = m[0].trim();
        const key = `${raw.toLowerCase()}|${rule.type}`;
        if (seen.has(key)) {
          if (m.index === pat.lastIndex) pat.lastIndex++;
          continue;
        }
        seen.add(key);
        out.push({
          text: raw,
          type: rule.type,
          timestamp: getTimestamp(m.index),
          confidence: 0.85,
        });
        if (m.index === pat.lastIndex) pat.lastIndex++;
      }
    }
  }

  out.sort((a, b) => a.timestamp - b.timestamp);
  return out;
}

const VALID_TYPES: ObjectionType[] = [
  "price",
  "timing",
  "authority",
  "need",
  "trust",
  "competitor",
  "stall",
];

export function validateLlmDetected(input: unknown): DetectedObjection[] {
  if (!Array.isArray(input)) return [];
  const out: DetectedObjection[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const it = item as Record<string, unknown>;
    const text = typeof it.text === "string" ? it.text.trim() : "";
    const type = it.type;
    const ts = Number(it.timestamp);
    if (!text) continue;
    if (typeof type !== "string" || !VALID_TYPES.includes(type as ObjectionType)) continue;
    if (!Number.isFinite(ts) || ts < 0) continue;
    out.push({
      text,
      type: type as ObjectionType,
      timestamp: ts,
      speaker: typeof it.speaker === "string" ? it.speaker : undefined,
      confidence: typeof it.confidence === "number" ? Math.max(0, Math.min(1, it.confidence)) : 0.6,
    });
  }
  return out;
}

export interface DetectionInput {
  text: string;
  getTimestamp?: (matchIndex: number) => number;
  llmDetected?: unknown;
}

export function detectObjections(input: DetectionInput): DetectedObjection[] {
  const ruleHits = detectObjectionsByRules(input.text, input.getTimestamp);
  const llmHits = validateLlmDetected(input.llmDetected);
  const seen = new Set<string>();
  const merged: DetectedObjection[] = [];
  for (const o of [...ruleHits, ...llmHits]) {
    const key = `${o.text.toLowerCase()}|${o.type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(o);
  }
  merged.sort((a, b) => a.timestamp - b.timestamp);
  return merged;
}
