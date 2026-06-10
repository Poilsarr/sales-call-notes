import { Queue } from "bullmq";
import IORedis from "ioredis";
import { getSecret } from "@/lib/secrets";

const connection = new IORedis({
  host: getSecret("REDIS_HOST") || "localhost",
  port: Number(getSecret("REDIS_PORT")) || 6379,
  maxRetriesPerRequest: null,
});

export const transcriptionQueue = new Queue("transcription", { connection });
export const analysisQueue = new Queue("analysis", { connection });
export const analysisScoreQueue = new Queue("analysis-score", { connection });
export const analysisEnrichQueue = new Queue("analysis-enrich", { connection });
export const crmSyncQueue = new Queue("crm-sync", { connection });

export async function enqueueTranscription(filePath: string, userId: string) {
  return transcriptionQueue.add("transcribe", { filePath, userId }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
}

export async function enqueueAnalysis(transcript: string, callId: string, userId: string) {
  return analysisQueue.add("analyze", { transcript, callId, userId }, {
    attempts: 2,
    backoff: { type: "fixed", delay: 3000 },
  });
}

export async function enqueueAnalysisScore(transcript: string, callId: string, extracted: unknown) {
  return analysisScoreQueue.add("score", { transcript, callId, extracted }, {
    attempts: 2,
    backoff: { type: "fixed", delay: 2000 },
  });
}

export async function enqueueAnalysisEnrich(transcript: string, callId: string, score: unknown) {
  return analysisEnrichQueue.add("enrich", { transcript, callId, score }, {
    attempts: 2,
    backoff: { type: "fixed", delay: 2000 },
  });
}

export async function enqueueCrmSync(callId: string, provider: string, accessToken: string) {
  return crmSyncQueue.add("sync-crm", { callId, provider, accessToken }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
}
