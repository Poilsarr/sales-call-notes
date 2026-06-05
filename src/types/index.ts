
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
  detectedLanguage?: string;
  transcriptionConfidence?: number;
  id?: string;
}

export interface SpeakerMetric {
  speaker: string;
  talkRatio: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  questionsAsked: number;
  interruptions: number;
  turns: number;
}

export interface CollaborationComment {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
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
    meddic?: {
      metrics: { score: number; evidence: string };
      economicBuyer: { score: number; evidence: string };
      decisionCriteria: { score: number; evidence: string };
      decisionProcess: { score: number; evidence: string };
      identifyPain: { score: number; evidence: string };
      champion: { score: number; evidence: string };
    };
    bant?: {
      budget: { score: number; evidence: string };
      authority: { score: number; evidence: string };
      need: { score: number; evidence: string };
      timeline: { score: number; evidence: string };
    };
    spin?: {
      situation: { score: number; evidence: string };
      problem: { score: number; evidence: string };
      implication: { score: number; evidence: string };
      needPayoff: { score: number; evidence: string };
    };
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
  language?: string;
  segments?: TranscriptSegment[];
  summary: string;
  actionItems: Result['actionItems'];
  keyDecisions: Result['keyDecisions'];
  nextSteps: Result['nextSteps'];
  healthScore?: number;
  sharedWithTeam?: boolean;
  ownerName?: string | null;
  assigneeName?: string | null;
}
