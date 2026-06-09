import { prisma } from "@/lib/prisma";

export type TeamRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export const ROLE_HIERARCHY: Record<TeamRole, number> = {
  VIEWER: 0,
  MEMBER: 10,
  ADMIN: 20,
  OWNER: 30,
};

export function hasRole(userRole: string, requiredRole: TeamRole): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as TeamRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;
  return userLevel >= requiredLevel;
}

export async function requireRole(
  clerkId: string,
  teamId: string,
  minRole: TeamRole
): Promise<{ userRole: TeamRole; allowed: boolean }> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { teamId: true, teamRole: true },
  });

  if (!user || user.teamId !== teamId) {
    return { userRole: "VIEWER", allowed: false };
  }

  const userRole = (user.teamRole as TeamRole) ?? "MEMBER";
  const allowed = hasRole(userRole, minRole);

  return { userRole, allowed };
}

export function assertRole(
  userRole: string,
  minRole: TeamRole,
  action: string
): void {
  if (!hasRole(userRole, minRole)) {
    const err = new Error(`Insufficient role for ${action}`) as Error & { status: number };
    err.status = 403;
    throw err;
  }
}
