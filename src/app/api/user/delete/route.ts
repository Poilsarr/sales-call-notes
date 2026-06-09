import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { enqueueUserDelete } from "@/services/queue";
import { logAuditAction } from "@/lib/audit-logger";

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserByClerkId(clerkId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Soft-delete: anonymize PII fields immediately, schedule hard-delete.
    // Anonymize in place so the user record still exists to prevent the worker
    // from re-queueing and to preserve foreign-key integrity until grace expires.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: `deleted-${user.id}@anonymized.local`,
        name: null,
        avatar: null,
        clerkId: `deleted_${user.id}_${Date.now()}`,
        paddleCustomerId: null,
        paddleSubscriptionId: null,
      },
    });

    await logAuditAction(user.id, "gdpr_delete_requested", user.id, "user", {
      requestedAt: new Date().toISOString(),
      gracePeriodEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const job = await enqueueUserDelete(user.id);

    return NextResponse.json(
      {
        status: "scheduled",
        jobId: job.id ?? "queued",
        gracePeriodDays: 7,
        hardDeleteAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        message:
          "Account PII anonymized. Hard-delete scheduled in 7 days. " +
          "Sign in within 7 days to cancel.",
      },
      { status: 202 }
    );
  } catch (err) {
    console.error("[/api/user/delete POST]", err);
    return NextResponse.json({ error: "Failed to schedule deletion" }, { status: 500 });
  }
}
