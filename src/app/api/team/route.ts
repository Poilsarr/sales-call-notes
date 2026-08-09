import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { getUserByClerkId } from '@/lib/get-user';
import { requireRole } from '@/lib/rbac';
import { logAuditAction } from '@/lib/audit-logger';
import { getPlan } from '@/lib/plans';

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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const members = user.team?.members ?? [];
    const teamName = user.team?.name ?? null;
    const slug = user.team?.slug ?? null;

    let sharedCalls: Array<{
      id: string;
      filename: string;
      title: string | null;
      displayName: string;
      createdAt: Date;
      healthScore: number | null;
      ownerName: string | null;
      assigneeName: string | null;
      commentCount: number;
    }> = [];

    let teamAnalytics = {
      sharedCalls: 0,
      avgHealthScore: 0,
      openActionItems: 0,
      assignedCalls: 0,
    };

    if (user.teamId) {
      const teamCalls = await prisma.call.findMany({
        where: { teamId: user.teamId, sharedWithTeam: true },
        include: {
          actionItems: true,
          comments: true,
          user: { select: { name: true } },
          assignee: { select: { name: true } },
        } as any,
        orderBy: { createdAt: 'desc' },
        take: 8,
      });

      sharedCalls = teamCalls.map((call) => ({
        id: call.id,
        filename: call.filename,
        title: call.title,
        displayName: call.title || call.filename,
        createdAt: call.createdAt,
        healthScore: call.healthScore,
        ownerName: (call as any).user?.name || null,
        assigneeName: (call as any).assignee?.name || null,
        commentCount: (call as any).comments?.length || 0,
      }));

      const totalHealth = teamCalls.reduce((sum, call) => sum + (call.healthScore || 0), 0);
      const openActionItems = teamCalls.reduce(
        (sum, call) => sum + (call.actionItems as any[]).filter((item: any) => item.status !== 'COMPLETED').length,
        0,
      );

      teamAnalytics = {
        sharedCalls: teamCalls.length,
        avgHealthScore: teamCalls.length > 0 ? Math.round(totalHealth / teamCalls.length) : 0,
        openActionItems,
        assignedCalls: teamCalls.filter((call) => Boolean((call as any).assignee)).length,
      };
    }

    return NextResponse.json({ members, teamName, slug, sharedCalls, teamAnalytics });
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

    const inviter = await getUserByClerkId(userId);

    if (inviter.teamId) {
      const { allowed } = await requireRole(userId, inviter.teamId, "ADMIN");
      if (!allowed) {
        return NextResponse.json({ error: 'Only admins can invite members' }, { status: 403 });
      }
    }

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found — they need to sign up first' }, { status: 404 });
    }

    if (targetUser.teamId) {
      return NextResponse.json({ error: 'User is already on a team' }, { status: 409 });
    }

    const plan = ((inviter.plan as string | undefined) ?? 'FREE').toLowerCase();
    const limit = getPlan(plan).teamMemberLimit;
    if (typeof limit === 'number') {
      const currentSeats = inviter.teamId
        ? await prisma.user.count({ where: { teamId: inviter.teamId } })
        : 1;
      if (currentSeats + 1 > limit) {
        return NextResponse.json(
          {
            error:
              limit === 1
                ? 'Team workspaces are a Pro feature. Upgrade to Pro to invite up to 5 members.'
                : 'You\'ve reached the Pro limit of 5 members. Upgrade to Business for unlimited seats, or remove a member first.',
          },
          { status: 403 },
        );
      }
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
      // ponytail: backfill calls uploaded before the user joined a team so
      // they aren't orphaned from the scorecard (call.teamId was null).
      // We associate them with the team but do NOT auto-share them
      // (sharedWithTeam stays false) to respect prior privacy intent —
      // explicit sharing is a separate user action.
      await prisma.call.updateMany({
        where: { userId: inviter.id, teamId: null },
        data: { teamId: team.id },
      });
    }

    await prisma.user.update({
      where: { id: targetUser.id },
      data: { teamId: team.id, teamRole: 'MEMBER' },
    });
    // ponytail: same backfill for the invited member's pre-team calls.
    // Associate with team only; do not auto-share (privacy-preserving).
    await prisma.call.updateMany({
      where: { userId: targetUser.id, teamId: null },
      data: { teamId: team.id },
    });

    await logAuditAction(inviter.id, 'INVITE_MEMBER', targetUser.id, 'User', { teamId: team.id, email: email });

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

    const user = await getUserByClerkId(userId);

    if (user.teamId) {
      const { allowed } = await requireRole(userId, user.teamId, "ADMIN");
      if (!allowed) {
        return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 });
      }
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

    await logAuditAction(user.id, 'REMOVE_MEMBER', memberId, 'User', { teamId: user.teamId });

    return NextResponse.json({ message: 'Member removed' });
  } catch (error: any) {
    console.error('Team DELETE error:', error?.message);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
