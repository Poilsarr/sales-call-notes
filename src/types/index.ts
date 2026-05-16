
export type ProcessingState = "idle" | "transcribing" | "analyzing" | "done" | "error";

export interface Result {
  summary: string;
  actionItems: { task: string; owner: string; due: string }[];
  keyDecisions: string[];
  nextSteps: { step: string; date: string }[];
  healthScore?: number;
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
