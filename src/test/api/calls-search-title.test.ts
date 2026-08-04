import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  authMock,
  getUserMock,
  callFindManyMock,
  callCountMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  getUserMock: vi.fn(),
  callFindManyMock: vi.fn(),
  callCountMock: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
}));

vi.mock('@/lib/get-user', () => ({
  getUserByClerkId: getUserMock,
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    call: {
      findMany: callFindManyMock,
      count: callCountMock,
    },
  },
}));

import { GET as HistoryGET } from '@/app/api/history/route';
import { GET as ArchivedGET } from '@/app/api/calls/archived/route';
import { GET as AnalyticsGET } from '@/app/api/analytics/route';

const CLERK_USER_ID = 'user_2xxx';
const DB_USER_ID = 'cm_db_id_1';

const USER = { id: DB_USER_ID, teamId: null, plan: 'free' };

function buildCall(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'call_1',
    userId: DB_USER_ID,
    filename: 'recording-1.mp3',
    title: null,
    transcript: 'hello world',
    language: 'en',
    summary: null,
    healthScore: 80,
    sentiment: 'positive',
    createdAt: new Date('2026-05-20T10:00:00.000Z'),
    sharedWithTeam: false,
    user: null,
    assignee: null,
    actionItems: [],
    decisions: [],
    nextSteps: [],
    ...overrides,
  };
}

describe('title search + read serializers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ userId: CLERK_USER_ID });
    getUserMock.mockResolvedValue(USER);
    callCountMock.mockResolvedValue(2);
  });

  it('GET /api/history?q=<renamed-title> searches the title column case-insensitively', async () => {
    callFindManyMock.mockResolvedValue([]);

    const response = await HistoryGET(new Request('http://x/api/history?q=acme%20renewal'));

    expect(response.status).toBe(200);
    expect(callFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                { title: { contains: 'acme renewal', mode: 'insensitive' } },
              ]),
            }),
          ]),
        }),
      }),
    );
  });

  it('GET /api/history returns title + displayName with fallback to filename', async () => {
    callFindManyMock.mockResolvedValue([
      buildCall({ id: 'call_1', filename: 'recording-1.mp3', title: 'Acme renewal' }),
      buildCall({ id: 'call_2', filename: 'recording-2.mp3', title: null }),
    ]);

    const response = await HistoryGET(new Request('http://x/api/history'));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.calls[0]).toMatchObject({
      title: 'Acme renewal',
      displayName: 'Acme renewal',
    });
    expect(body.calls[1]).toMatchObject({
      title: null,
      displayName: 'recording-2.mp3',
    });
  });

  it('GET /api/calls/archived selects title and returns title + displayName', async () => {
    callFindManyMock.mockResolvedValue([
      { id: 'call_1', filename: 'a.mp3', title: 'Archived renewal', createdAt: new Date('2026-05-01T00:00:00.000Z'), healthScore: 70, sentiment: 'neutral' },
      { id: 'call_2', filename: 'b.mp3', title: null, createdAt: new Date('2026-05-02T00:00:00.000Z'), healthScore: null, sentiment: null },
    ]);

    const response = await ArchivedGET(new Request('http://x/api/calls/archived'));

    expect(response.status).toBe(200);
    expect(callFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({ title: true }),
      }),
    );
    const body = await response.json();
    expect(body.calls[0]).toMatchObject({ title: 'Archived renewal', displayName: 'Archived renewal' });
    expect(body.calls[1]).toMatchObject({ title: null, displayName: 'b.mp3' });
  });

  it('GET /api/analytics selects title and recentCalls carry title + displayName', async () => {
    callFindManyMock.mockResolvedValue([
      {
        id: 'call_1',
        filename: 'a.mp3',
        title: 'Acme renewal',
        createdAt: new Date('2026-05-20T10:00:00.000Z'),
        healthScore: 80,
        sentiment: 'positive',
        actionItems: [],
        analytics: null,
        insight: null,
        user: { name: 'Alice' },
      },
      {
        id: 'call_2',
        filename: 'b.mp3',
        title: null,
        createdAt: new Date('2026-05-19T10:00:00.000Z'),
        healthScore: null,
        sentiment: 'neutral',
        actionItems: [],
        analytics: null,
        insight: null,
        user: { name: 'Bob' },
      },
    ]);

    const response = await AnalyticsGET(new Request('http://x/api/analytics?days=30&scope=personal'));

    expect(response.status).toBe(200);
    expect(callFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({ title: true }),
      }),
    );
    const body = await response.json();
    expect(body.recentCalls[0]).toMatchObject({ title: 'Acme renewal', displayName: 'Acme renewal' });
    expect(body.recentCalls[1]).toMatchObject({ title: null, displayName: 'b.mp3' });
  });
});
