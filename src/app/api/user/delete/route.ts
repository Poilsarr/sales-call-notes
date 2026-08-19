import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { logAuditAction } from "@/lib/audit-logger";
import { captureApiError } from "@/lib/sentry";
import { del as blobDel } from "@vercel/blob";

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserByClerkId(clerkId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Soft-delete: anonymize ALL PII immediately, including BYOK keys, then
    // hard-purge inline. The previous enqueueUserDelete had no live consumer
    // (userDeleteWorker is never instantiated), so jobs sat in Redis and the
    // hard delete never ran — hence the inline purge (SECURITY-HARDENING-PLAN W-B).
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: `deleted-${user.id}@anonymized.local`,
        name: null,
        avatar: null,
        clerkId: `deleted_${user.id}_${Date.now()}`,
        paddleCustomerId: null,
        paddleSubscriptionId: null,
        byokOpenaiKey: null,
        byokGroqKey: null,
      },
    });

    await logAuditAction(user.id, "gdpr_delete_requested", user.id, "user", {
      requestedAt: new Date().toISOString(),
    });

    try {
      // Best-effort blob purge: a blob outage must never block the account purge.
      const calls = await prisma.call.findMany({
        where: { userId: user.id },
        select: { id: true, audioUrl: true },
      });
      const callIds = calls.map((c) => c.id);

      for (const call of calls) {
        if (call.audioUrl) {
          try {
            await blobDel(call.audioUrl);
          } catch (e: any) {
            console.warn(`Blob delete failed (non-fatal): ${e?.message}`);
          }
        }
      }

      const ownedTeams = await prisma.team.findMany({
        where: { ownerId: user.id },
        select: { id: true },
      });
      const ownedTeamIds = ownedTeams.map((t) => t.id);

      // FK-safe order, verified in migrations. Call children with RESTRICT FKs
      // must precede the call rows (ActionItem/Decision/NextStep/Speaker/
      // Analytics callId RESTRICT, 20260501000000_init/migration.sql:283-291;
      // Call.userId RESTRICT, 20260806000002_schema_reconcile/migration.sql:49).
      // Owned teams must precede the user (Team.ownerId RESTRICT, init:279);
      // deleting a team is safe with members present because User_teamId_fkey
      // is ON DELETE SET NULL (20260626132842.../migration.sql:82), and
      // VocabularyEntry/Integration teamId FKs are RESTRICT (init:293,
      // reconcile:52) so their rows are removed first. AuditLog.userId is
      // ON DELETE SET NULL (init:297) — rows retained as the legal record.
      await prisma.$transaction(async (tx) => {
        await tx.callComment.deleteMany({ where: { callId: { in: callIds } } });
        await tx.callInsight.deleteMany({ where: { callId: { in: callIds } } });
        await tx.actionItem.deleteMany({ where: { callId: { in: callIds } } });
        await tx.decision.deleteMany({ where: { callId: { in: callIds } } });
        await tx.nextStep.deleteMany({ where: { callId: { in: callIds } } });
        await tx.speaker.deleteMany({ where: { callId: { in: callIds } } });
        await tx.analytics.deleteMany({ where: { callId: { in: callIds } } });
        await tx.competitorMention.deleteMany({ where: { callId: { in: callIds } } });
        await tx.call.deleteMany({ where: { userId: user.id } });
        await tx.apiKey.deleteMany({ where: { userId: user.id } });
        await tx.notification.deleteMany({ where: { userId: user.id } });
        // Knowledge graph rows store the DB user.id (no FK) — write site at
        // analyze/route.ts:132 + 440-474.
        await tx.knowledgeEntity.deleteMany({ where: { userId: user.id } });
        await tx.knowledgeRelation.deleteMany({ where: { userId: user.id } });
        await tx.rateLimit.deleteMany({ where: { userId: user.id } });
        await tx.vocabularyEntry.deleteMany({ where: { teamId: { in: ownedTeamIds } } });
        await tx.integration.deleteMany({ where: { teamId: { in: ownedTeamIds } } });
        await tx.team.deleteMany({ where: { ownerId: user.id } });
        await tx.user.delete({ where: { id: user.id } });
      });
    } catch (err) {
      // The account is already anonymized above; surface the failed purge so
      // the user knows stored data was NOT fully removed (settings UI shows
      // `error` on !res.ok, settings/page.tsx:185-188).
      console.error("[/api/user/delete POST] hard purge failed", err);
      captureApiError("/api/user/delete", err, { method: "POST" });
      return NextResponse.json(
        {
          error:
            "Account anonymized, but a full data purge failed. Our team has been notified; contact support to finish deletion.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "deleted",
      message: "Account anonymized and stored data purged.",
    });
  } catch (err) {
    console.error("[/api/user/delete POST]", err);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
