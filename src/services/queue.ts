import { Queue } from "bullmq";
import { getSecret } from "@/lib/secrets";

// ponytail: pass RedisOptions to BullMQ (it owns the connection).
// Avoids ioredis/bullmq version-skew TS error (ioredis 5.11 vs bullmq 5.10 type).
const connection = {
  host: getSecret("REDIS_HOST") || "localhost",
  port: Number(getSecret("REDIS_PORT")) || 6379,
  maxRetriesPerRequest: null,
};

const redisDisabled =
  getSecret("REDIS_HOST")?.toLowerCase() === "disabled" ||
  getSecret("REDIS_PORT") === "0";

// Build and local smoke-test paths intentionally run without Redis. Creating
// BullMQ clients at module load would otherwise emit connection errors for
// every imported API route, even though no queue operation is being used.
const disabledQueue = {
  add: async () => {
    throw new Error("Redis is disabled; queue operations are unavailable");
  },
} as unknown as Queue;

function makeQueue(name: string): Queue {
  return redisDisabled ? disabledQueue : new Queue(name, { connection });
}

export const transcriptionQueue = makeQueue("transcription");
export const analysisQueue = makeQueue("analysis");
export const analysisScoreQueue = makeQueue("analysis-score");
export const analysisEnrichQueue = makeQueue("analysis-enrich");
export const crmSyncQueue = makeQueue("crm-sync");
export const exportQueue = makeQueue("data-export");

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

export async function enqueueDataExport(userId: string) {
  return exportQueue.add("export", { userId }, {
    attempts: 2,
    backoff: { type: "fixed", delay: 5000 },
  });
}
