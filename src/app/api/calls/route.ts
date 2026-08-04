import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import prisma from '@/lib/prisma';
import { getUserByClerkId } from '@/lib/get-user';
import { cacheGet, cacheSet, makeCacheKey } from '@/lib/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sanitizeFilename(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return trimmed.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 200);
}

function sanitizeNumber(raw: unknown): number | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
  if (raw < 0) return null;
  return Math.round(raw);
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkUserId);
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);
    const rawQuery = (searchParams.get('q') || '').trim().slice(0, 100);
    // Sanitize for Postgres ILIKE: strip % and _ so users can't
    // accidentally (or intentionally) inject wildcard patterns.
    const query = rawQuery.replace(/[%_\\]/g, ' ');

    const cacheKey = makeCacheKey('calls', user.id, 'list', `${limit}`, `${offset}`, query);
    const cached = await cacheGet<{ calls: unknown[]; total: number }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const where = query
      ? {
          userId: user.id,
          OR: [
            { filename: { contains: query, mode: 'insensitive' as const } },
            { title: { contains: query, mode: 'insensitive' as const } },
            { transcript: { contains: query, mode: 'insensitive' as const } },
            { summary: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : { userId: user.id };

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.call.count({ where }),
    ]);

    const result = { calls, total };
    await cacheSet(cacheKey, result, 60);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to list calls: ${message}` }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const filename = sanitizeFilename((body as Record<string, unknown>).filename);
    const transcript = typeof (body as Record<string, unknown>).transcript === 'string'
      ? ((body as Record<string, unknown>).transcript as string).trim()
      : '';
    const sessionId = typeof (body as Record<string, unknown>).sessionId === 'string'
      ? ((body as Record<string, unknown>).sessionId as string).slice(0, 100)
      : null;
    const duration = sanitizeNumber((body as Record<string, unknown>).duration);
    const source = typeof (body as Record<string, unknown>).source === 'string'
      ? ((body as Record<string, unknown>).source as string).slice(0, 50)
      : 'live';

    if (!filename) {
      return NextResponse.json({ error: 'filename required' }, { status: 400 });
    }
    if (!transcript) {
      return NextResponse.json({ error: 'transcript required' }, { status: 400 });
    }

    const user = await getUserByClerkId(clerkUserId);

    const call = await prisma.call.create({
      data: {
        userId: user.id,
        teamId: user.teamId,
        sharedWithTeam: Boolean(user.teamId),
        filename,
        transcript,
        summary: transcript.slice(0, 500),
        duration: duration ?? null,
        source,
      },
    });

    return NextResponse.json(
      {
        id: call.id,
        filename: call.filename,
        duration: call.duration,
        createdAt: call.createdAt,
        sessionId,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to save call: ${message}` }, { status: 500 });
  }
}
