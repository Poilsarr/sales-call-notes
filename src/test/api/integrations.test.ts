import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockAuth,
  mockGetUserByClerkId,
  mockRequireRole,
  mockFindMany,
  mockFindFirst,
  mockCreate,
  mockUpdate,
  mockTeamCreate,
  mockUserUpdate,
  mockGetSecret,
  mockDevSandboxEnabled,
  mockDevSandboxCredentials,
  mockCheckRateLimit,
  mockCookieStore,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetUserByClerkId: vi.fn(),
  mockRequireRole: vi.fn(),
  mockFindMany: vi.fn(),
  mockFindFirst: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockTeamCreate: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockGetSecret: vi.fn(),
  mockDevSandboxEnabled: vi.fn(),
  mockDevSandboxCredentials: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockCookieStore: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
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
      findFirst: mockFindFirst,
      create: mockCreate,
      update: mockUpdate,
    },
    team: {
      create: mockTeamCreate,
    },
    user: {
      update: mockUserUpdate,
    },
  },
}));

vi.mock('@/lib/secrets', () => ({
  getSecret: mockGetSecret,
}));

vi.mock('@/lib/integrations/dev-sandbox', () => ({
  isDevSandboxEnabled: mockDevSandboxEnabled,
  getDevSandboxCredentials: mockDevSandboxCredentials,
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => mockCookieStore),
}));

mockCheckRateLimit.mockResolvedValue({ success: true, remaining: 999, reset: 0 });

import { GET, POST } from '@/app/api/integrations/route';
import {
  decryptConfig,
  encryptConfig,
} from '@/lib/integrations/config-crypto';

