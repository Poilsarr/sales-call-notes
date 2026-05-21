
export type ProcessingState = "idle" | "transcribing" | "analyzing" | "done" | "error";

export interface Result {
  summary: string;
  actionItems: { task: string; owner: string; due: string }[];
  keyDecisions: string[];
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

export interface CallRecord {
  id: string;
  createdAt: string;
  filename: string;
  summary: string;
  actionItems: Result['actionItems'];
  keyDecisions: Result['keyDecisions'];
  nextSteps: Result['nextSteps'];
  healthScore?: number;
}
