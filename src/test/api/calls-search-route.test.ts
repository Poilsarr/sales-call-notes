import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const searchByQuery = vi.fn();
  const getByokKeys = vi.fn();
  const checkRateLimit = vi.fn();
  return {
    auth: vi.fn(),
    getUserByClerkId: vi.fn(),
    searchByQuery,
    getByokKeys,
    checkRateLimit,
    cacheGet: vi.fn(),
    cacheSet: vi.fn(),
  };
});

vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth }));
vi.mock('@/lib/get-user', () => ({ getUserByClerkId: mocks.getUserByClerkId }));
vi.mock('@/lib/byok-resolver', () => ({ getByokKeys: mocks.getByokKeys }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock('@/lib/cache', () => ({
  cacheGet: mocks.cacheGet,
  cacheSet: mocks.cacheSet,
  makeCacheKey: (...parts: string[]) => parts.join(':'),
}));
vi.mock('@/services/ai/knowledge-graph', () => ({
  KnowledgeGraphService: vi.fn().mockImplementation(function () {
    return { searchByQuery: mocks.searchByQuery };
  }),
}));

import { POST } from '@/app/api/calls/search/route';

const USER_ID = 'db-user-1';

function jsonResponse(res: Response) {
  return res.json();
}

function makeRequest(body: unknown): NextRequest {
  return {
    json: () => Promise.resolve(body),
  } as unknown as NextRequest;
}

function result(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    filename: 'recording-1.mp3',
    title: null,
    summary: 'quarterly renewal talk',
    transcript: 'we should renew',
    createdAt: new Date('2026-06-01T10:00:00.000Z'),
    similarity: 0.87,
    ...overrides,
  };
}

describe('POST /api/calls/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: 'clerk-u1' });
    mocks.getUserByClerkId.mockResolvedValue({ id: USER_ID });
    mocks.getByokKeys.mockResolvedValue({ dropped: [] });
    mocks.searchByQuery.mockResolvedValue([result()]);
    mocks.checkRateLimit.mockResolvedValue({ success: true });
    mocks.cacheGet.mockResolvedValue(null);
    mocks.cacheSet.mockResolvedValue(undefined);
  });

  it('returns 401 when unauthenticated', async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    const res = await POST(makeRequest({ query: 'renewal' }));

    expect(res.status).toBe(401);
    expect(await jsonResponse(res)).toEqual({ error: 'Unauthorized' });
    expect(mocks.searchByQuery).not.toHaveBeenCalled();
  });

  it('returns 400 when the query is missing', async () => {
    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
    expect(mocks.searchByQuery).not.toHaveBeenCalled();
  });

  it('returns 400 when the query is whitespace', async () => {
    const res = await POST(makeRequest({ query: '   ' }));

    expect(res.status).toBe(400);
    expect(mocks.searchByQuery).not.toHaveBeenCalled();
  });

  it('returns 400 for a too-short query (under 2 chars)', async () => {
    const res = await POST(makeRequest({ query: 'a' }));

    expect(res.status).toBe(400);
    expect(mocks.searchByQuery).not.toHaveBeenCalled();
  });

  it('returns 400 when the query is not a string', async () => {
    const res = await POST(makeRequest({ query: 42 }));

    expect(res.status).toBe(400);
    expect(mocks.searchByQuery).not.toHaveBeenCalled();
  });

  it('returns 401 when the Clerk user has no Gauge account', async () => {
    mocks.getUserByClerkId.mockResolvedValue(null);

    const res = await POST(makeRequest({ query: 'renewal' }));

    expect(res.status).toBe(401);
    expect(mocks.searchByQuery).not.toHaveBeenCalled();
  });

  it('searches with the user BYOK OpenAI key when one is stored', async () => {
    mocks.getByokKeys.mockResolvedValue({
      openaiKey: 'sk-proj-byok-key',
      groqKey: 'gsk_groq_key',
      dropped: [],
    });

    const res = await POST(makeRequest({ query: 'renewal talk' }));

    expect(res.status).toBe(200);
    expect(mocks.getByokKeys).toHaveBeenCalledWith(USER_ID);
    expect(mocks.searchByQuery).toHaveBeenCalledWith('renewal talk', USER_ID, 5, 'sk-proj-byok-key');
  });

  it('searches without a key when the user has none stored (shared pool)', async () => {
    const res = await POST(makeRequest({ query: 'renewal talk' }));

    expect(res.status).toBe(200);
    expect(mocks.searchByQuery).toHaveBeenCalledWith('renewal talk', USER_ID, 5, undefined);
  });

  it('returns ranked results without the transcript field', async () => {
    mocks.searchByQuery.mockResolvedValue([
      result({ id: 'c2', similarity: 0.9, title: 'Acme Q3 renewal' }),
      result({ id: 'c1', similarity: 0.6 }),
    ]);

    const res = await POST(makeRequest({ query: 'renewal' }));
    const payload = await jsonResponse(res);

    expect(res.status).toBe(200);
    expect(payload.results).toEqual([
      {
        id: 'c2',
        filename: 'recording-1.mp3',
        title: 'Acme Q3 renewal',
        summary: 'quarterly renewal talk',
        date: '2026-06-01T10:00:00.000Z',
        similarity: 0.9,
      },
      {
        id: 'c1',
        filename: 'recording-1.mp3',
        title: null,
        summary: 'quarterly renewal talk',
        date: '2026-06-01T10:00:00.000Z',
        similarity: 0.6,
      },
    ]);
    expect(JSON.stringify(payload)).not.toContain('transcript');
    expect(payload.degraded).toBe(false);
  });

  it('returns empty results when nothing matches', async () => {
    mocks.searchByQuery.mockResolvedValue([]);

    const res = await POST(makeRequest({ query: 'renewal' }));
    const payload = await jsonResponse(res);

    expect(res.status).toBe(200);
    expect(payload.results).toEqual([]);
    expect(payload.degraded).toBe(false);
  });

  it('degrades to 503 (never 500) when the knowledge graph throws — no raw error echo', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.searchByQuery.mockRejectedValue(
      new Error('Embeddings unavailable: set OPENAI_API_KEY in env vars (or provide a user BYOK key).')
    );

    const res = await POST(makeRequest({ query: 'renewal' }));
    const payload = await jsonResponse(res);

    expect(res.status).toBe(503);
    expect(payload).toEqual({ error: 'Search unavailable. Please try again.' });
    expect(JSON.stringify(payload)).not.toContain('OPENAI_API_KEY');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('degrades to 503 on any unexpected service error, logging server-side', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.searchByQuery.mockRejectedValue(new Error('boom'));

    const res = await POST(makeRequest({ query: 'renewal' }));

    expect(res.status).toBe(503);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('returns 429 when the rate limit is exceeded', async () => {
    mocks.checkRateLimit.mockResolvedValue({ success: false });

    const res = await POST(makeRequest({ query: 'renewal' }));

    expect(res.status).toBe(429);
    expect(mocks.searchByQuery).not.toHaveBeenCalled();
  });

  it('serves cached results without re-searching', async () => {
    mocks.cacheGet.mockResolvedValue({
      results: [result({ id: 'cached', similarity: 1 })],
      degraded: false,
    });

    const res = await POST(makeRequest({ query: 'renewal' }));
    const payload = await jsonResponse(res);

    expect(res.status).toBe(200);
    expect(payload.results[0].id).toBe('cached');
    expect(mocks.searchByQuery).not.toHaveBeenCalled();
  });

  it('marks the response degraded when the user BYOK OpenAI key was dropped', async () => {
    mocks.getByokKeys.mockResolvedValue({ dropped: ['openai'] });

    const res = await POST(makeRequest({ query: 'renewal' }));
    const payload = await jsonResponse(res);

    expect(res.status).toBe(200);
    expect(payload.degraded).toBe(true);
    expect(mocks.searchByQuery).toHaveBeenCalledWith('renewal', USER_ID, 5, undefined);
  });

  it('clamps the limit between 1 and 10', async () => {
    await POST(makeRequest({ query: 'renewal', limit: 999 }));
    expect(mocks.searchByQuery).toHaveBeenCalledWith('renewal', USER_ID, 10, undefined);

    await POST(makeRequest({ query: 'renewal', limit: -3 }));
    expect(mocks.searchByQuery).toHaveBeenLastCalledWith('renewal', USER_ID, 1, undefined);
  });

  it('trims the query and caps its length at 200 chars', async () => {
    const long = 'x'.repeat(500);
    await POST(makeRequest({ query: `  ${long}  ` }));

    const [queryArg] = mocks.searchByQuery.mock.calls[0];
    expect(queryArg).toHaveLength(200);
    expect(queryArg).toBe(long.slice(0, 200));
  });
});
