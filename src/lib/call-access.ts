export interface CallViewer {
  id: string;
  teamId: string | null;
  teamRole: string;
}

export interface CallAccessRecord {
  userId: string;
  teamId: string | null;
  sharedWithTeam: boolean;
}

export function canAccessCall(viewer: CallViewer, call: CallAccessRecord): boolean {
  if (viewer.id === call.userId) return true;

  return Boolean(
    call.sharedWithTeam &&
      viewer.teamId &&
      call.teamId &&
      viewer.teamId === call.teamId,
  );
}

export function canManageCall(viewer: CallViewer, call: CallAccessRecord): boolean {
  if (viewer.id === call.userId) return true;

  return Boolean(
    viewer.teamRole === 'ADMIN' &&
      viewer.teamId &&
      call.teamId &&
      viewer.teamId === call.teamId,
  );
}
