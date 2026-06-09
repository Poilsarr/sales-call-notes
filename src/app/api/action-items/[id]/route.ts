import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getUserByClerkId } from '@/lib/get-user';
import { logAuditAction } from '@/lib/audit-logger';

const updateActionItemSchema = z.object({
  task: z.string().min(1).max(500).optional(),
  owner: z.string().max(200).optional(),
  due: z.string().nullable().optional(),
  status: z.enum(['PENDING', 'COMPLETED']).optional(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await getUserByClerkId(userId);
    const body = await req.json();

    const parsed = updateActionItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await prisma.actionItem.findUnique({
      where: { id: params.id },
      include: { call: { select: { userId: true, teamId: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Action item not found' }, { status: 404 });
    }

    if (existing.call.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.task !== undefined) data.task = parsed.data.task;
    if (parsed.data.owner !== undefined) data.owner = parsed.data.owner;
    if (parsed.data.due !== undefined) data.due = parsed.data.due;
    if (parsed.data.status !== undefined) {
      data.status = parsed.data.status;
      if (parsed.data.status === 'COMPLETED') {
        data.completedAt = new Date();
      } else {
        data.completedAt = null;
      }
    }

    const item = await prisma.actionItem.update({
      where: { id: params.id },
      data,
    });

    await logAuditAction(user.id, 'UPDATE_ACTION_ITEM', params.id, 'ActionItem', { changes: parsed.data });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Action items PUT error:', error);
    return NextResponse.json({ error: 'Failed to update action item' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await getUserByClerkId(userId);

    const existing = await prisma.actionItem.findUnique({
      where: { id: params.id },
      include: { call: { select: { userId: true, teamId: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Action item not found' }, { status: 404 });
    }

    if (existing.call.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.actionItem.delete({ where: { id: params.id } });

    await logAuditAction(user.id, 'DELETE_ACTION_ITEM', params.id, 'ActionItem');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Action items DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete action item' }, { status: 500 });
  }
}
