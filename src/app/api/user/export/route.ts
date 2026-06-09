import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { enqueueDataExport } from "@/services/queue";

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserByClerkId(clerkId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const job = await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "gdpr_export_requested",
        entityId: user.id,
        entityType: "user",
        metadata: { requestedAt: new Date().toISOString() },
      },
    });

    const queueJob = await enqueueDataExport(user.id);

    return NextResponse.json(
      {
        jobId: queueJob.id ?? "queued",
        auditId: job.id,
        status: "processing",
        message: "Export started. Poll the status endpoint to check progress.",
      },
      { status: 202 }
    );
  } catch (err) {
    console.error("[/api/user/export POST]", err);
    return NextResponse.json({ error: "Failed to start export" }, { status: 500 });
  }
}
