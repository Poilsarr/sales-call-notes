import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockAuth,
  mockGetUserByClerkId,
  mockFindMany,
  mockAnalyticsUpsert,
  mockCaptureApiError,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetUserByClerkId: vi.fn(),
  mockFindMany: vi.fn(),
  mockAnalyticsUpsert: vi.fn(),
  mockCaptureApiError: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/get-user', () => ({
  getUserByClerkId: mockGetUserByClerkId,
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    call: { findMany: mockFindMany },
    analytics: { upsert: mockAnalyticsUpsert },
  },
}));

vi.mock('@/lib/sentry', () => ({
  captureApiError: mockCaptureApiError,
}));

import { GET, POST } from '@/app/api/analytics/route';

function mockRequest(url: string, init?: RequestInit): Request {
  return new Request(url, init);
}

const mockUser = {
  id: 'db-user-1',
  clerkId: 'clerk-user-1',
  email: 'test@example.com',
  name: 'Test User',
  teamId: null,
  plan: 'FREE',
};

const mockCall = (overrides: Record<string, unknown> = {}) => ({
  id: 'call-1',
  filename: 'test-call.mp3',
  createdAt: new Date('2025-01-15T10:00:00Z'),
  healthScore: 0.75,
  sentiment: 'positive',
  actionItems: [
    { id: 'ai-1', status: 'COMPLETED', task: 'Follow up', owner: 'Alice', due: null },
    { id: 'ai-2', status: 'PENDING', task: 'Send proposal', owner: 'Bob', due: null },
  ],
  analytics: {
    budgetMentioned: true,
    timelineMentioned: false,
    decisionMakerPresent: true,
    interruptions: 3,
    questionsAsked: 5,
    speakerMetrics: [
      { speaker: 'Alice', calls: 1, questionsAsked: 3, interruptions: 1, talkRatio: 0.6, sentiment: 'positive', turns: 5 },
    ],
  },
  insight: {
    closeProbability: 70,
    objections: ['too expensive'],
  },
  user: { name: 'Test User' },
  ...overrides,
});

