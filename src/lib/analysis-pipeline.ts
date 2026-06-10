import OpenAI from "openai";
import { getSecret } from "@/lib/secrets";

export interface ExtractedItem { task: string; owner: string; due: string; }
export interface DecisionItem { who: string; what: string; by: string; }
export interface NextStepItem { step: string; date: string; owner?: string; }
export interface ScoreField { score: number; evidence: string; }
export interface BANT {
  budget: ScoreField; authority: ScoreField; need: ScoreField; timeline: ScoreField;
}
export interface MEDDIC {
  metrics: ScoreField; economicBuyer: ScoreField; decisionCriteria: ScoreField;
  decisionProcess: ScoreField; identifyPain: ScoreField; champion: ScoreField;
}
export interface Scoring { bant: BANT; meddic: MEDDIC; }
export interface Coaching { strengths: string[]; improvements: string[]; tips: string[]; }
export interface Extracted {
  actionItems: ExtractedItem[]; decisions: DecisionItem[]; nextSteps: NextStepItem[];
}
export interface Enrichment { coaching: Coaching; closeProbability: number; }
export interface AnalysisResult {
  callId: string;
  extracted: Extracted;
  score: Scoring;
  enrichment: Enrichment;
}

let _client: OpenAI | null = null;
function client(): OpenAI {
  if (_client) return _client;
  _client = new OpenAI({
    apiKey: getSecret("OPENAI_API_KEY"),
    timeout: 120000,
    maxRetries: 2,
  });
  return _client;
}

async function callStage(systemPrompt: string, userContent: string): Promise<any> {
  const res = await client().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });
  const text = res.choices?.[0]?.message?.content || "{}";
  try { return JSON.parse(text); } catch { return {}; }
}

const EMPTY_FIELD: ScoreField = { score: 0, evidence: "" };
function emptyBANT(): BANT {
  return { budget: { ...EMPTY_FIELD }, authority: { ...EMPTY_FIELD }, need: { ...EMPTY_FIELD }, timeline: { ...EMPTY_FIELD } };
}
function emptyMEDDIC(): MEDDIC {
  return { metrics: { ...EMPTY_FIELD }, economicBuyer: { ...EMPTY_FIELD }, decisionCriteria: { ...EMPTY_FIELD },
           decisionProcess: { ...EMPTY_FIELD }, identifyPain: { ...EMPTY_FIELD }, champion: { ...EMPTY_FIELD } };
}
function clamp01(n: any): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}
function clamp100(n: any): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 50;
  return Math.max(0, Math.min(100, v));
}
function asArray<T>(v: any, map: (x: any) => T): T[] {
  return Array.isArray(v) ? v.map(map) : [];
}

export async function extractStage(transcript: string): Promise<Extracted> {
  const sys = "Extract action items, decisions, and next steps from this sales-call transcript. " +
    "Return JSON: { actionItems: [{task, owner, due}], decisions: [{who, what, by}], nextSteps: [{step, date, owner}] }";
  const raw = await callStage(sys, transcript);
  return {
    actionItems: asArray(raw.actionItems, (x) => ({ task: String(x?.task || ""), owner: String(x?.owner || ""), due: String(x?.due || "") })),
    decisions: asArray(raw.decisions, (x) => ({ who: String(x?.who || ""), what: String(x?.what || ""), by: String(x?.by || "") })),
    nextSteps: asArray(raw.nextSteps, (x) => ({ step: String(x?.step || ""), date: String(x?.date || ""), owner: x?.owner ? String(x.owner) : undefined })),
  };
}

export async function scoreStage(transcript: string, extracted: Extracted): Promise<Scoring> {
  const sys = "Score this sales call on BANT and MEDDIC from 0.0 to 1.0 with short evidence quotes. " +
    "Return JSON: { bant: {budget, authority, need, timeline}, meddic: {metrics, economicBuyer, decisionCriteria, decisionProcess, identifyPain, champion} } " +
    "where each field is { score: number, evidence: string }.";
  const user = "Transcript:\n" + transcript + "\n\nExtracted items:\n" + JSON.stringify(extracted);
  const raw = await callStage(sys, user);
  const bant = emptyBANT();
  for (const k of Object.keys(bant) as (keyof BANT)[]) {
    if (raw?.bant?.[k]) bant[k] = { score: clamp01(raw.bant[k].score), evidence: String(raw.bant[k].evidence || "") };
  }
  const meddic = emptyMEDDIC();
  for (const k of Object.keys(meddic) as (keyof MEDDIC)[]) {
    if (raw?.meddic?.[k]) meddic[k] = { score: clamp01(raw.meddic[k].score), evidence: String(raw.meddic[k].evidence || "") };
  }
  return { bant, meddic };
}

export async function enrichStage(transcript: string, score: Scoring): Promise<Enrichment> {
  const sys = "Generate sales-coaching notes and a close probability (0-100) for this call. " +
    "Return JSON: { strengths: string[], improvements: string[], tips: string[], closeProbability: number }";
  const user = "Transcript:\n" + transcript + "\n\nScores:\n" + JSON.stringify(score);
  const raw = await callStage(sys, user);
  return {
    coaching: {
      strengths: asArray(raw?.strengths, (s) => String(s)),
      improvements: asArray(raw?.improvements, (s) => String(s)),
      tips: asArray(raw?.tips, (s) => String(s)),
    },
    closeProbability: clamp100(raw?.closeProbability),
  };
}

export async function analysisPipeline(transcript: string, callId: string): Promise<AnalysisResult> {
  const extracted = await extractStage(transcript);
  const score = await scoreStage(transcript, extracted);
  const enrichment = await enrichStage(transcript, score);
  return { callId, extracted, score, enrichment };
}
