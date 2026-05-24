
export type ProcessingState = "idle" | "transcribing" | "analyzing" | "done" | "error";

export interface TranscriptSegment {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

export interface Result {
  summary: string;
  transcript: string;
  segments: TranscriptSegment[];
  actionItems: { task: string; owner: string; due: string }[];
  keyDecisions: (string | { who: string; what: string; by: string })[];
  nextSteps: { step: string; date: string }[];
  healthScore?: number;
}

export interface Correction {
  original: string;
  corrected: string;
  type: 'name' | 'company' | 'number' | 'address' | 'email';
  confidence: number;
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscriptionSegment {
  id: number;
  text: string;
  start: number;
  end: number;
  speaker?: string;
  words?: WordTimestamp[];
}

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  wordTimestamps: WordTimestamp[];
  language: string;
  duration: number;
  confidence: number;
  model: string;
}

export interface CompetitorMention {
  id: string;
  callId: string;
  competitor: string;
  context: string | null;
  sentiment: string | null;
  mentionedBy: string | null;
  timestamp: number | null;
  createdAt: string;
  call?: { filename: string; createdAt: string };
}

export interface CallAnalysis {
  executiveSummary: string;
  callType: string;
  participants: Array<{ role: string; name: string; title?: string; talkTime?: number }>;
  keyEntities: Record<string, unknown>;
  competitorsMentioned?: Array<{ name: string; context: string; sentiment: string }>;
  salesScorecard: {
    meddic?: { metrics: number; economicBuyer: number; decisionCriteria: number; decisionProcess: number; identifyPain: number; champion: number };
    bant?: { budget: number; authority: number; need: number; timeline: number };
    spin?: { situation: number; problem: number; implication: number; needPayoff: number };
    overallScore: number;
  };
  stakeholderMap?: Array<{ name: string; role: string; influence: string; sentiment: string; concerns: string[] }>;
  painPoints?: Array<{ description: string; severity: string; quote: string; impact: string }>;
  goals?: Array<{ description: string; timeframe: string; metrics: string }>;
  objections: Array<{ type: string; quote: string; handled?: boolean; resolution?: string; timestamp?: number }>;
  roiAnalysis?: { currentCost: string; projectedSavings: string; paybackPeriod: string; metrics: string[] };
  qualifications?: { isDecisionMaker: boolean; hasBudget: boolean; hasTimeline: boolean; hasPain: boolean; fitScore: number };
  commitments: Array<{ who: string; what: string; by: string }>;
  actionItems: Array<{ task: string; owner: string; priority?: string; due: string }>;
  nextSteps: Array<{ step: string; date: string; owner?: string }>;
  coachingNotes: { strengths: string[]; improvements: string[]; tips: string[] };
  riskFlags: string[];
  closeProbability: number;
  talkRatio: { rep: number; prospect: number };
  sentimentTimeline: Array<{ timestamp: number; sentiment: string }>;
}

export interface CallRecord {
  id: string;
  createdAt: string;
  filename: string;
  transcript: string;
  segments?: TranscriptSegment[];
  summary: string;
  actionItems: Result['actionItems'];
  keyDecisions: Result['keyDecisions'];
  nextSteps: Result['nextSteps'];
  healthScore?: number;
}