describe('GET /api/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'clerk-user-1' });
    mockGetUserByClerkId.mockResolvedValue(mockUser);
  });

  it('should return 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await GET(mockRequest('http://localhost/api/analytics'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should return 404 when user not found', async () => {
    mockGetUserByClerkId.mockResolvedValue(null);
    const res = await GET(mockRequest('http://localhost/api/analytics?days=30&scope=personal'));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('User not found');
  });

  it('should return analytics data for personal scope', async () => {
    mockFindMany.mockResolvedValue([mockCall()]);
    const res = await GET(mockRequest('http://localhost/api/analytics?days=30&scope=personal'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalCalls).toBe(1);
    expect(body.totalActionItems).toBe(2);
    expect(body.completionRate).toBe(0.5);
    expect(body.avgHealthScore).toBe(75);
    expect(body.avgCloseProbability).toBe(70);
    expect(body.signals.budgetSignals).toBe(1);
    expect(body.signals.dmSignals).toBe(1);
    expect(body.conversationSignals.totalInterruptions).toBe(3);
    expect(body.conversationSignals.totalQuestionsAsked).toBe(5);
  });

  it('should return empty analytics when no calls exist', async () => {
    mockFindMany.mockResolvedValue([]);
    const res = await GET(mockRequest('http://localhost/api/analytics?days=30&scope=personal'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalCalls).toBe(0);
    expect(body.totalActionItems).toBe(0);
    expect(body.completionRate).toBe(0);
    expect(body.avgHealthScore).toBe(0);
    expect(body.avgCloseProbability).toBe(0);
    expect(body.speakerLeaderboard).toEqual([]);
    expect(body.recentCalls).toEqual([]);
  });

  it('should return team-scoped data when user has a teamId', async () => {
    mockGetUserByClerkId.mockResolvedValue({ ...mockUser, teamId: 'team-1' });
    mockFindMany.mockResolvedValue([mockCall()]);
    const res = await GET(mockRequest('http://localhost/api/analytics?days=30&scope=team'));
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ teamId: 'team-1', sharedWithTeam: true }),
      }),
    );
  });

  it('should fall back to personal scope when user has no teamId but scope=team', async () => {
    mockFindMany.mockResolvedValue([mockCall()]);
    const res = await GET(mockRequest('http://localhost/api/analytics?days=30&scope=team'));
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'db-user-1' }),
      }),
    );
  });

  it('should default to 30 days when days param is invalid', async () => {
    mockFindMany.mockResolvedValue([]);
    const res = await GET(mockRequest('http://localhost/api/analytics?days=invalid&scope=personal'));
    expect(res.status).toBe(200);
    const sinceArg = mockFindMany.mock.calls[0][0].where.createdAt.gte;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    expect(sinceArg.getTime()).toBeGreaterThan(thirtyDaysAgo.getTime() - 1000);
  });

  it('should return 500 and log error on internal failure', async () => {
    mockFindMany.mockRejectedValue(new Error('DB connection failed'));
    const res = await GET(mockRequest('http://localhost/api/analytics'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Analytics failed');
    expect(mockCaptureApiError).toHaveBeenCalled();
  });

  it('should handle calls with null analytics gracefully', async () => {
    mockFindMany.mockResolvedValue([mockCall({ analytics: null })]);
    const res = await GET(mockRequest('http://localhost/api/analytics'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.signals.budgetSignals).toBe(0);
    expect(body.speakerLeaderboard).toEqual([]);
  });

  it('should handle calls with null insight gracefully', async () => {
    mockFindMany.mockResolvedValue([mockCall({ insight: null })]);
    const res = await GET(mockRequest('http://localhost/api/analytics'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.recentCalls[0].closeProbability).toBeNull();
    expect(body.recentCalls[0].topObjection).toBeNull();
  });

  it('should compute sentiment counts correctly', async () => {
    mockFindMany.mockResolvedValue([
      mockCall({ id: 'c1', sentiment: 'positive' }),
      mockCall({ id: 'c2', sentiment: 'negative' }),
      mockCall({ id: 'c3', sentiment: 'neutral' }),
      mockCall({ id: 'c4', sentiment: 'positive' }),
    ]);
    const res = await GET(mockRequest('http://localhost/api/analytics'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sentimentCounts.positive).toBe(2);
    expect(body.sentimentCounts.negative).toBe(1);
    expect(body.sentimentCounts.neutral).toBe(1);
  });

  it('should return top 5 speakers in leaderboard', async () => {
    const speakers = Array.from({ length: 7 }, (_, i) => ({
      speaker: `Speaker ${i + 1}`,
      calls: 1,
      questionsAsked: 10 - i,
      interruptions: i,
      talkRatio: 0.5,
      sentiment: 'neutral' as const,
      turns: 3,
    }));
    mockFindMany.mockResolvedValue([
      mockCall({
        id: 'c1',
        analytics: { ...mockCall().analytics, speakerMetrics: speakers },
      }),
    ]);
    const res = await GET(mockRequest('http://localhost/api/analytics'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.speakerLeaderboard.length).toBeLessThanOrEqual(5);
  });

  it('should aggregate scoresByDay as averages', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    mockFindMany.mockResolvedValue([
      mockCall({ id: 'c1', createdAt: today, healthScore: 0.8 }),
      mockCall({ id: 'c2', createdAt: today, healthScore: 0.6 }),
      mockCall({ id: 'c3', createdAt: yesterday, healthScore: 0.9 }),
    ]);
    const res = await GET(mockRequest('http://localhost/api/analytics'));
    expect(res.status).toBe(200);
    const body = await res.json();
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    expect(body.scoresByDay[todayStr]).toBeCloseTo(0.7, 1);
    expect(body.scoresByDay[yesterdayStr]).toBeCloseTo(0.9, 1);
  });
});

describe('POST /api/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'clerk-user-1' });
  });

  it('should return 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(
      mockRequest('http://localhost/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: 'Hello', speakers: [] }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it('should return 400 when transcript is missing', async () => {
    const res = await POST(
      mockRequest('http://localhost/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speakers: [] }),
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('transcript required');
  });

  it('should upsert analytics when callId is provided', async () => {
    mockAnalyticsUpsert.mockResolvedValue({ id: 'analytics-1' });
    const res = await POST(
      mockRequest('http://localhost/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: 'We have budget and timeline concerns',
          speakers: [],
          callId: 'call-1',
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(mockAnalyticsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { callId: 'call-1' },
        create: expect.objectContaining({
          callId: 'call-1',
          budgetMentioned: true,
          timelineMentioned: true,
          speakerMetrics: expect.any(Array),
          sentimentTimeline: expect.any(Array),
        }),
      }),
    );
  });

  it('should return analytics without saving when callId is missing', async () => {
    const res = await POST(
      mockRequest('http://localhost/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: 'Hello', speakers: [] }),
      }),
    );
    expect(res.status).toBe(200);
    expect(mockAnalyticsUpsert).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body).toHaveProperty('healthScore');
    expect(body).toHaveProperty('sentiment');
  });

  it('should return 500 and log error on failure', async () => {
    mockAuth.mockRejectedValue(new Error('Auth failed'));
    const res = await POST(
      mockRequest('http://localhost/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: 'Hello', speakers: [] }),
      }),
    );
    expect(res.status).toBe(500);
    expect(mockCaptureApiError).toHaveBeenCalled();
  });
});
