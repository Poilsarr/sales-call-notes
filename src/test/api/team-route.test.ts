import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma + auth BEFORE route imports — they need to be hoisted.
// NOTE: route imports `prisma` default from '@/lib/prisma' and
// `getUserByClerkId` from '@/lib/get-user' (which itself imports prisma),
// so '@/lib/get-user' is mocked entirely to keep its prisma import from loading.
vi.mock("@/lib/prisma", () => ({
  default: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    team: { findUnique: vi.fn(), create: vi.fn() },
    call: { findMany: vi.fn(), updateMany: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/get-user", () => ({
  getUserByClerkId: vi.fn(),
}));

vi.mock("@/lib/rbac", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/lib/audit-logger", () => ({
  logAuditAction: vi.fn(),
}));

import { GET, POST, DELETE } from "@/app/api/team/route";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/get-user";
import { requireRole } from "@/lib/rbac";
import { logAuditAction } from "@/lib/audit-logger";
import prisma from "@/lib/prisma";

const mockAuth = vi.mocked(auth);
const mockGetUser = vi.mocked(getUserByClerkId);
const mockRequireRole = vi.mocked(requireRole);
const mockLog = vi.mocked(logAuditAction);
const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  team: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  call: { findMany: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> };
  auditLog: { create: ReturnType<typeof vi.fn> };
};

function postRequest(body: unknown): Request {
  return new Request("http://x", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function deleteRequest(body: unknown): Request {
  return new Request("http://x", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: "clerk_1" } as any);
});

describe("GET /api/team", () => {
  it("returns 401 when unauthenticated and does not query prisma", async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as any);
    const r = await GET();
    expect(r.status).toBe(401);
    expect(await r.json()).toEqual({ error: "Unauthorized" });
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns 200 with empty team payload for a solo user", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "user_1",
      clerkId: "clerk_1",
      teamId: null,
      team: null,
    } as any);
    const r = await GET();
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({
      members: [],
      teamName: null,
      slug: null,
      sharedCalls: [],
      teamAnalytics: {
        sharedCalls: 0,
        avgHealthScore: 0,
        openActionItems: 0,
        assignedCalls: 0,
      },
    });
    expect(mockPrisma.call.findMany).not.toHaveBeenCalled();
  });

  it("returns 200 with team members and analytics for a team member", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "user_1",
      clerkId: "clerk_1",
      teamId: "t_1",
      team: {
        id: "t_1",
        name: "Acme Team",
        slug: "team-1",
        members: [
          { id: "user_1", name: "Alice", email: "a@x.com", teamRole: "ADMIN", avatar: null },
          { id: "user_2", name: "Bob", email: "b@x.com", teamRole: "MEMBER", avatar: null },
        ],
      },
    } as any);
    mockPrisma.call.findMany.mockResolvedValueOnce([]);
    const r = await GET();
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.members).toHaveLength(2);
    expect(body.teamName).toBe("Acme Team");
    expect(body.slug).toBe("team-1");
    expect(body.sharedCalls).toEqual([]);
    expect(body.teamAnalytics).toEqual({
      sharedCalls: 0,
      avgHealthScore: 0,
      openActionItems: 0,
      assignedCalls: 0,
    });
    expect(mockPrisma.call.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { teamId: "t_1", sharedWithTeam: true },
        take: 8,
      }),
    );
  });
});

