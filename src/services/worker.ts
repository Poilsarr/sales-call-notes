import { Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

const transcriptionWorker = new Worker("transcription", async (job) => {
  const { filePath, userId } = job.data;
  const { spawn } = await import("child_process");
  const { writeFile, unlink } = await import("fs/promises");
  const path = await import("path");

  return new Promise((resolve, reject) => {
    const python = spawn("python3", ["-c", `
import sys
import whisper
model = whisper.load_model("base")
result = model.transcribe("${filePath}")
print(result["text"])
`]);
    let output = "";
    python.stdout.on("data", (d: Buffer) => { output += d.toString(); });
    python.stderr.on("data", (d: Buffer) => { console.error(d.toString()); });
    python.on("close", (code: number) => {
      if (code === 0) resolve(output.trim());
      else reject(new Error("Transcription failed"));
    });
  });
}, { connection });

const analysisWorker = new Worker("analysis", async (job) => {
  const { transcript, callId } = job.data;
  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "minimax-m2:cloud",
      messages: [
        { role: "system", content: "Extract summary, actionItems, keyDecisions, nextSteps from transcript as JSON." },
        { role: "user", content: transcript },
      ],
    }),
  });

  const data = await response.json();
  return { callId, result: data };
}, { connection });

const crmSyncWorker = new Worker("crm-sync", async (job) => {
  const { callId, provider, accessToken } = job.data;
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/calls/${callId}/sync-crm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, accessToken }),
  });

  if (!response.ok) throw new Error("CRM sync failed");
  return response.json();
}, { connection });

export { transcriptionWorker, analysisWorker, crmSyncWorker };
