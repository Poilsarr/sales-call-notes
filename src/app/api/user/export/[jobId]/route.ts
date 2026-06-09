import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { exportQueue } from "@/services/queue";

export async function GET(
  _req: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserByClerkId(clerkId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const job = await exportQueue.getJob(params.jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found or expired", jobId: params.jobId },
        { status: 404 }
      );
    }

    const state = await job.getState();
    const result = job.returnvalue as { downloadUrl?: string; expiresAt?: string } | undefined;

    // Verify ownership
    if (job.data?.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      jobId: params.jobId,
      state,
      progress: state === "completed" ? 100 : state === "failed" ? 0 : 50,
      downloadUrl: result?.downloadUrl ?? null,
      expiresAt: result?.expiresAt ?? null,
    });
  } catch (err) {
    console.error("[/api/user/export/[jobId] GET]", err);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
