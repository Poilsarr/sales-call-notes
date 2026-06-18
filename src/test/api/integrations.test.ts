import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockAuth,
  mockGetUserByClerkId,
  mockRequireRole,
  mockFindMany,
  mockGetSecret,
  mockDevSandboxEnabled,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetUserByClerkId: vi.fn(),
  mockRequireRole: vi.fn(),
  mockFindMany: vi.fn(),
  mockGetSecret: vi.fn(),
  mockDevSandboxEnabled: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/get-user', () => ({
  getUserByClerkId: mockGetUserByClerkId,
}));

vi.mock('@/lib/rbac', () => ({
  requireRole: mockRequireRole,
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    integration: {
      findMany: mockFindMany,
    },
  },
}));

vi.mock('@/lib/secrets', () => ({
  getSecret: mockGetSecret,
}));

vi.mock('@/lib/integrations/dev-sandbox', () => ({
  isDevSandboxEnabled: mockDevSandboxEnabled,
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

import { GET } from '@/app/api/integrations/route';

function mockGetRequest(url: string): NextRequest {
  const req = new Request(url);
  const nextUrl = new URL(url);
  Object.defineProperty(req, 'nextUrl', {
    value: nextUrl,
    writable: false,
  });
  return req as unknown as NextRequest;
}

const mockUserWithTeam = {
  id: 'user-1',
  clerkId: 'test-user',
  email: 'test@example.com',
  name: 'Test User',
  teamId: 'team-1',
  plan: 'PRO',
};

const mockUserNoTeam = {
  id: 'user-2',
  clerkId: 'test-user-2',
  email: 'test2@example.com',
  name: 'Test User 2',
  teamId: null,
  plan: 'PRO',
};

describe('GET /api/integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const response = await GET(mockGetRequest('http://localhost/api/integrations'));

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    });
  });

  describe('integrations list', () => {
    it('returns all five provider entries in the response', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user' });
      mockGetUserByClerkId.mockResolvedValue(mockUserWithTeam);
      mockRequireRole.mockResolvedValue({ allowed: true, userRole: 'MEMBER' });
      mockDevSandboxEnabled.mockReturnValue(true);
      mockFindMany.mockResolvedValue([
        {
          provider: 'hubspot',
          enabled: true,
          syncedAt: new Date('2025-01-15T00:00:00.000Z'),
          config: JSON.stringify({ accessToken: 'hs-token' }),
        },
      ]);

      const response = await GET(mockGetRequest('http://localhost/api/integrations'));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty('integrations');
      expect(Object.keys(body.integrations)).toEqual(['hubspot', 'salesforce', 'teams', 'slack', 'google_calendar']);
    });

    it('marks connected providers correctly', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user' });
      mockGetUserByClerkId.mockResolvedValue(mockUserWithTeam);
      mockRequireRole.mockResolvedValue({ allowed: true, userRole: 'MEMBER' });
      mockDevSandboxEnabled.mockReturnValue(true);
      mockFindMany.mockResolvedValue([
        {
          provider: 'hubspot',
          enabled: true,
          syncedAt: new Date('2025-01-15T00:00:00.000Z'),
          config: JSON.stringify({ accessToken: 'hs-token' }),
        },
        {
          provider: 'salesforce',
          enabled: false,
          syncedAt: null,
          config: null,
        },
      ]);

      const response = await GET(mockGetRequest('http://localhost/api/integrations'));
      const body = await response.json();

      expect(body.integrations.hubspot.connected).toBe(true);
      expect(body.integrations.hubspot.enabled).toBe(true);
      expect(body.integrations.salesforce.connected).toBe(false);
      expect(body.integrations.salesforce.enabled).toBe(false);
      expect(body.integrations.teams.connected).toBe(false);
      expect(body.integrations.slack.connected).toBe(false);
    });

    it('returns empty integrations for user without team', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user-2' });
      mockGetUserByClerkId.mockResolvedValue(mockUserNoTeam);
      mockDevSandboxEnabled.mockReturnValue(true);

      const response = await GET(mockGetRequest('http://localhost/api/integrations'));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.integrations.hubspot.connected).toBe(false);
      expect(body.integrations.salesforce.connected).toBe(false);
      expect(body.integrations.teams.connected).toBe(false);
      expect(body.integrations.slack.connected).toBe(false);
    });

    it('includes syncedAt timestamp for connected integrations', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user' });
      mockGetUserByClerkId.mockResolvedValue(mockUserWithTeam);
      mockRequireRole.mockResolvedValue({ allowed: true, userRole: 'MEMBER' });
      mockDevSandboxEnabled.mockReturnValue(true);
      const syncedAt = new Date('2025-01-15T12:00:00.000Z');
      mockFindMany.mockResolvedValue([
        {
          provider: 'hubspot',
          enabled: true,
          syncedAt,
          config: JSON.stringify({ accessToken: 'hs-token' }),
        },
      ]);

      const response = await GET(mockGetRequest('http://localhost/api/integrations'));
      const body = await response.json();

      expect(body.integrations.hubspot.syncedAt).toBe(syncedAt.toISOString());
      expect(body.integrations.salesforce.syncedAt).toBeNull();
    });
  });

  describe('dev sandbox', () => {
    it('marks all providers as configured when dev sandbox is enabled', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user' });
      mockGetUserByClerkId.mockResolvedValue(mockUserWithTeam);
      mockRequireRole.mockResolvedValue({ allowed: true, userRole: 'MEMBER' });
      mockDevSandboxEnabled.mockReturnValue(true);
      mockFindMany.mockResolvedValue([]);

      const response = await GET(mockGetRequest('http://localhost/api/integrations'));
      const body = await response.json();

      expect(body.integrations.hubspot.configured).toBe(true);
      expect(body.integrations.salesforce.configured).toBe(true);
      expect(body.integrations.teams.configured).toBe(true);
      expect(body.integrations.slack.configured).toBe(true);
      expect(body.integrations.google_calendar.configured).toBe(true);
    });

    it('marks providers as configured based on env vars when sandbox is disabled', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user' });
      mockGetUserByClerkId.mockResolvedValue(mockUserWithTeam);
      mockRequireRole.mockResolvedValue({ allowed: true, userRole: 'MEMBER' });
      mockDevSandboxEnabled.mockReturnValue(false);
      mockGetSecret.mockImplementation((key: string) => {
        const map: Record<string, string> = {
          HUBSPOT_CLIENT_ID: 'real-hs-id',
          HUBSPOT_CLIENT_SECRET: 'real-hs-secret',
          SALESFORCE_CLIENT_ID: 'real-sf-id',
          SALESFORCE_CLIENT_SECRET: 'real-sf-secret',
        };
        return map[key] || '';
      });
      mockFindMany.mockResolvedValue([]);

      const response = await GET(mockGetRequest('http://localhost/api/integrations'));
      const body = await response.json();

      expect(body.integrations.hubspot.configured).toBe(true);
      expect(body.integrations.salesforce.configured).toBe(true);
      expect(body.integrations.teams.configured).toBe(false);
      expect(body.integrations.slack.configured).toBe(false);
      expect(body.integrations.google_calendar.configured).toBe(false);
    });
  });

  describe('provider list consistency', () => {
    it('always returns the same five providers regardless of database state', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user' });
      mockGetUserByClerkId.mockResolvedValue(mockUserWithTeam);
      mockRequireRole.mockResolvedValue({ allowed: true, userRole: 'MEMBER' });
      mockDevSandboxEnabled.mockReturnValue(true);
      mockFindMany.mockResolvedValue([]);

      const response = await GET(mockGetRequest('http://localhost/api/integrations'));
      const body = await response.json();
      const providers = Object.keys(body.integrations);

      expect(providers).toHaveLength(5);
      expect(providers).toContain('hubspot');
      expect(providers).toContain('salesforce');
      expect(providers).toContain('teams');
      expect(providers).toContain('slack');
      expect(providers).toContain('google_calendar');
    });

    it('reports OAuth providers in a consistent order', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user' });
      mockGetUserByClerkId.mockResolvedValue(mockUserWithTeam);
      mockRequireRole.mockResolvedValue({ allowed: true, userRole: 'MEMBER' });
      mockDevSandboxEnabled.mockReturnValue(true);
      mockFindMany.mockResolvedValue([]);

      const response = await GET(mockGetRequest('http://localhost/api/integrations'));
      const body = await response.json();

      expect(Object.keys(body.integrations)).toEqual(['hubspot', 'salesforce', 'teams', 'slack', 'google_calendar']);
    });
  });

  describe('error handling', () => {
    it('returns 500 when user lookup fails', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user' });
      mockGetUserByClerkId.mockRejectedValue(new Error('DB error'));

      const response = await GET(mockGetRequest('http://localhost/api/integrations'));

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining('DB error') });
    });
  });

  describe('forbidden access', () => {
    it('returns 403 when role check fails', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user' });
      mockGetUserByClerkId.mockResolvedValue(mockUserWithTeam);
      mockRequireRole.mockResolvedValue({ allowed: false, userRole: 'VIEWER' });

      const response = await GET(mockGetRequest('http://localhost/api/integrations'));

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
    });
  });
});
