import { describe, expect, it } from 'vitest';

import { canAccessCall, canManageCall } from '@/lib/call-access';

describe('call access helpers', () => {
  const owner = { id: 'user_owner', teamId: 'team_1', teamRole: 'ADMIN' };
  const teammate = { id: 'user_member', teamId: 'team_1', teamRole: 'MEMBER' };
  const outsider = { id: 'user_other', teamId: 'team_2', teamRole: 'MEMBER' };

  it('allows owners and shared teammates to access a call', () => {
    const call = { userId: 'user_owner', teamId: 'team_1', sharedWithTeam: true };

    expect(canAccessCall(owner, call)).toBe(true);
    expect(canAccessCall(teammate, call)).toBe(true);
    expect(canAccessCall(outsider, call)).toBe(false);
  });

  it('limits collaboration management to the owner or a same-team admin', () => {
    const call = { userId: 'user_owner', teamId: 'team_1', sharedWithTeam: true };

    expect(canManageCall(owner, call)).toBe(true);
    expect(canManageCall(teammate, call)).toBe(false);
    expect(canManageCall(outsider, call)).toBe(false);
  });
});
