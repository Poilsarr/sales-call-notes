import * as fs from "fs";
import * as path from "path";

export type PromptTemplateId =
  | "enrollment-calls"
  | "b2b-sales"
  | "discovery-calls"
  | "sales-bant"
  | "sales-meddic"
  | "recruiter-fit"
  | "journalist-interview";

export type PromptTemplate = {
  id: PromptTemplateId;
  name: string;
  vertical: "sales" | "recruiting" | "journalism" | "education" | "general";
  description: string;
  recommendedFor: string;
};

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "enrollment-calls",
    name: "Enrollment Calls",
    vertical: "education",
    description: "Default analysis: enrollment/admissions call insights.",
    recommendedFor: "Admissions reps and education enrollment teams.",
  },
  {
    id: "b2b-sales",
    name: "B2B Sales (Enterprise)",
    vertical: "sales",
    description: "MEDDIC + BANT + SPIN for enterprise SaaS deals.",
    recommendedFor: "Enterprise AEs working multi-stakeholder deals.",
  },
  {
    id: "discovery-calls",
    name: "Discovery Calls",
    vertical: "sales",
    description: "SPIN + BANT qualification focused on needs assessment.",
    recommendedFor: "SDRs running first-call qualification.",
  },
  {
    id: "sales-bant",
    name: "Sales — BANT Scorecard",
    vertical: "sales",
    description: "BANT (Budget, Authority, Need, Timeline) scorecard with evidence.",
    recommendedFor: "Inside sales teams using BANT qualification.",
  },
  {
    id: "sales-meddic",
    name: "Sales — MEDDIC Scorecard",
    vertical: "sales",
    description: "MEDDIC scorecard, stakeholder map, close probability, champion ID.",
    recommendedFor: "Enterprise AEs running complex deals with champions.",
  },
  {
    id: "recruiter-fit",
    name: "Recruiter — Candidate Fit",
    vertical: "recruiting",
    description: "Candidate fit score, technical signals, culture signals, recommendation.",
    recommendedFor: "Recruiters screening candidates by phone.",
  },
  {
    id: "journalist-interview",
    name: "Journalist — Interview Analysis",
    vertical: "journalism",
    description: "Quotable quotes, story angles, fact-check items, sensitive-material flags.",
    recommendedFor: "Journalists and editors working interview transcripts.",
  },
];

const PROMPTS_DIR = path.resolve(process.cwd(), "src/lib/prompts");

export async function loadPromptTemplate(id: PromptTemplateId): Promise<string> {
  const filePath = path.join(PROMPTS_DIR, `${id}.md`);
  return fs.promises.readFile(filePath, "utf-8");
}

export function isValidTemplate(id: string): id is PromptTemplateId {
  return PROMPT_TEMPLATES.some((t) => t.id === id);
}
