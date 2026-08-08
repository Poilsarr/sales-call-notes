import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  authMock,
  getUserMock,
  callFindUniqueMock,
  callUpdateMock,
  userFindUniqueMock,
  cacheDelMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  getUserMock: vi.fn(),
  callFindUniqueMock: vi.fn(),
  callUpdateMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
  cacheDelMock: vi.fn(),
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
      findUnique: callFindUniqueMock,
      update: callUpdateMock,
    },
    user: {
      findUnique: userFindUniqueMock,
    },
  },
}));

vi.mock('@/lib/cache', async () => {
  const actual = await vi.importActual<typeof import('@/lib/cache')>('@/lib/cache');
  return { ...actual, cacheDel: cacheDelMock };
});

import { PATCH } from '@/app/api/history/[id]/route';
import { makeCacheKey } from '@/lib/cache';

const CLERK_USER_ID = 'user_2xxx';
const DB_USER_ID = 'cm_db_id_1';

const CALL = {
  id: 'call_1',
  userId: DB_USER_ID,
  teamId: null,
  sharedWithTeam: false,
  filename: 'recording.mp3',
};

const VIEWER = { id: DB_USER_ID, teamId: null, teamRole: 'OWNER' };

function patch(body: unknown, id = 'call_1') {
  return PATCH(
    new Request(`http://x/api/history/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

describe('PATCH /api/history/[id] — title write path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ userId: CLERK_USER_ID });
    getUserMock.mockResolvedValue(VIEWER);
    callFindUniqueMock.mockResolvedValue(CALL);
  });

  it('stores a validated title and returns title + displayName', async () => {
    callUpdateMock.mockResolvedValue({
      ...CALL,
      title: 'Acme renewal',
      assignee: null,
    });

    const response = await patch({ title: '  Acme renewal  ' });

    expect(response.status).toBe(200);
    expect(callUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'call_1' },
        data: expect.objectContaining({ title: 'Acme renewal' }),
      }),
    );
    await expect(response.json()).resolves.toEqual({
      sharedWithTeam: false,
      assignee: null,
      title: 'Acme renewal',
      displayName: 'Acme renewal',
    });
  });

  it('clears title with null / empty string', async () => {
    callUpdateMock.mockResolvedValue({
      ...CALL,
      title: null,
      assignee: null,
    });

    const response = await patch({ title: '' });

    expect(response.status).toBe(200);
    expect(callUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: null }),
      }),
    );

    callUpdateMock.mockClear();
    callUpdateMock.mockResolvedValue({
      ...CALL,
      title: null,
      assignee: null,
    });

    const nullResponse = await patch({ title: null });

    expect(nullResponse.status).toBe(200);
    expect(callUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: null }),
      }),
    );
  });

  it('returns 400 for non-string title', async () => {
    const response = await patch({ title: 123 });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'title must be a string or null',
    });
    expect(callUpdateMock).not.toHaveBeenCalled();
  });

  it('returns 400 for >120 code points', async () => {
    const response = await patch({ title: '😀'.repeat(121) });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Title must be 120 characters or fewer',
    });
    expect(callUpdateMock).not.toHaveBeenCalled();
  });

  it('leaves title untouched when body omits it (guarded spread)', async () => {
    callFindUniqueMock.mockResolvedValue({ ...CALL, teamId: 'team_a' });
    callUpdateMock.mockResolvedValue({
      ...CALL,
      teamId: 'team_a',
      sharedWithTeam: true,
      title: null,
      assignee: null,
    });

    const response = await patch({ sharedWithTeam: true });

    expect(response.status).toBe(200);
    const updateArgs = callUpdateMock.mock.calls[0][0];
    expect(updateArgs.data).toEqual({ sharedWithTeam: true });
    expect(updateArgs.data).not.toHaveProperty('title');
  });

  it('returns 401 unauthenticated / 403 non-owner', async () => {
    authMock.mockResolvedValue({ userId: null });

    const unauthResponse = await patch({ title: 'Acme renewal' });

    expect(unauthResponse.status).toBe(401);
    await expect(unauthResponse.json()).resolves.toEqual({ error: 'Unauthorized' });
    expect(callFindUniqueMock).not.toHaveBeenCalled();

    authMock.mockResolvedValue({ userId: CLERK_USER_ID });
    getUserMock.mockResolvedValue({ id: 'cm_db_id_2', teamId: null, teamRole: 'MEMBER' });

    const forbiddenResponse = await patch({ title: 'Acme renewal' });

    expect(forbiddenResponse.status).toBe(403);
    await expect(forbiddenResponse.json()).resolves.toEqual({ error: 'Access denied' });
    expect(callUpdateMock).not.toHaveBeenCalled();
  });

  it('invalidates the detail cache key after a successful rename', async () => {
    callUpdateMock.mockResolvedValue({
      ...CALL,
      title: 'Acme renewal',
      assignee: null,
    });

    await patch({ title: 'Acme renewal' });

    expect(cacheDelMock).toHaveBeenCalledWith(makeCacheKey('calls', DB_USER_ID, 'call_1'));
  });
});