// 32-byte test key (base64) — mirrors src/lib/integrations/config-crypto.test.ts
const TEST_ENCRYPTION_KEY = 'YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=';

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

    it('reports connected for an encrypted config without leaking tokens or ciphertext', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user' });
      mockGetUserByClerkId.mockResolvedValue(mockUserWithTeam);
      mockRequireRole.mockResolvedValue({ allowed: true, userRole: 'MEMBER' });
      mockDevSandboxEnabled.mockReturnValue(false);
      mockGetSecret.mockImplementation((key: string) =>
        key === 'ENCRYPTION_KEY' ? TEST_ENCRYPTION_KEY : '',
      );
      mockFindMany.mockResolvedValue([
        {
          provider: 'hubspot',
          enabled: true,
          syncedAt: new Date('2025-01-15T00:00:00.000Z'),
          config: encryptConfig(JSON.stringify({ accessToken: 'hs-token' })),
        },
      ]);

      const response = await GET(mockGetRequest('http://localhost/api/integrations'));
      const body = await response.json();
      const serialized = JSON.stringify(body);

      expect(response.status).toBe(200);
      expect(body.integrations.hubspot.connected).toBe(true);
      // No raw token, no accessToken field, no ciphertext envelope in the payload.
      expect(serialized).not.toContain('hs-token');
      expect(serialized).not.toContain('accessToken');
      expect(serialized).not.toContain('v1:');
      expect(serialized).not.toContain('ciphertext');
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

    it('marks all providers as sandbox when dev sandbox is enabled', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user' });
      mockGetUserByClerkId.mockResolvedValue(mockUserWithTeam);
      mockRequireRole.mockResolvedValue({ allowed: true, userRole: 'MEMBER' });
      mockDevSandboxEnabled.mockReturnValue(true);
      mockFindMany.mockResolvedValue([]);

      const response = await GET(mockGetRequest('http://localhost/api/integrations'));
      const body = await response.json();

      expect(body.integrations.hubspot.sandbox).toBe(true);
      expect(body.integrations.salesforce.sandbox).toBe(true);
      expect(body.integrations.teams.sandbox).toBe(true);
      expect(body.integrations.slack.sandbox).toBe(true);
      expect(body.integrations.google_calendar.sandbox).toBe(true);
    });

    it('marks all providers as non-sandbox when dev sandbox is disabled', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user' });
      mockGetUserByClerkId.mockResolvedValue(mockUserWithTeam);
      mockRequireRole.mockResolvedValue({ allowed: true, userRole: 'MEMBER' });
      mockDevSandboxEnabled.mockReturnValue(false);
      mockFindMany.mockResolvedValue([]);

      const response = await GET(mockGetRequest('http://localhost/api/integrations'));
      const body = await response.json();

      expect(body.integrations.hubspot.sandbox).toBe(false);
      expect(body.integrations.salesforce.sandbox).toBe(false);
      expect(body.integrations.teams.sandbox).toBe(false);
      expect(body.integrations.slack.sandbox).toBe(false);
      expect(body.integrations.google_calendar.sandbox).toBe(false);
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

  describe('Salesforce PKCE (S256)', () => {
    const SALESFORCE_ENV = (key: string) => {
      if (key === 'NEXT_PUBLIC_APP_URL') return 'http://localhost:3000';
      if (key === 'SALESFORCE_CLIENT_ID') return 'sf-client-id';
      return '';
    };

    function mockPostRequest(url: string, body: unknown): NextRequest {
      return new Request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }) as unknown as NextRequest;
    }

    function mockSalesforceCookie(nonce: string, verifier?: string) {
      mockCookieStore.get.mockImplementation((key: string) => {
        if (key === 'oauth_salesforce') {
          return { value: verifier === undefined ? nonce : `${nonce}:${verifier}` };
        }
        return undefined;
      });
    }

    it('auth-url issues a nonce:verifier cookie and an S256 code_challenge derived from it', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user' });
      mockGetUserByClerkId.mockResolvedValue(mockUserWithTeam);
      mockRequireRole.mockResolvedValue({ allowed: true, userRole: 'MEMBER' });
      mockGetSecret.mockImplementation(SALESFORCE_ENV);
      mockDevSandboxEnabled.mockReturnValue(false);
      mockDevSandboxCredentials.mockReturnValue(null);

      const response = await GET(
        mockGetRequest('http://localhost/api/integrations?action=auth-url&provider=salesforce'),
      );
      const body = await response.json();

      expect(response.status).toBe(200);

      // The verifier travels server-side in the existing nonce cookie.
      const setCall = mockCookieStore.set.mock.calls.find(
        (call) => call[0] === 'oauth_salesforce',
      );
      expect(setCall).toBeDefined();
      const cookieValue = (setCall as [string, string, unknown])[1];
      const [nonce, verifier] = cookieValue.split(':');
      expect(nonce).toMatch(/^[0-9a-f]{32}$/);
      expect(verifier).toMatch(/^[A-Za-z0-9\-_~]{43,128}$/);

      const authUrl = new URL(body.authUrl);
      expect(authUrl.searchParams.get('state')).toBe(`salesforce:${nonce}`);
      expect(authUrl.searchParams.get('code_challenge_method')).toBe('S256');
      const expectedChallenge = crypto.createHash('sha256').update(verifier).digest('base64url');
      expect(authUrl.searchParams.get('code_challenge')).toBe(expectedChallenge);
    });

    it('exchanges the code with code_verifier and without client_secret', async () => {
      const nonce = 'c'.repeat(32);
      const verifier = 'd'.repeat(64);
      mockAuth.mockResolvedValue({ userId: 'test-user' });
      mockGetUserByClerkId.mockResolvedValue(mockUserWithTeam);
      mockRequireRole.mockResolvedValue({ allowed: true, userRole: 'ADMIN' });
      mockCookieStore.get.mockClear();
      mockSalesforceCookie(nonce, verifier);
      mockGetSecret.mockImplementation(SALESFORCE_ENV);
      mockDevSandboxEnabled.mockReturnValue(false);
      mockDevSandboxCredentials.mockReturnValue(null);

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'sf-access-token',
          refresh_token: 'sf-refresh-token',
          instance_url: 'https://example.my.salesforce.com',
          scope: 'api refresh_token offline_access',
          token_type: 'Bearer',
        }),
      });
      vi.stubGlobal('fetch', fetchMock);

      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: 'int-1',
        provider: 'salesforce',
        syncedAt: new Date('2025-01-15T00:00:00.000Z'),
      });

      const response = await POST(
        mockPostRequest('http://localhost/api/integrations', {
          provider: 'salesforce',
          code: 'sf-auth-code',
          state: `salesforce:${nonce}`,
        }),
      );

      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [tokenUrl, init] = fetchMock.mock.calls[0] as [
        string,
        { body: URLSearchParams },
      ];
      expect(tokenUrl).toContain('services/oauth2/token');
      expect(init.body.get('code_verifier')).toBe(verifier);
      expect(init.body.get('client_secret')).toBeNull();
      expect(mockCookieStore.delete).toHaveBeenCalledWith('oauth_salesforce');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            teamId: 'team-1',
            provider: 'salesforce',
            config: expect.stringContaining('sf-access-token'),
          }),
        }),
      );
      vi.unstubAllGlobals();
    });

    it('rejects an exchange when the cookie holds a legacy nonce without a verifier', async () => {
      const nonce = 'e'.repeat(32);
      mockAuth.mockResolvedValue({ userId: 'test-user' });
      mockGetUserByClerkId.mockResolvedValue(mockUserWithTeam);
      mockCookieStore.get.mockClear();
      mockSalesforceCookie(nonce);

      const response = await POST(
        mockPostRequest('http://localhost/api/integrations', {
          provider: 'salesforce',
          code: 'sf-auth-code',
          state: `salesforce:${nonce}`,
        }),
      );

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: 'Invalid OAuth state' });
    });

    it('rejects an exchange when the verifier does not match the nonce', async () => {
      const nonce = 'f'.repeat(32);
      mockAuth.mockResolvedValue({ userId: 'test-user' });
      mockGetUserByClerkId.mockResolvedValue(mockUserWithTeam);
      mockCookieStore.get.mockClear();
      mockSalesforceCookie('g'.repeat(32), 'h'.repeat(64));

      const response = await POST(
        mockPostRequest('http://localhost/api/integrations', {
          provider: 'salesforce',
          code: 'sf-auth-code',
          state: `salesforce:${nonce}`,
        }),
      );

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: 'Invalid OAuth state' });
    });

    it('returns 403 for a member attempting the exchange', async () => {
      const nonce = 'i'.repeat(32);
      const verifier = 'j'.repeat(64);
      mockAuth.mockResolvedValue({ userId: 'test-user' });
      mockGetUserByClerkId.mockResolvedValue(mockUserWithTeam);
      mockCookieStore.get.mockClear();
      mockSalesforceCookie(nonce, verifier);
      mockRequireRole.mockResolvedValue({ allowed: false, userRole: 'MEMBER' });

      const response = await POST(
        mockPostRequest('http://localhost/api/integrations', {
          provider: 'salesforce',
          code: 'sf-auth-code',
          state: `salesforce:${nonce}`,
        }),
      );

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
    });

    it('keeps non-PKCE providers working with a plain nonce cookie', async () => {
      const nonce = 'k'.repeat(32);
      mockAuth.mockResolvedValue({ userId: 'test-user' });
      mockGetUserByClerkId.mockResolvedValue(mockUserWithTeam);
      mockRequireRole.mockResolvedValue({ allowed: true, userRole: 'ADMIN' });
      mockCookieStore.get.mockClear();
      mockCookieStore.get.mockImplementation((key: string) => {
        if (key === 'oauth_hubspot') return { value: nonce };
        return undefined;
      });
      mockDevSandboxEnabled.mockReturnValue(true);
      mockDevSandboxCredentials.mockReturnValue({
        clientId: 'dev-hubspot-client-id',
        clientSecret: 'dev-hubspot-client-secret',
        redirectUri: 'http://localhost:3000/integrations',
        scope: ['crm.objects.contacts.read'],
        notesUrl: 'https://developers.hubspot.com/',
      });
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: 'int-2',
        provider: 'hubspot',
        syncedAt: new Date('2025-01-15T00:00:00.000Z'),
      });

      const response = await POST(
        mockPostRequest('http://localhost/api/integrations', {
          provider: 'hubspot',
          code: 'hs-code',
          state: `hubspot:${nonce}`,
        }),
      );

      expect(response.status).toBe(200);
    });
  });

  describe('token encryption at rest (ENCRYPTION_KEY set)', () => {
    const nonce = 'l'.repeat(32);

    function mockPostRequest(url: string, body: unknown): NextRequest {
      return new Request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }) as unknown as NextRequest;
    }

    function mockHubspotSandbox() {
      mockAuth.mockResolvedValue({ userId: 'test-user' });
      mockGetUserByClerkId.mockResolvedValue(mockUserWithTeam);
      mockRequireRole.mockResolvedValue({ allowed: true, userRole: 'ADMIN' });
      mockCookieStore.get.mockClear();
      mockCookieStore.get.mockImplementation((key: string) => {
        if (key === 'oauth_hubspot') return { value: nonce };
        return undefined;
      });
      mockDevSandboxEnabled.mockReturnValue(true);
      mockDevSandboxCredentials.mockReturnValue({
        clientId: 'dev-hubspot-client-id',
        clientSecret: 'dev-hubspot-client-secret',
        redirectUri: 'http://localhost:3000/integrations',
        scope: ['crm.objects.contacts.read'],
        notesUrl: 'https://developers.hubspot.com/',
      });
      mockGetSecret.mockImplementation((key: string) =>
        key === 'ENCRYPTION_KEY' ? TEST_ENCRYPTION_KEY : '',
      );
    }

    it('POST exchange persists an encrypted v1: envelope that round-trips', async () => {
      mockHubspotSandbox();
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: 'int-3',
        provider: 'hubspot',
        syncedAt: new Date('2025-01-15T00:00:00.000Z'),
      });

      const response = await POST(
        mockPostRequest('http://localhost/api/integrations', {
          provider: 'hubspot',
          code: 'hs-code',
          state: `hubspot:${nonce}`,
        }),
      );

      expect(response.status).toBe(200);

      const createCall = mockCreate.mock.calls[0][0] as {
        data: { config: string };
      };
      const stored = createCall.data.config;

      // Envelope format, no plaintext token anywhere in it.
      expect(stored.startsWith('v1:')).toBe(true);
      expect(stored).not.toContain('dev-hubspot-access-token');
      expect(stored).not.toContain('accessToken');

      // Round-trips back to the exchanged config.
      const decrypted = decryptConfig(stored);
      expect(decrypted).not.toBeNull();
      expect(JSON.parse(decrypted as string)).toMatchObject({
        accessToken: 'dev-hubspot-access-token:hs-code',
        refreshToken: 'dev-hubspot-refresh-token',
        tokenType: 'Bearer',
      });
    });

    it('POST exchange still works without ENCRYPTION_KEY (legacy plaintext write)', async () => {
      mockHubspotSandbox();
      mockGetSecret.mockImplementation((key: string) => (key === 'ENCRYPTION_KEY' ? '' : ''));
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: 'int-4',
        provider: 'hubspot',
        syncedAt: new Date('2025-01-15T00:00:00.000Z'),
      });

      const response = await POST(
        mockPostRequest('http://localhost/api/integrations', {
          provider: 'hubspot',
          code: 'hs-code',
          state: `hubspot:${nonce}`,
        }),
      );

      expect(response.status).toBe(200);
      const createCall = mockCreate.mock.calls[0][0] as {
        data: { config: string };
      };
      expect(createCall.data.config).toContain('dev-hubspot-access-token');
      // Legacy plaintext read path still parses (decryptConfig passthrough).
      expect(JSON.parse(decryptConfig(createCall.data.config) as string)).toMatchObject({
        accessToken: 'dev-hubspot-access-token:hs-code',
      });
    });
  });
});
