import { prisma } from "./prisma";

export async function logAuditAction(
  userId: string,
  action: string,
  entityId: string | null = null,
  entityType: string | null = null,
  metadata: any = {}
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityId,
        entityType,
        metadata,
      },
    });
  } catch (error) {
    console.error("[AuditLogger] Failed to log action:", error);
  }
}
