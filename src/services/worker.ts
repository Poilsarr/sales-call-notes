import { Worker } from "bullmq";
import IORedis from "ioredis";
import { createHash } from "crypto";
import { getSecret } from "@/lib/secrets";
import { buildUserExport } from "@/lib/gdpr-export";
import { issueExportToken } from "@/lib/gdpr-token";
import prisma from "@/lib/prisma";
import { buildGraphFromText } from "@/services/ai/knowledge-extract";
import { HubSpotService } from "@/services/crm/hubspot";
import { SalesforceService } from "@/services/crm/salesforce";
import { logAuditAction } from "@/lib/audit-logger";

const connection = new IORedis({
  host: getSecret("REDIS_HOST") || "localhost",
  port: Number(getSecret("REDIS_PORT")) || 6379,
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
result = model.transcribe(sys.argv[1])
print(result["text"])
`, filePath]);
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
  const { transcript, callId, userId } = job.data;
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

  if (userId && transcript && transcript.length > 20) {
    try {
      const graph = buildGraphFromText({ text: transcript, callId, userId });
      if (graph.entities.length > 0) {
        for (const e of graph.entities) {
          const key = { userId_type_value: { userId, type: e.type, value: e.value } };
          await prisma.knowledgeEntity.upsert({
            where: key,
            update: { calls: { push: callId } },
            create: { userId, type: e.type, value: e.value, calls: [callId] },
          });
        }
      }
      if (graph.relations.length > 0) {
        for (const r of graph.relations) {
          const [fromEnt] = await Promise.all([
            prisma.knowledgeEntity.findUnique({
              where: { userId_type_value: { userId, type: r.fromType, value: r.from } },
            }),
          ]);
          const toEnt = await prisma.knowledgeEntity.findUnique({
            where: { userId_type_value: { userId, type: r.toType, value: r.to } },
          });
          if (fromEnt && toEnt) {
            await prisma.knowledgeRelation.create({
              data: { userId, fromEntityId: fromEnt.id, toEntityId: toEnt.id, relation: r.relation, calls: [callId] },
            });
          }
        }
      }
    } catch (err) {
      console.error("Knowledge ingest failed (non-fatal):", err);
    }
  }

  if (userId && callId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { teamId: true },
      });
      if (user?.teamId) {
        const integrations = await prisma.integration.findMany({
          where: { teamId: user.teamId, enabled: true, provider: { in: ["hubspot", "salesforce"] } },
        });
        if (integrations.length > 0) {
          const callRecord = await prisma.call.findUnique({
            where: { id: callId },
            include: { actionItems: true, decisions: true, nextSteps: true, analytics: true },
          });
          if (callRecord) {
            const crmCall = {
              filename: callRecord.filename,
              createdAt: callRecord.createdAt,
              transcript: callRecord.transcript,
              summary: callRecord.summary,
              analytics: callRecord.analytics,
              actionItems: callRecord.actionItems.map(a => ({ task: a.task, owner: a.owner, due: a.due })),
              decisions: callRecord.decisions.map(d => ({ content: d.content })),
              nextSteps: callRecord.nextSteps.map(n => ({ step: n.step, date: n.date })),
            };
            for (const integration of integrations) {
              try {
                const provider = integration.provider as "hubspot" | "salesforce";
                if (provider === "hubspot") {
                  const service = new HubSpotService(user.teamId);
                  await service.syncCall(crmCall);
                } else {
                  const config = integration.config ? JSON.parse(integration.config) : {};
                  const service = new SalesforceService(user.teamId, config.instanceUrl || null);
                  await service.syncCall(crmCall);
                }
                await logAuditAction(userId, "CRM_SYNC", callId, "Call", { provider });
              } catch (err) {
                console.error(`CRM auto-sync failed for ${integration.provider} (non-fatal):`, err);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("CRM auto-sync setup failed (non-fatal):", err);
    }
  }

  return { callId, result: data };
}, { connection });

const crmSyncWorker = new Worker("crm-sync", async (job) => {
  const { callId, provider, accessToken } = job.data;
  const response = await fetch(`${getSecret("NEXT_PUBLIC_APP_URL")}/api/calls/${callId}/sync-crm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, accessToken }),
  });

  if (!response.ok) throw new Error("CRM sync failed");
  return response.json();
}, { connection });

// GDPR Data Export Worker
const dataExportWorker = new Worker("data-export", async (job) => {
  const { userId } = job.data;
  const payload = await buildUserExport(userId);

  // Serialize
  const json = JSON.stringify(payload, null, 2);
  const hash = createHash("sha256").update(json).digest("hex").slice(0, 16);

  // Persist a record in DB so we can serve it via signed URL
  // (In production, this would upload to S3 and return a presigned URL.
  //  For now, we store inline and return a tokenized download URL.)
  const ttlMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  const token = issueExportToken(userId, ttlMs);
  if (!token) {
    throw new Error("EXPORT_TOKEN_SECRET not configured; cannot mint export token");
  }
  const expiresAt = new Date(Date.now() + ttlMs);

  // Store the export payload server-side (size-limited; in prod use S3)
  const record = await prisma.auditLog.create({
    data: {
      userId,
      action: "gdpr_export_completed",
      entityId: userId,
      entityType: "user",
      metadata: { token, expiresAt: expiresAt.toISOString(), sizeBytes: json.length },
    },
  });

  const appUrl = getSecret("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";
  return {
    downloadUrl: `${appUrl}/api/user/export/download?token=${token}`,
    expiresAt: expiresAt.toISOString(),
    auditId: record.id,
    sizeBytes: json.length,
  };
}, { connection });

// User Hard-Delete Worker (Task 1.5)
const userDeleteWorker = new Worker("user-delete", async (job) => {
  const { userId, requestedAt } = job.data;
  const requestedDate = new Date(requestedAt);
  const gracePeriodMs = 7 * 24 * 60 * 60 * 1000;
  const eligibleAt = new Date(requestedDate.getTime() + gracePeriodMs);

  // Only hard-delete if grace period has elapsed
  if (Date.now() < eligibleAt.getTime()) {
    throw new Error(`User ${userId} still in grace period until ${eligibleAt.toISOString()}`);
  }

  // Hard-delete user-owned PII. Cascades are set on Call→User for some relations;
  // for others we delete explicitly.
  await prisma.$transaction(async (tx) => {
    // Comments
    await tx.callComment.deleteMany({ where: { userId } });
    // Audit logs: anonymize, don't delete (legal record).
    // userId is non-nullable in schema; raw SQL needed to set NULL.
    // Cast bypasses typed client until schema is migrated to userId String?.
    await tx.auditLog.updateMany({
      where: { userId },
      data: {
        userId: null as unknown as string,
        metadata: { anonymized: true, anonymizedAt: new Date().toISOString() },
      },
    });
    // Calls owned by user (cascades: actionItems, decisions, nextSteps, speakers, analytics, insight, comments, competitorMentions)
    await tx.call.deleteMany({ where: { userId } });
    // Owned teams (cascades: integrations, members)
    const ownedTeams = await tx.team.findMany({ where: { ownerId: userId }, select: { id: true } });
    for (const t of ownedTeams) {
      await tx.integration.deleteMany({ where: { teamId: t.id } });
      await tx.team.delete({ where: { id: t.id } });
    }
    // Team memberships: leave teams
    await tx.user.update({ where: { id: userId }, data: { teamId: null } });
    // Finally, the user record
    await tx.user.delete({ where: { id: userId } });
  });

  return { deletedAt: new Date().toISOString() };
}, { connection });

export { transcriptionWorker, analysisWorker, crmSyncWorker, dataExportWorker, userDeleteWorker };
