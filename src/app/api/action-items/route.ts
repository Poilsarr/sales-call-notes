import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getUserByClerkId } from '@/lib/get-user';

const createActionItemSchema = z.object({
  task: z.string().min(1, 'Task is required').max(500),
  owner: z.string().max(200).default(''),
  due: z.string().nullable().optional(),
  callId: z.string().optional(),
});

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await getUserByClerkId(userId);

    const items = await prisma.actionItem.findMany({
      where: user.teamId
        ? {
            call: {
              teamId: user.teamId,
            },
          }
        : {
            call: {
              userId: user.id,
            },
          },
      include: {
        call: { select: { id: true, filename: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Action items GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch action items' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await getUserByClerkId(userId);
    const body = await req.json();

    const parsed = createActionItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { task, owner, due, callId } = parsed.data;

    let targetCallId = callId || (await getDefaultCall(user.id));

    if (callId) {
      const targetCall = await prisma.call.findUnique({
        where: { id: callId },
        select: { userId: true, teamId: true, sharedWithTeam: true },
      });
      const ownCall = targetCall?.userId === user.id;
      const teamSharedCall = Boolean(
        targetCall?.sharedWithTeam && user.teamId && targetCall.teamId === user.teamId,
      );
      if (!targetCall || (!ownCall && !teamSharedCall)) {
        return NextResponse.json({ error: 'Call not found' }, { status: 404 });
      }
    }

    const item = await prisma.actionItem.create({
      data: {
        task,
        owner,
        due: due || null,
        callId: targetCallId,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Action items POST error:', error);
    return NextResponse.json({ error: 'Failed to create action item' }, { status: 500 });
  }
}

async function getDefaultCall(userId: string): Promise<string> {
  const call = await prisma.call.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  if (!call) {
    throw new Error('No calls found. Create a call first.');
  }
  return call.id;
}
