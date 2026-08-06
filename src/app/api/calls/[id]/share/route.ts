import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { canManageCall } from '@/lib/call-access';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const call = await prisma.call.findUnique({ where: { id: params.id } });
    if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });

    const viewer = { id: user.id, teamId: user.teamId, teamRole: user.teamRole };
    if (!canManageCall(viewer, call)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.call.update({
      where: { id: params.id },
      data: { isPublic: !call.isPublic },
      select: { isPublic: true },
    });

    const shareUrl = updated.isPublic ? `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/share/${params.id}` : null;

    return NextResponse.json({ isPublic: updated.isPublic, shareUrl });
  } catch (err) {
    console.error('Toggle share error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
