import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { canAccessCall, canManageCall } from '@/lib/call-access';
import { getUserByClerkId } from '@/lib/get-user';
import { logAuditAction } from '@/lib/audit-logger';
import { validateTitle } from '@/lib/call-title';
import { cacheDel, makeCacheKey } from '@/lib/cache';
import { del as blobDel } from '@vercel/blob';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const viewer = await getUserByClerkId(clerkUserId);

    const call = await prisma.call.findUnique({
      where: { id },
      include: {
        insight: true,
        actionItems: true,
        decisions: true,
        nextSteps: true,
        speakers: true,
        analytics: true,
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    if (!canAccessCall(viewer, call)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      ...call,
      canManageCollaboration: canManageCall(viewer, call),
      comments: call.comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        author: comment.user,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch call' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const viewer = await getUserByClerkId(clerkUserId);

    const call = await prisma.call.findUnique({
      where: { id },
      select: { id: true, userId: true, teamId: true, sharedWithTeam: true },
    });
    if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    if (!canAccessCall(viewer, call)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { body } = await req.json();
    if (!body || typeof body !== 'string' || !body.trim()) {
      return NextResponse.json({ error: 'Comment body is required' }, { status: 400 });
    }

    const comment = await prisma.callComment.create({
      data: {
        callId: id,
        userId: viewer.id,
        body: body.trim(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      author: comment.user,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save comment' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const viewer = await getUserByClerkId(clerkUserId);

    const call = await prisma.call.findUnique({
      where: { id },
      select: { id: true, userId: true, teamId: true, sharedWithTeam: true },
    });
    if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    if (!canManageCall(viewer, call)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { sharedWithTeam, assigneeId, title } = body;
    if (sharedWithTeam === true && !call.teamId) {
      return NextResponse.json({ error: 'Only team calls can be shared' }, { status: 400 });
    }

    const titleValidation = validateTitle(title);
    if (!titleValidation.ok) {
      return NextResponse.json({ error: titleValidation.error }, { status: 400 });
    }

    let nextAssigneeId = assigneeId;
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
      if (!assignee || assignee.teamId !== call.teamId) {
        return NextResponse.json({ error: 'Assignee must be on the same team' }, { status: 400 });
      }
    }

    if (assigneeId === null) nextAssigneeId = null;

    const updated = await prisma.call.update({
      where: { id },
      data: {
        ...(typeof sharedWithTeam === 'boolean' ? { sharedWithTeam } : {}),
        ...(assigneeId !== undefined ? { assigneeId: nextAssigneeId } : {}),
        ...(title !== undefined ? { title: titleValidation.value } : {}),
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Invalidate cached GET /api/calls/[id] (300s TTL). The list cache
    // (60s, query-parameterized) self-expires; accept ≤60s staleness there.
    await cacheDel(makeCacheKey('calls', viewer.id, id));

    return NextResponse.json({
      sharedWithTeam: updated.sharedWithTeam,
      assignee: updated.assignee,
      title: updated.title,
      displayName: updated.title || updated.filename,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update collaboration settings' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const viewer = await getUserByClerkId(clerkUserId);

    const call = await prisma.call.findUnique({
      where: { id },
      select: { id: true, userId: true, teamId: true, sharedWithTeam: true, audioUrl: true },
    });
    if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    if (!canManageCall(viewer, call)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Purge the audio blob too. Best-effort: a blob outage must never block
    // the row deletion, so log and continue (same pattern as analyze/route.ts:604).
    if (call.audioUrl) {
      try {
        await blobDel(call.audioUrl);
      } catch (e: any) {
        console.warn(`Blob delete failed (non-fatal): ${e?.message}`);
      }
    }

    await prisma.callComment.deleteMany({ where: { callId: id } });
    await prisma.callInsight.deleteMany({ where: { callId: id } });
    await prisma.actionItem.deleteMany({ where: { callId: id } });
    await prisma.decision.deleteMany({ where: { callId: id } });
    await prisma.nextStep.deleteMany({ where: { callId: id } });
    await prisma.speaker.deleteMany({ where: { callId: id } });
    await prisma.analytics.deleteMany({ where: { callId: id } });
    await prisma.call.delete({ where: { id } });

    await logAuditAction(viewer.id, 'DELETE_CALL', id, 'Call', {
      userId: call.userId,
      teamId: call.teamId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete call" }, { status: 500 });
  }
}
