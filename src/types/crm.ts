export type CRMCall = {
  filename: string;
  createdAt: Date;
  transcript: string | null;
  summary: string | null;
  sentiment?: string | null;
  analytics?: {
    budgetMentioned?: boolean;
    timelineMentioned?: boolean;
    decisionMakerPresent?: boolean;
    talkRatio?: string | null;
    sentiment?: string | null;
  } | null;
  actionItems: Array<{
    task: string;
    owner: string;
    due: string | null;
  }>;
  decisions: Array<{
    content: string;
  }>;
  nextSteps: Array<{
    step: string;
    date: string | null;
  }>;
  salesScorecard?: any;
};