describe("POST /api/team", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as any);
    const r = await POST(postRequest({ email: "b@x.com" }));
    expect(r.status).toBe(401);
    expect(await r.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when email is missing", async () => {
    const r = await POST(postRequest({}));
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: "Email is required" });
  });

  it("returns 404 when invitee has not signed up", async () => {
    mockGetUser.mockResolvedValueOnce({
      id: "user_1",
      teamId: null,
      name: "Alice",
      email: "a@x.com",
    } as any);
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    const r = await POST(postRequest({ email: "b@x.com" }));
    expect(r.status).toBe(404);
    expect(await r.json()).toEqual({
      error: "User not found — they need to sign up first",
    });
  });

  it("returns 409 when invitee is already on a team", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "user_1", teamId: null } as any);
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "user_2",
      teamId: "t_other",
    } as any);
    const r = await POST(postRequest({ email: "b@x.com" }));
    expect(r.status).toBe(409);
    expect(await r.json()).toEqual({ error: "User is already on a team" });
  });

  it("returns 403 when a non-admin invites on an existing team", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "user_1", teamId: "t_1" } as any);
    mockRequireRole.mockResolvedValueOnce({ userRole: "MEMBER", allowed: false });
    const r = await POST(postRequest({ email: "b@x.com" }));
    expect(r.status).toBe(403);
    expect(await r.json()).toEqual({ error: "Only admins can invite members" });
    expect(mockPrisma.team.create).not.toHaveBeenCalled();
  });

  it("creates a team, invites the member, backfills calls, and logs the audit entry", async () => {
    mockGetUser.mockResolvedValueOnce({
      id: "user_1",
      teamId: null,
      name: "Alice",
      email: "a@x.com",
    } as any);
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "user_2",
      email: "b@x.com",
      teamId: null,
    } as any);
    mockPrisma.team.create.mockResolvedValueOnce({ id: "t_new" } as any);
    // Refetch after the invite — must include the members select.
    mockPrisma.team.findUnique.mockResolvedValueOnce({
      id: "t_new",
      name: "Alice's Team",
      slug: "team-user_1",
      members: [
        { id: "user_1", name: "Alice", email: "a@x.com", teamRole: "ADMIN", avatar: null },
        { id: "user_2", name: null, email: "b@x.com", teamRole: "MEMBER", avatar: null },
      ],
    } as any);

    const r = await POST(postRequest({ email: "b@x.com" }));
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.message).toBe("Member invited");
    expect(body.members).toHaveLength(2);
    expect(body.teamName).toBe("Alice's Team");
    expect(body.slug).toBe("team-user_1");

    expect(mockPrisma.team.create).toHaveBeenCalledWith({
      data: { name: "Alice's Team", slug: "team-user_1", ownerId: "user_1" },
    });

    // Both user.update calls: inviter promoted to ADMIN, target set to MEMBER.
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user_1" },
        data: expect.objectContaining({ teamId: "t_new", teamRole: "ADMIN" }),
      }),
    );
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user_2" },
        data: expect.objectContaining({ teamId: "t_new", teamRole: "MEMBER" }),
      }),
    );

    // Backfill of inviter's pre-team calls.
    expect(mockPrisma.call.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_1", teamId: null } }),
    );

    expect(mockLog).toHaveBeenCalledWith(
      "user_1",
      "INVITE_MEMBER",
      "user_2",
      "User",
      expect.objectContaining({ teamId: "t_new" }),
    );
  });
});

describe("DELETE /api/team", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as any);
    const r = await DELETE(deleteRequest({ memberId: "user_2" }));
    expect(r.status).toBe(401);
    expect(await r.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 403 when a non-admin removes a member", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "user_1", teamId: "t_1" } as any);
    mockRequireRole.mockResolvedValueOnce({ userRole: "MEMBER", allowed: false });
    const r = await DELETE(deleteRequest({ memberId: "user_2" }));
    expect(r.status).toBe(403);
    expect(await r.json()).toEqual({ error: "Only admins can remove members" });
  });

  it("returns 400 when removing yourself", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "user_1", teamId: null } as any);
    const r = await DELETE(deleteRequest({ memberId: "user_1" }));
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: "Cannot remove yourself" });
  });

  it("returns 404 when the member is not on your team", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "user_1", teamId: "t_1" } as any);
    mockRequireRole.mockResolvedValueOnce({ userRole: "ADMIN", allowed: true });
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "user_2",
      teamId: "t_2",
    } as any);
    const r = await DELETE(deleteRequest({ memberId: "user_2" }));
    expect(r.status).toBe(404);
    expect(await r.json()).toEqual({ error: "Member not found on your team" });
  });

  it("removes the member, updates the row, and logs the audit entry", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "user_1", teamId: "t_1" } as any);
    mockRequireRole.mockResolvedValueOnce({ userRole: "ADMIN", allowed: true });
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "user_2",
      teamId: "t_1",
    } as any);
    const r = await DELETE(deleteRequest({ memberId: "user_2" }));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ message: "Member removed" });
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user_2" },
      data: { teamId: null, teamRole: "MEMBER" },
    });
    expect(mockLog).toHaveBeenCalledWith(
      "user_1",
      "REMOVE_MEMBER",
      "user_2",
      "User",
      { teamId: "t_1" },
    );
  });
});
