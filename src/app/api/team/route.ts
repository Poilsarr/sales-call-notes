import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        team: {
          include: {
            members: {
              select: { id: true, name: true, email: true, teamRole: true, avatar: true },
            },
          },
        },
      },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const members = user.team?.members ?? [];
    const teamName = user.team?.name ?? null;
    const slug = user.team?.slug ?? null;

    return NextResponse.json({ members, teamName, slug });
  } catch (error: any) {
    console.error('Team GET error:', error?.message);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const inviter = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!inviter) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (inviter.teamRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can invite members' }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found — they need to sign up first' }, { status: 404 });
    }

    if (targetUser.teamId) {
      return NextResponse.json({ error: 'User is already on a team' }, { status: 409 });
    }

    let team = inviter.teamId
      ? await prisma.team.findUnique({ where: { id: inviter.teamId } })
      : null;

    if (!team) {
      team = await prisma.team.create({
        data: {
          name: `${inviter.name ?? inviter.email}'s Team`,
          slug: `team-${inviter.id}`,
          ownerId: inviter.id,
        },
      });
      await prisma.user.update({
        where: { id: inviter.id },
        data: { teamId: team.id, teamRole: 'ADMIN' },
      });
    }

    await prisma.user.update({
      where: { id: targetUser.id },
      data: { teamId: team.id, teamRole: 'MEMBER' },
    });

    const updatedTeam = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        members: {
          select: { id: true, name: true, email: true, teamRole: true, avatar: true },
        },
      },
    });

    return NextResponse.json({
      message: 'Member invited',
      members: updatedTeam?.members ?? [],
      teamName: updatedTeam?.name,
      slug: updatedTeam?.slug,
    });
  } catch (error: any) {
    console.error('Team POST error:', error?.message);
    return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { memberId } = await req.json();
    if (!memberId) return NextResponse.json({ error: 'memberId is required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.teamRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 });
    }

    if (memberId === user.id) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: memberId } });
    if (!targetUser || targetUser.teamId !== user.teamId) {
      return NextResponse.json({ error: 'Member not found on your team' }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: memberId },
      data: { teamId: null, teamRole: 'MEMBER' },
    });

    return NextResponse.json({ message: 'Member removed' });
  } catch (error: any) {
    console.error('Team DELETE error:', error?.message);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
