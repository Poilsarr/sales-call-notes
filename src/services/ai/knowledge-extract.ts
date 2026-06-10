export type EntityType = "person" | "company" | "product" | "money" | "date";

export interface ExtractedEntity {
  type: EntityType;
  value: string;
  source: "regex" | "llm";
}

export interface ExtractedRelation {
  from: string;
  fromType: EntityType;
  to: string;
  toType: EntityType;
  relation: string;
}

const COMPANY_SUFFIXES = [
  "inc", "inc.", "llc", "ltd", "corp", "corporation", "co", "co.",
  "gmbh", "sa", "ag", "plc", "limited",
];

const PRODUCT_HINTS = /\b(platform|app|software|product|tool|service|solution|system|api)\b/i;
const MONEY_RE = /(?:\$|usd|€|£)\s?(\d[\d,]*(?:\.\d+)?)\s?([kmb])?(?:illion|illion)?\b/gi;
const MONEY_PLAIN_RE = /\b(\d[\d,]*)\s?(dollars?|usd|euros?|pounds?|k\b)\b/gi;
const DATE_RE = /\b(q[1-4]|h[12]|fy\d{2,4}|20\d{2}|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s?(\d{1,2})?(?:,?\s?20\d{2})?\b/gi;

const TITLE_RE = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}),?\s+(CEO|CTO|COO|CFO|CMO|VP|Director|Manager|Head|Engineer|Founder|Owner|President)\b/g;
const NAME_BARE_RE = /\b(?:with|from|to|by|cc|@)\s+([A-Z][a-z]{1,15}(?:\s+[A-Z][a-z]{1,15}){0,2})\b/g;

function isLikelyCompany(s: string): boolean {
  const lower = s.toLowerCase().trim();
  return COMPANY_SUFFIXES.some((suf) => lower.endsWith(" " + suf) || lower === suf);
}

export function extractEntities(text: string): ExtractedEntity[] {
  const out: ExtractedEntity[] = [];
  const seen = new Set<string>();

  const push = (e: ExtractedEntity) => {
    const k = `${e.type}|${e.value.toLowerCase()}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(e);
  };

  let m: RegExpExecArray | null;

  TITLE_RE.lastIndex = 0;
  while ((m = TITLE_RE.exec(text)) !== null) {
    const name = m[1].trim();
    if (name.length >= 3) push({ type: "person", value: name, source: "regex" });
  }

  NAME_BARE_RE.lastIndex = 0;
  while ((m = NAME_BARE_RE.exec(text)) !== null) {
    const name = m[1].trim();
    if (name.length >= 3 && !isLikelyCompany(name)) {
      push({ type: "person", value: name, source: "regex" });
    }
  }

  const companyRe = new RegExp(
    `\\b([A-Z][A-Za-z0-9&]+(?:\\s+[A-Z][A-Za-z0-9&]+){0,3})\\s+(${COMPANY_SUFFIXES.join("|").replace(/\./g, "\\.")})\\b`,
    "gi",
  );
  while ((m = companyRe.exec(text)) !== null) {
    const company = `${m[1]} ${m[2]}`.trim();
    push({ type: "company", value: company, source: "regex" });
  }

  const quotedProductRe = /"([A-Z][\w\s-]{2,40})"/g;
  while ((m = quotedProductRe.exec(text)) !== null) {
    push({ type: "product", value: m[1].trim(), source: "regex" });
  }

  const productRe = /\b([A-Z][\w-]{2,30})\s+(?=[A-Z])/g;
  while ((m = productRe.exec(text)) !== null) {
    const cand = m[1].trim();
    const window = text.slice(Math.max(0, m.index - 40), m.index + 50);
    if (PRODUCT_HINTS.test(window)) {
      push({ type: "product", value: cand, source: "regex" });
    }
  }

  MONEY_RE.lastIndex = 0;
  while ((m = MONEY_RE.exec(text)) !== null) {
    const raw = m[0].trim();
    push({ type: "money", value: raw, source: "regex" });
  }
  MONEY_PLAIN_RE.lastIndex = 0;
  while ((m = MONEY_PLAIN_RE.exec(text)) !== null) {
    push({ type: "money", value: m[0].trim(), source: "regex" });
  }

  DATE_RE.lastIndex = 0;
  while ((m = DATE_RE.exec(text)) !== null) {
    push({ type: "date", value: m[0].trim(), source: "regex" });
  }

  return out;
}

const STOP_ENTITIES = new Set([
  "the", "and", "for", "with", "from", "this", "that", "have", "has",
  "are", "was", "were", "will", "would", "could", "should", "they",
  "them", "you", "your", "our", "their", "his", "her", "its", "team",
  "company", "business", "call", "meeting",
]);

export function extractRelations(
  entities: ExtractedEntity[],
  text: string,
): ExtractedRelation[] {
  const people = entities.filter((e) => e.type === "person");
  const companies = entities.filter((e) => e.type === "company");
  const products = entities.filter((e) => e.type === "product");
  const out: ExtractedRelation[] = [];
  const seen = new Set<string>();

  const push = (r: ExtractedRelation) => {
    if (STOP_ENTITIES.has(r.from.toLowerCase()) || STOP_ENTITIES.has(r.to.toLowerCase())) return;
    if (r.from.toLowerCase() === r.to.toLowerCase()) return;
    const k = `${r.fromType}|${r.from.toLowerCase()}|${r.relation}|${r.toType}|${r.to.toLowerCase()}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(r);
  };

  const lower = text.toLowerCase();

  for (const p of people) {
    for (const c of companies) {
      const pl = p.value.toLowerCase();
      const cl = c.value.toLowerCase();
      const pIdx = lower.indexOf(pl);
      const cIdx = lower.indexOf(cl);
      if (pIdx >= 0 && cIdx >= 0) {
        const dist = Math.abs(pIdx - cIdx);
        if (dist < 120) {
          push({
            from: p.value, fromType: "person",
            to: c.value, toType: "company",
            relation: "works_at",
          });
        }
      }
    }
  }

  for (const c of companies) {
    for (const prod of products) {
      const cl = c.value.toLowerCase();
      const pl = prod.value.toLowerCase();
      const cIdx = lower.indexOf(cl);
      const pIdx = lower.indexOf(pl);
      if (cIdx >= 0 && pIdx >= 0 && Math.abs(cIdx - pIdx) < 120) {
        push({
          from: c.value, fromType: "company",
          to: prod.value, toType: "product",
          relation: "uses",
        });
      }
    }
  }

  return out;
}

export interface BuildGraphInput {
  text: string;
  callId: string;
  userId: string;
}

export interface BuiltGraph {
  entities: Array<{ type: EntityType; value: string; callId: string }>;
  relations: Array<{
    from: string; fromType: EntityType;
    to: string; toType: EntityType;
    relation: string; callId: string;
  }>;
}

export function buildGraphFromText(input: BuildGraphInput): BuiltGraph {
  const entities = extractEntities(input.text);
  const relations = extractRelations(entities, input.text);
  return {
    entities: entities.map((e) => ({ type: e.type, value: e.value, callId: input.callId })),
    relations: relations.map((r) => ({ ...r, callId: input.callId })),
  };
}
