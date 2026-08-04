import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/get-user';

// ponytail: list soft-archived calls for the current user (free-plan retention
// overflow). Team-shared calls are never archived, so this is owner-scoped.
export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserByClerkId(clerkUserId);

    const calls = await prisma.call.findMany({
      where: { userId: user.id, archived: true },
      select: {
        id: true,
        filename: true,
        title: true,
        createdAt: true,
        healthScore: true,
        sentiment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      calls: calls.map((c) => ({
        id: c.id,
        filename: c.filename,
        title: c.title,
        displayName: c.title || c.filename,
        createdAt: c.createdAt,
        healthScore: c.healthScore,
        sentiment: c.sentiment,
      })),
    });
  } catch (error) {
    console.error("Archived list error:", error);
    return NextResponse.json({ error: "Failed to load archived calls" }, { status: 500 });
  }
}
