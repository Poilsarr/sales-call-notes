import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  authMock,
  upsertMock,
  findManyMock,
  groupByMock,
  countMock,
  trackedCountMock,
  teamFindUniqueMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  upsertMock: vi.fn(),
  findManyMock: vi.fn(),
  groupByMock: vi.fn(),
  countMock: vi.fn(),
  trackedCountMock: vi.fn().mockResolvedValue(0),
  teamFindUniqueMock: vi.fn().mockResolvedValue(null),
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
      count: countMock,
    },
    trackedCompetitor: {
      count: trackedCountMock,
    },
    team: {
      findUnique: teamFindUniqueMock,
    },
  },
}));

import { GET } from '@/app/api/competitive-intelligence/route';

const PRO_USER = { id: 'user_1', teamId: 'team_a', plan: 'PRO' };
const PRO_USER_LC = { id: 'user_1', teamId: 'team_a', plan: 'pro' };
const FREE_USER = { id: 'user_1', teamId: 'team_a', plan: 'FREE' };
const FREE_USER_NULL = { id: 'user_1', teamId: 'team_a' };

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

  describe('auth and plan gating', () => {
    it('returns 401 when the request is unauthenticated', async () => {
      authMock.mockResolvedValue({ userId: null });

      const response = await GET(new Request('http://localhost/api/competitive-intelligence'));

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
      expect(upsertMock).not.toHaveBeenCalled();
    });

    it('returns 403 with PLAN_REQUIRED when the user is on the free plan', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(FREE_USER);

      const response = await GET(new Request('http://localhost/api/competitive-intelligence'));

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        error: 'Upgrade to Pro to access competitive intelligence',
        code: 'PLAN_REQUIRED',
      });
      expect(findManyMock).not.toHaveBeenCalled();
      expect(groupByMock).not.toHaveBeenCalled();
    });

    it('returns 403 with PLAN_REQUIRED when the plan field is missing', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(FREE_USER_NULL);

      const response = await GET(new Request('http://localhost/api/competitive-intelligence'));

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toMatchObject({ code: 'PLAN_REQUIRED' });
      expect(findManyMock).not.toHaveBeenCalled();
    });

    it('accepts a pro user with uppercase plan code', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);
      findManyMock.mockResolvedValue([]);
      groupByMock.mockResolvedValue([]);

      const response = await GET(new Request('http://localhost/api/competitive-intelligence'));

      expect(response.status).toBe(200);
    });

    it('accepts a pro user with lowercase plan code', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER_LC);
      findManyMock.mockResolvedValue([]);
      groupByMock.mockResolvedValue([]);

      const response = await GET(new Request('http://localhost/api/competitive-intelligence'));

      expect(response.status).toBe(200);
    });

    it('returns 403 with Access denied when a pro user requests another team', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);

      const response = await GET(
        new Request('http://localhost/api/competitive-intelligence?teamId=team_b'),
      );

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: 'Access denied' });
      expect(findManyMock).not.toHaveBeenCalled();
      expect(groupByMock).not.toHaveBeenCalled();
    });
  });

  describe('legacy days behaviour', () => {
    it('applies competitor and team filters consistently to mentions and trend aggregation', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);
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
      countMock.mockResolvedValue(1);

      const response = await GET(
        new Request(
          'http://localhost/api/competitive-intelligence?teamId=team_a&competitor=acme&days=7',
        ),
      );

      expect(response.status).toBe(200);
      // Competitor filter now normalizes to exact normalizedCompetitor for watchlist efficiency (H-01)
      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: expect.any(Date) },
            normalizedCompetitor: 'acme',
            call: { userId: 'user_1', teamId: 'team_a' },
          }),
        }),
      );
      expect(groupByMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: expect.any(Date) },
            normalizedCompetitor: 'acme',
            call: { userId: 'user_1', teamId: 'team_a' },
          }),
        }),
      );
      expect(countMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: expect.any(Date) },
            normalizedCompetitor: 'acme',
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
      upsertMock.mockResolvedValue({ id: 'user_42', teamId: null, plan: 'PRO' });
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
      upsertMock.mockResolvedValue(PRO_USER);
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
      upsertMock.mockResolvedValue(PRO_USER);
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
      upsertMock.mockResolvedValue(PRO_USER);
      findManyMock.mockResolvedValue([]);
      groupByMock.mockResolvedValue([]);
      countMock.mockResolvedValue(0);

      const response = await GET(new Request('http://localhost/api/competitive-intelligence'));

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        mentions: [],
        trend: [],
        summary: { total: 0, uniqueCompetitors: 0, days: 30 },
      });
    });

    it('maps the groupBy aggregation to trend competitor/count pairs preserving order', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);
      findManyMock.mockResolvedValue([]);
      groupByMock.mockResolvedValue([
        { competitor: 'Acme', _count: { competitor: 7 } },
        { competitor: 'Globex', _count: { competitor: 3 } },
        { competitor: 'Initech', _count: { competitor: 1 } },
      ]);
      countMock.mockResolvedValue(11);

      const response = await GET(new Request('http://localhost/api/competitive-intelligence'));

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        trend: [
          { competitor: 'Acme', count: 7 },
          { competitor: 'Globex', count: 3 },
          { competitor: 'Initech', count: 1 },
        ],
        summary: { total: 11, uniqueCompetitors: 3, topCompetitor: 'Acme' },
      });
    });

    it('omits the competitor filter from the prisma query when no competitor param is provided', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);
      findManyMock.mockResolvedValue([]);
      groupByMock.mockResolvedValue([]);

      const response = await GET(new Request('http://localhost/api/competitive-intelligence'));

      expect(response.status).toBe(200);
      const where = findManyMock.mock.calls[0][0].where;
      expect(where).not.toHaveProperty('competitor');
      expect(where).not.toHaveProperty('normalizedCompetitor');
      const groupByWhere = groupByMock.mock.calls[0][0].where;
      expect(groupByWhere).not.toHaveProperty('competitor');
      expect(groupByWhere).not.toHaveProperty('normalizedCompetitor');
    });

    it('defaults the mentions result set to 50 and orders by createdAt descending', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);
      findManyMock.mockResolvedValue([]);

      await GET(new Request('http://localhost/api/competitive-intelligence'));

      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('requests only id, filename, title, and createdAt on the related call (no userId leak)', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);
      findManyMock.mockResolvedValue([]);

      await GET(new Request('http://localhost/api/competitive-intelligence'));

      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            call: {
              select: { id: true, filename: true, title: true, createdAt: true },
            },
          },
        }),
      );
    });
  });

  describe('input validation', () => {
    it.each([
      ['abc', 'non-numeric'],
      ['0', 'zero'],
      ['-5', 'negative'],
      ['400', 'above maximum'],
      ['7.5', 'decimal'],
    ])('returns 400 when days is %s (%s)', async (value) => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);

      const response = await GET(
        new Request(`http://localhost/api/competitive-intelligence?days=${value}`),
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining('days') });
      expect(findManyMock).not.toHaveBeenCalled();
    });

    it('returns 400 when from is not a valid ISO date', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);

      const response = await GET(
        new Request('http://localhost/api/competitive-intelligence?from=not-a-date'),
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'from must be a valid ISO date' });
      expect(findManyMock).not.toHaveBeenCalled();
    });

    it('returns 400 when to is not a valid ISO date', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);

      const response = await GET(
        new Request('http://localhost/api/competitive-intelligence?to=garbage'),
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'to must be a valid ISO date' });
      expect(findManyMock).not.toHaveBeenCalled();
    });

    it('returns 400 when to is before from', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);

      const response = await GET(
        new Request(
          'http://localhost/api/competitive-intelligence?from=2026-05-01&to=2026-04-01',
        ),
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'to must be on or after from' });
      expect(findManyMock).not.toHaveBeenCalled();
    });

    it.each([
      ['abc', 'non-numeric'],
      ['0', 'zero'],
      ['-1', 'negative'],
      ['201', 'above maximum'],
      ['50.5', 'decimal'],
    ])('returns 400 when limit is %s (%s)', async (value) => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);

      const response = await GET(
        new Request(`http://localhost/api/competitive-intelligence?limit=${value}`),
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining('limit') });
      expect(findManyMock).not.toHaveBeenCalled();
    });

    it('returns 400 when groupBy is neither week nor month', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);

      const response = await GET(
        new Request('http://localhost/api/competitive-intelligence?from=2026-01-01&groupBy=day'),
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: 'groupBy must be "week" or "month"',
      });
      expect(findManyMock).not.toHaveBeenCalled();
    });
  });

  describe('limit param', () => {
    it('respects an explicit limit value', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);
      findManyMock.mockResolvedValue([]);

      await GET(new Request('http://localhost/api/competitive-intelligence?limit=10'));

      expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
    });

    it('accepts the boundary values 1 and 200', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);
      findManyMock.mockResolvedValue([]);

      const low = await GET(new Request('http://localhost/api/competitive-intelligence?limit=1'));
      const high = await GET(new Request('http://localhost/api/competitive-intelligence?limit=200'));

      expect(low.status).toBe(200);
      expect(high.status).toBe(200);
    });
  });

  describe('competitor filter normalisation', () => {
    it('treats an empty competitor string as no filter (does not match-all)', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);
      findManyMock.mockResolvedValue([]);
      groupByMock.mockResolvedValue([]);

      const response = await GET(
        new Request('http://localhost/api/competitive-intelligence?competitor='),
      );

      expect(response.status).toBe(200);
      const where = findManyMock.mock.calls[0][0].where;
      expect(where).not.toHaveProperty('competitor');
      const groupByWhere = groupByMock.mock.calls[0][0].where;
      expect(groupByWhere).not.toHaveProperty('competitor');
    });

    it('treats a whitespace-only competitor string as no filter', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);
      findManyMock.mockResolvedValue([]);
      groupByMock.mockResolvedValue([]);

      const response = await GET(
        new Request('http://localhost/api/competitive-intelligence?competitor=%20%20'),
      );

      expect(response.status).toBe(200);
      const where = findManyMock.mock.calls[0][0].where;
      expect(where).not.toHaveProperty('competitor');
    });
  });

  describe('explicit from/to range', () => {
    it('uses from/to instead of days when both are provided', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);
      findManyMock.mockResolvedValue([]);

      const response = await GET(
        new Request(
          'http://localhost/api/competitive-intelligence?from=2026-01-01T00:00:00.000Z&to=2026-12-31T23:59:59.000Z&days=7',
        ),
      );

      expect(response.status).toBe(200);
      const dateFilter = findManyMock.mock.calls[0][0].where.createdAt;
      expect(dateFilter.gte).toBeInstanceOf(Date);
      expect(dateFilter.gte.toISOString()).toBe('2026-01-01T00:00:00.000Z');
      expect(dateFilter.lte).toBeInstanceOf(Date);
      expect(dateFilter.lte.toISOString()).toBe('2026-12-31T23:59:59.000Z');
      expect(groupByMock).not.toHaveBeenCalled();
      await expect(response.json()).resolves.toMatchObject({
        summary: { from: '2026-01-01T00:00:00.000Z', to: '2026-12-31T23:59:59.000Z' },
      });
    });

    it('uses only from when to is omitted', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);
      findManyMock.mockResolvedValue([]);

      await GET(
        new Request('http://localhost/api/competitive-intelligence?from=2026-01-01T00:00:00.000Z'),
      );

      const dateFilter = findManyMock.mock.calls[0][0].where.createdAt;
      expect(dateFilter.gte.toISOString()).toBe('2026-01-01T00:00:00.000Z');
      expect(dateFilter).not.toHaveProperty('lte');
    });

    it('uses only to when from is omitted', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);
      findManyMock.mockResolvedValue([]);

      await GET(
        new Request('http://localhost/api/competitive-intelligence?to=2026-12-31T23:59:59.000Z'),
      );

      const dateFilter = findManyMock.mock.calls[0][0].where.createdAt;
      expect(dateFilter.lte.toISOString()).toBe('2026-12-31T23:59:59.000Z');
      expect(dateFilter).not.toHaveProperty('gte');
    });
  });

  describe('time-bucketed trend', () => {
    it('groups by ISO week by default when from/to are explicit', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);
      findManyMock.mockResolvedValue([
        buildMention({ id: 'm1', competitor: 'Acme', createdAt: new Date('2026-05-20T10:00:00.000Z') }),
        buildMention({ id: 'm2', competitor: 'Acme', createdAt: new Date('2026-05-20T11:00:00.000Z') }),
        buildMention({ id: 'm3', competitor: 'Acme', createdAt: new Date('2026-05-26T10:00:00.000Z') }),
        buildMention({ id: 'm4', competitor: 'Globex', createdAt: new Date('2026-05-20T10:00:00.000Z') }),
      ]);

      const response = await GET(
        new Request(
          'http://localhost/api/competitive-intelligence?from=2026-01-01T00:00:00.000Z&to=2026-12-31T23:59:59.000Z',
        ),
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        trend: [
          { bucket: '2026-W21', competitor: 'Acme', count: 2 },
          { bucket: '2026-W21', competitor: 'Globex', count: 1 },
          { bucket: '2026-W22', competitor: 'Acme', count: 1 },
        ],
        summary: { uniqueCompetitors: 2, topCompetitor: 'Acme', groupBy: 'week' },
      });
    });

    it('groups by month when groupBy=month is set', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);
      findManyMock.mockResolvedValue([
        buildMention({ id: 'm1', competitor: 'Acme', createdAt: new Date('2026-04-15T10:00:00.000Z') }),
        buildMention({ id: 'm2', competitor: 'Acme', createdAt: new Date('2026-04-20T10:00:00.000Z') }),
        buildMention({ id: 'm3', competitor: 'Acme', createdAt: new Date('2026-05-20T10:00:00.000Z') }),
        buildMention({ id: 'm4', competitor: 'Globex', createdAt: new Date('2026-05-20T10:00:00.000Z') }),
      ]);

      const response = await GET(
        new Request(
          'http://localhost/api/competitive-intelligence?from=2026-01-01T00:00:00.000Z&to=2026-12-31T23:59:59.000Z&groupBy=month',
        ),
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        trend: [
          { bucket: '2026-04', competitor: 'Acme', count: 2 },
          { bucket: '2026-05', competitor: 'Acme', count: 1 },
          { bucket: '2026-05', competitor: 'Globex', count: 1 },
        ],
        summary: { groupBy: 'month' },
      });
    });

    it('does not call the groupBy prisma aggregation when from/to are explicit', async () => {
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);
      findManyMock.mockResolvedValue([
        buildMention({ id: 'm1', competitor: 'Acme', createdAt: new Date('2026-05-20T10:00:00.000Z') }),
      ]);

      await GET(
        new Request(
          'http://localhost/api/competitive-intelligence?from=2026-01-01T00:00:00.000Z&to=2026-12-31T23:59:59.000Z',
        ),
      );

      expect(groupByMock).not.toHaveBeenCalled();
    });
  });

  describe('errors', () => {
    it('returns 500 with a generic error message when the prisma query throws', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      authMock.mockResolvedValue({ userId: 'clerk_user_1' });
      upsertMock.mockResolvedValue(PRO_USER);
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
});
