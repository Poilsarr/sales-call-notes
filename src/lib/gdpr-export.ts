import { prisma } from "./prisma";

export interface ExportPayload {
  user: any;
  calls: any[];
  actionItems: any[];
  decisions: any[];
  nextSteps: any[];
  comments: any[];
  auditLogs: any[];
  exportedAt: string;
  schemaVersion: string;
}

export async function buildUserExport(userId: string): Promise<ExportPayload> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const callWhere = user.teamId
    ? { OR: [{ userId: user.id }, { teamId: user.teamId }] }
    : { userId: user.id };

  const [calls, actionItems, decisions, nextSteps, comments, auditLogs] =
    await Promise.all([
      prisma.call.findMany({
        where: callWhere,
        select: {
          id: true,
          filename: true,
          audioUrl: true,
          duration: true,
          transcript: true,
          summary: true,
          healthScore: true,
          sentiment: true,
          createdAt: true,
        },
      }),
      prisma.actionItem.findMany({
        where: { call: callWhere },
        select: { id: true, task: true, owner: true, due: true, status: true, createdAt: true, callId: true },
      }),
      prisma.decision.findMany({
        where: { call: callWhere },
        select: { id: true, content: true, category: true, createdAt: true, callId: true },
      }),
      prisma.nextStep.findMany({
        where: { call: callWhere },
        select: { id: true, step: true, date: true, status: true, createdAt: true, callId: true },
      }),
      prisma.callComment.findMany({
        where: { call: callWhere },
        select: { id: true, body: true, createdAt: true, callId: true, userId: true },
      }),
      prisma.auditLog.findMany({
        where: { userId: user.id },
        select: { id: true, action: true, entityId: true, entityType: true, metadata: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
    ]);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      createdAt: user.createdAt,
    },
    calls,
    actionItems,
    decisions,
    nextSteps,
    comments,
    auditLogs,
    exportedAt: new Date().toISOString(),
    schemaVersion: "1.0",
  };
}
