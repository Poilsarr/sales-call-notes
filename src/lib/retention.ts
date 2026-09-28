import prisma from "@/lib/prisma";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Pure expiry check: true when `createdAt` is older than `days`.
 */
export function isExpired(createdAt: Date, days: number): boolean {
  if (!Number.isFinite(days) || days < 0) return false;
  return Date.now() - createdAt.getTime() > days * MS_PER_DAY;
}

export type PurgeCallDataOptions = {
  callId: string;
  deleteAudio: (url: string) => Promise<unknown>;
  deleteEmbeddings?: (callId: string) => Promise<unknown>;
};

export type PurgeCallDataResult = {
  deleted: string[];
};

/**
 * Orchestrates a full single-call purge: blob audio (best-effort),
 * optional embedding cleanup, then child rows in FK-safe order
 * (children before the parent Call), then the Call row itself.
 *
 * No route/request logic here — callers pass the blob deleter in.
 */
export async function purgeCallData({
  callId,
  deleteAudio,
  deleteEmbeddings,
}: PurgeCallDataOptions): Promise<PurgeCallDataResult> {
  const deleted: string[] = [];

  const call = await prisma.call.findUnique({
    where: { id: callId },
    select: { id: true, audioUrl: true },
  });
  if (!call) return { deleted };

  // Best-effort: a blob outage must never block the row deletion.
  if (call.audioUrl) {
    try {
      await deleteAudio(call.audioUrl);
      deleted.push("blob");
    } catch (e: unknown) {
      console.warn(
        `Blob delete failed (non-fatal): ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  if (deleteEmbeddings) {
    try {
      await deleteEmbeddings(callId);
      deleted.push("embeddings");
    } catch (e: unknown) {
      console.warn(
        `Embedding delete failed (non-fatal): ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  await prisma.callComment.deleteMany({ where: { callId } });
  deleted.push("callComment");
  await prisma.callInsight.deleteMany({ where: { callId } });
  deleted.push("callInsight");
  await prisma.actionItem.deleteMany({ where: { callId } });
  deleted.push("actionItem");
  await prisma.decision.deleteMany({ where: { callId } });
  deleted.push("decision");
  await prisma.nextStep.deleteMany({ where: { callId } });
  deleted.push("nextStep");
  await prisma.speaker.deleteMany({ where: { callId } });
  deleted.push("speaker");
  await prisma.analytics.deleteMany({ where: { callId } });
  deleted.push("analytics");
  await prisma.competitorMention.deleteMany({ where: { callId } });
  deleted.push("competitorMention");
  await prisma.call.delete({ where: { id: callId } });
  deleted.push("call");

  return { deleted };
}
