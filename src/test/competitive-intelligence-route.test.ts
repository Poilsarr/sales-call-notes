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

const buildMention = (overrides: Partial<{
  id: string;
  competitor: string;
  createdAt: Date;
  callId: string;
  callFilename: string;
}> = {}) => ({
  id: overrides.id ?? 'mention_1',
  competitor: overrides.competitor ?? 'Acme',
  createdAt: overrides.createdAt ?? new Date('2026-05-20T10:00:00.000Z'),
  call: {
    id: overrides.callId ?? 'call_1',
    filename: overrides.callFilename ?? 'call-1.wav',
    createdAt: overrides.createdAt ?? new Date('2026-05-20T10:00:00.000Z'),
    userId: 'user_1',
  },
});

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

  it('scopes mentions and trend to the authenticated user even when no teamId is provided', async () => {
    authMock.mockResolvedValue({ userId: 'clerk_user_1' });
    upsertMock.mockResolvedValue({ id: 'user_42', teamId: null });
    findManyMock.mockResolvedValue([buildMention({ id: 'mention_1' })]);
    groupByMock.mockResolvedValue([{ competitor: 'Acme', _count: { competitor: 1 } }]);

    const response = await GET(
      new Request('http://localhost/api/competitive-intelligence'),
    );

    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          call: { userId: 'user_42' },
        }),
      }),
    );
    expect(groupByMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          call: { userId: 'user_42' },
        }),
      }),
    );
  });

  it('respects the days parameter to compute the lookback window', async () => {
    authMock.mockResolvedValue({ userId: 'clerk_user_1' });
    upsertMock.mockResolvedValue({ id: 'user_1', teamId: 'team_a' });
    findManyMock.mockResolvedValue([]);
    groupByMock.mockResolvedValue([]);

    const before = Date.now();
    const response = await GET(
      new Request('http://localhost/api/competitive-intelligence?days=7'),
    );
    const after = Date.now();

    expect(response.status).toBe(200);
    const findManyCall = findManyMock.mock.calls[0][0];
    const since = findManyCall.where.createdAt.gte as Date;
    const expectedMin = new Date(before - 7 * 24 * 60 * 60 * 1000);
    const expectedMax = new Date(after - 7 * 24 * 60 * 60 * 1000);
    expect(since.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
    expect(since.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
    await expect(response.json()).resolves.toMatchObject({
      summary: { days: 7 },
    });
  });

  it('defaults the lookback window to 30 days when days is omitted', async () => {
    authMock.mockResolvedValue({ userId: 'clerk_user_1' });
    upsertMock.mockResolvedValue({ id: 'user_1', teamId: 'team_a' });
    findManyMock.mockResolvedValue([]);
    groupByMock.mockResolvedValue([]);

    const before = Date.now();
    const response = await GET(new Request('http://localhost/api/competitive-intelligence'));
    const after = Date.now();

    expect(response.status).toBe(200);
    const since = findManyMock.mock.calls[0][0].where.createdAt.gte as Date;
    const expectedMin = new Date(before - 30 * 24 * 60 * 60 * 1000);
    const expectedMax = new Date(after - 30 * 24 * 60 * 60 * 1000);
    expect(since.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
    expect(since.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
    await expect(response.json()).resolves.toMatchObject({
      summary: { days: 30 },
    });
  });

  it('returns empty mentions, empty trend, and zeroed summary when no data matches', async () => {
    authMock.mockResolvedValue({ userId: 'clerk_user_1' });
    upsertMock.mockResolvedValue({ id: 'user_1', teamId: 'team_a' });
    findManyMock.mockResolvedValue([]);
    groupByMock.mockResolvedValue([]);

    const response = await GET(new Request('http://localhost/api/competitive-intelligence'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      mentions: [],
      trend: [],
      summary: { total: 0, uniqueCompetitors: 0, days: 30 },
    });
  });

  it('maps the groupBy aggregation to trend competitor/count pairs preserving order', async () => {
    authMock.mockResolvedValue({ userId: 'clerk_user_1' });
    upsertMock.mockResolvedValue({ id: 'user_1', teamId: 'team_a' });
    findManyMock.mockResolvedValue([]);
    groupByMock.mockResolvedValue([
      { competitor: 'Acme', _count: { competitor: 7 } },
      { competitor: 'Globex', _count: { competitor: 3 } },
      { competitor: 'Initech', _count: { competitor: 1 } },
    ]);

    const response = await GET(new Request('http://localhost/api/competitive-intelligence'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      trend: [
        { competitor: 'Acme', count: 7 },
        { competitor: 'Globex', count: 3 },
        { competitor: 'Initech', count: 1 },
      ],
      summary: { total: 0, uniqueCompetitors: 3 },
    });
  });

  it('omits the competitor filter from the prisma query when no competitor param is provided', async () => {
    authMock.mockResolvedValue({ userId: 'clerk_user_1' });
    upsertMock.mockResolvedValue({ id: 'user_1', teamId: 'team_a' });
    findManyMock.mockResolvedValue([]);
    groupByMock.mockResolvedValue([]);

    const response = await GET(new Request('http://localhost/api/competitive-intelligence'));

    expect(response.status).toBe(200);
    const where = findManyMock.mock.calls[0][0].where;
    expect(where).not.toHaveProperty('competitor');
    const groupByWhere = groupByMock.mock.calls[0][0].where;
    expect(groupByWhere).not.toHaveProperty('competitor');
  });

  it('caps the mentions result set to 100 and orders by createdAt descending', async () => {
    authMock.mockResolvedValue({ userId: 'clerk_user_1' });
    upsertMock.mockResolvedValue({ id: 'user_1', teamId: 'team_a' });
    findManyMock.mockResolvedValue([]);

    await GET(new Request('http://localhost/api/competitive-intelligence'));

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('requests only id, filename, createdAt, and userId on the related call', async () => {
    authMock.mockResolvedValue({ userId: 'clerk_user_1' });
    upsertMock.mockResolvedValue({ id: 'user_1', teamId: 'team_a' });
    findManyMock.mockResolvedValue([]);

    await GET(new Request('http://localhost/api/competitive-intelligence'));

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          call: {
            select: { id: true, filename: true, createdAt: true, userId: true },
          },
        },
      }),
    );
  });

  it('returns 500 with a generic error message when the prisma query throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    authMock.mockResolvedValue({ userId: 'clerk_user_1' });
    upsertMock.mockResolvedValue({ id: 'user_1', teamId: 'team_a' });
    findManyMock.mockRejectedValue(new Error('database offline'));

    const response = await GET(new Request('http://localhost/api/competitive-intelligence'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to fetch competitive intelligence',
    });
    expect(errorSpy).toHaveBeenCalledWith(
      'Competitive intelligence error:',
      'database offline',
    );
    errorSpy.mockRestore();
  });

  it('returns 500 when the getUserByClerkId lookup fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    authMock.mockResolvedValue({ userId: 'clerk_user_1' });
    upsertMock.mockRejectedValue(new Error('user lookup failed'));

    const response = await GET(new Request('http://localhost/api/competitive-intelligence'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to fetch competitive intelligence',
    });
    expect(findManyMock).not.toHaveBeenCalled();
    expect(groupByMock).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
