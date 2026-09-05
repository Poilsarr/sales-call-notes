import type { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const embeddingsCreate = vi.fn();
  const chatCompletionsCreate = vi.fn();
  const createOpenAIClient = vi.fn(() => ({
    embeddings: { create: embeddingsCreate },
    chat: { completions: { create: chatCompletionsCreate } },
  }));
  return {
    auth: vi.fn(),
    callFindMany: vi.fn(),
    getUserByClerkId: vi.fn(),
    getByokKeys: vi.fn(),
    embeddingsCreate,
    chatCompletionsCreate,
    createOpenAIClient,
  };
});

vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth }));
vi.mock('@/lib/prisma', () => ({
  default: { call: { findMany: mocks.callFindMany } },
}));
vi.mock('@/lib/openai-client', () => ({ createOpenAIClient: mocks.createOpenAIClient }));
vi.mock('@/lib/get-user', () => ({ getUserByClerkId: mocks.getUserByClerkId }));
vi.mock('@/lib/byok-resolver', () => ({ getByokKeys: mocks.getByokKeys }));
vi.mock('@/lib/secrets', () => ({
  getSecret: (key: string) => (key === 'OPENAI_API_KEY' ? 'test-key' : ''),
}));

import { KnowledgeGraphService } from '@/services/ai/knowledge-graph';

const USER_ID = 'u1';

function indexedCall(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    filename: 'recording-1.mp3',
    title: null,
    summary: 'quarterly renewal talk',
    transcript: 'we should renew',
    createdAt: new Date('2026-06-01T10:00:00.000Z'),
    embedding: [0.3, 0.4],
    ...overrides,
  };
}

function titledCall(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c2',
    filename: 'recording-2.mp3',
    title: 'Acme Q3 renewal',
    summary: null,
    transcript: null,
    createdAt: new Date('2026-06-02T10:00:00.000Z'),
    ...overrides,
  };
}

describe('KnowledgeGraphService.searchByQuery title fallback', () => {
  let kg: KnowledgeGraphService;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.embeddingsCreate.mockResolvedValue({ data: [{ embedding: [0.1, 0.2] }] });
    kg = new KnowledgeGraphService();
  });

  it('queries title matches and merges them with a similarity floor', async () => {
    mocks.callFindMany
      .mockResolvedValueOnce([indexedCall()])
      .mockResolvedValueOnce([titledCall()]);

    const results = await kg.searchByQuery('Acme', USER_ID);

    expect(mocks.callFindMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { userId: USER_ID, title: { contains: 'Acme', mode: 'insensitive' } },
      }),
    );
    expect(results.map(r => r.id)).toEqual(['c1', 'c2']);
    expect(results[0].similarity).toBeGreaterThan(0.6);
    expect(results[1]).toMatchObject({ id: 'c2', title: 'Acme Q3 renewal', similarity: 0.95 });
  });

  it('does not select transcripts by default (search route strips them)', async () => {
    mocks.callFindMany.mockResolvedValueOnce([indexedCall()]).mockResolvedValueOnce([]);

    await kg.searchByQuery('Acme', USER_ID);

    const candidateSelect = mocks.callFindMany.mock.calls[0][0].select;
    expect(candidateSelect.transcript).toBeUndefined();
    expect(candidateSelect.embedding).toBe(true);
  });

  it('includes transcripts when requested (chat context needs them)', async () => {
    mocks.callFindMany.mockResolvedValueOnce([indexedCall()]).mockResolvedValueOnce([]);

    const results = await kg.searchByQuery('Acme', USER_ID, 5, undefined, true);

    expect(results[0].transcript).toBe('we should renew');
    expect(mocks.callFindMany.mock.calls[0][0].select.transcript).toBe(true);
  });

  it('surfaces an exact title match even when vector results fill the limit', async () => {
    const calls = ['c1', 'c3', 'c4', 'c5', 'c6'].map((id, i) =>
      indexedCall({ id, embedding: [0.1, 0.1 * (i + 1)] })
    );
    mocks.callFindMany.mockResolvedValueOnce(calls).mockResolvedValueOnce([titledCall()]);

    const results = await kg.searchByQuery('Acme Q3 renewal', USER_ID, 5);

    expect(results.map(r => r.id)).toContain('c2');
    expect(results.length).toBe(5);
    expect(results.find(r => r.id === 'c2')!.similarity).toBe(0.95);
  });

  it('dedupes by id and keeps vector results first', async () => {
    const call = indexedCall({ title: 'Acme Q3 renewal' });
    mocks.callFindMany.mockResolvedValueOnce([call]).mockResolvedValueOnce([call]);

    const results = await kg.searchByQuery('Acme Q3 renewal', USER_ID);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('c1');
    expect(results[0].title).toBe('Acme Q3 renewal');
  });

  it('returns title matches when no embedded calls exist', async () => {
    mocks.callFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([titledCall()]);

    const results = await kg.searchByQuery('Acme', USER_ID);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ id: 'c2', similarity: 0.95 });
  });
});

describe('/api/chat POST callContext includes title', () => {
  let searchSpy: ReturnType<typeof vi.spyOn> | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: USER_ID });
    mocks.getUserByClerkId.mockResolvedValue({ id: 'user-db-id', plan: 'pro' });
    mocks.getByokKeys.mockResolvedValue({ openaiKey: 'sk-byok-test', groqKey: undefined, dropped: [] });
    mocks.embeddingsCreate.mockResolvedValue({ data: [{ embedding: [0.1, 0.2] }] });
    mocks.chatCompletionsCreate.mockResolvedValue({
      choices: [{ message: { content: 'The renewal call went well.' } }],
    });
  });

  afterEach(() => {
    searchSpy?.mockRestore();
    searchSpy = undefined;
  });

  it('passes the call title into the LLM context', async () => {
    mocks.callFindMany
      .mockResolvedValueOnce([indexedCall({ title: 'Acme Q3 renewal' })])
      .mockResolvedValueOnce([]);

    const { POST } = await import('@/app/api/chat/route');
    const res = await POST(
      new Request('http://x/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: 'Acme Q3 renewal' }),
      }) as unknown as NextRequest,
    );

    expect(res.status).toBe(200);
    const createArgs = mocks.chatCompletionsCreate.mock.calls[0][0];
    expect(createArgs.messages[1].content).toContain('"title": "Acme Q3 renewal"');
  });

  it('scopes RAG to the DB user id and passes the user BYOK key to retrieval', async () => {
    mocks.callFindMany.mockResolvedValue([]);

    searchSpy = vi.spyOn(KnowledgeGraphService.prototype, 'searchByQuery');

    const { POST } = await import('@/app/api/chat/route');
    const res = await POST(
      new Request('http://x/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: 'query-arg' }),
      }) as unknown as NextRequest,
    );

    expect(res.status).toBe(200);
    expect(mocks.getUserByClerkId).toHaveBeenCalledWith(USER_ID);
    expect(mocks.getByokKeys).toHaveBeenCalledWith('user-db-id');
    expect(searchSpy).toHaveBeenCalledWith('query-arg', 'user-db-id', 5, 'sk-byok-test', true);
  });

  it('returns 403 with PLAN_REQUIRED for free-plan users', async () => {
    mocks.getUserByClerkId.mockResolvedValueOnce({ id: 'user-db-id', plan: 'free' });

    const { POST } = await import('@/app/api/chat/route');
    const res = await POST(
      new Request('http://x/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: 'hello' }),
      }) as unknown as NextRequest,
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('PLAN_REQUIRED');
  });
});
