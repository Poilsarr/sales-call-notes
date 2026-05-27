import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  authMock,
  upsertMock,
  findManyMock,
  groupByMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  upsertMock: vi.fn(),
  findManyMock: vi.fn(),
  groupByMock: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      upsert: upsertMock,
    },
    competitorMention: {
      findMany: findManyMock,
      groupBy: groupByMock,
    },
  },
}));

import { GET } from '@/app/api/competitive-intelligence/route';

describe('GET /api/competitive-intelligence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when the request is unauthenticated', async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await GET(new Request('http://localhost/api/competitive-intelligence'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it('returns 403 when a caller requests another team', async () => {
    authMock.mockResolvedValue({ userId: 'clerk_user_1' });
    upsertMock.mockResolvedValue({ id: 'user_1', teamId: 'team_a' });

    const response = await GET(
      new Request('http://localhost/api/competitive-intelligence?teamId=team_b'),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Access denied' });
    expect(findManyMock).not.toHaveBeenCalled();
    expect(groupByMock).not.toHaveBeenCalled();
  });

  it('applies competitor and team filters consistently to mentions and trend aggregation', async () => {
    authMock.mockResolvedValue({ userId: 'clerk_user_1' });
    upsertMock.mockResolvedValue({ id: 'user_1', teamId: 'team_a' });
    findManyMock.mockResolvedValue([
      {
        id: 'mention_1',
        competitor: 'Acme',
        createdAt: new Date('2026-05-20T10:00:00.000Z'),
        call: {
          id: 'call_1',
          filename: 'call-1.wav',
          createdAt: new Date('2026-05-20T10:00:00.000Z'),
          userId: 'user_1',
        },
      },
    ]);
    groupByMock.mockResolvedValue([
      {
        competitor: 'Acme',
        _count: {
          competitor: 1,
        },
      },
    ]);

    const response = await GET(
      new Request(
        'http://localhost/api/competitive-intelligence?teamId=team_a&competitor=acme&days=7',
      ),
    );

    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: { gte: expect.any(Date) },
          competitor: { contains: 'acme', mode: 'insensitive' },
          call: { userId: 'user_1', teamId: 'team_a' },
        }),
      }),
    );
    expect(groupByMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: { gte: expect.any(Date) },
          competitor: { contains: 'acme', mode: 'insensitive' },
          call: { userId: 'user_1', teamId: 'team_a' },
        }),
      }),
    );
    await expect(response.json()).resolves.toMatchObject({
      trend: [{ competitor: 'Acme', count: 1 }],
      summary: { total: 1, uniqueCompetitors: 1, days: 7 },
    });
  });
});
