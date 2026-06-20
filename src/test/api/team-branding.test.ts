import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma + auth BEFORE route imports — they need to be hoisted.
vi.mock("@/lib/prisma", () => ({
  default: {
    user: { findUnique: vi.fn() },
    team: { findUnique: vi.fn(), update: vi.fn() },
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

import { GET, PUT } from "@/app/api/team/branding/route";
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
  user: { findUnique: ReturnType<typeof vi.fn> };
  team: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  auditLog: { create: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: "clerk_1" } as any);
});

describe("GET /api/team/branding", () => {
  it("returns 200 with null team when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as any);
    const r = await GET();
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({
      teamId: null,
      brandColor: null,
      logoUrl: null,
    });
  });

  it("returns 200 with default color when team has no branding set", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ teamId: "t_1" });
    mockPrisma.team.findUnique.mockResolvedValueOnce({
      id: "t_1",
      brandColor: null,
      logoUrl: null,
    });
    const r = await GET();
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.teamId).toBe("t_1");
    expect(body.brandColor).toBe("#5b21b6"); // default
    expect(body.logoUrl).toBeNull();
  });

  it("returns team branding when present", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ teamId: "t_2" });
    mockPrisma.team.findUnique.mockResolvedValueOnce({
      id: "t_2",
      brandColor: "#ff00aa",
      logoUrl: "https://cdn.example.com/logo.png",
    });
    const r = await GET();
    const body = await r.json();
    expect(body.brandColor).toBe("#ff00aa");
    expect(body.logoUrl).toBe("https://cdn.example.com/logo.png");
  });

  it("returns null teamId when user has no team", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ teamId: null });
    const r = await GET();
    const body = await r.json();
    expect(body.teamId).toBeNull();
  });

  it("returns 500 on internal error", async () => {
    mockPrisma.user.findUnique.mockRejectedValueOnce(new Error("db down"));
    const r = await GET();
    expect(r.status).toBe(500);
  });
});

describe("PUT /api/team/branding", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as any);
    const r = await PUT(new Request("http://x", {
      method: "PUT",
      body: JSON.stringify({ brandColor: "#000000" }),
    }));
    expect(r.status).toBe(401);
  });

  it("returns 404 when user has no team", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "u_1", teamId: null } as any);
    const r = await PUT(new Request("http://x", {
      method: "PUT",
      body: JSON.stringify({ brandColor: "#000000" }),
    }));
    expect(r.status).toBe(404);
  });

  it("returns 403 when user lacks ADMIN role", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "u_1", teamId: "t_1" } as any);
    mockRequireRole.mockResolvedValueOnce({ userRole: "MEMBER", allowed: false });
    const r = await PUT(new Request("http://x", {
      method: "PUT",
      body: JSON.stringify({ brandColor: "#000000" }),
    }));
    expect(r.status).toBe(403);
  });

  it("returns 400 for invalid brandColor (non-hex)", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "u_1", teamId: "t_1" } as any);
    mockRequireRole.mockResolvedValueOnce({ userRole: "ADMIN", allowed: true });
    const r = await PUT(new Request("http://x", {
      method: "PUT",
      body: JSON.stringify({ brandColor: "purple" }),
    }));
    expect(r.status).toBe(400);
  });

  it("returns 400 for http:// logo URL (only https allowed)", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "u_1", teamId: "t_1" } as any);
    mockRequireRole.mockResolvedValueOnce({ userRole: "ADMIN", allowed: true });
    const r = await PUT(new Request("http://x", {
      method: "PUT",
      body: JSON.stringify({ logoUrl: "http://evil.example.com/x.png" }),
    }));
    expect(r.status).toBe(400);
  });

  it("returns 400 for javascript: URL (XSS)", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "u_1", teamId: "t_1" } as any);
    mockRequireRole.mockResolvedValueOnce({ userRole: "ADMIN", allowed: true });
    const r = await PUT(new Request("http://x", {
      method: "PUT",
      body: JSON.stringify({ logoUrl: "javascript:alert(1)" }),
    }));
    expect(r.status).toBe(400);
  });

  it("returns 400 when no fields provided", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "u_1", teamId: "t_1" } as any);
    mockRequireRole.mockResolvedValueOnce({ userRole: "ADMIN", allowed: true });
    const r = await PUT(new Request("http://x", {
      method: "PUT",
      body: JSON.stringify({}),
    }));
    expect(r.status).toBe(400);
  });

  it("updates brandColor, lowercases, logs audit", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "u_1", teamId: "t_1" } as any);
    mockRequireRole.mockResolvedValueOnce({ userRole: "ADMIN", allowed: true });
    mockPrisma.team.update.mockResolvedValueOnce({
      id: "t_1",
      brandColor: "#abcdef",
      logoUrl: null,
    });
    const r = await PUT(new Request("http://x", {
      method: "PUT",
      body: JSON.stringify({ brandColor: "#ABCDEF" }),
    }));
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.brandColor).toBe("#abcdef");
    expect(mockPrisma.team.update).toHaveBeenCalledWith({
      where: { id: "t_1" },
      data: { brandColor: "#abcdef" },
      select: { id: true, brandColor: true, logoUrl: true },
    });
    expect(mockLog).toHaveBeenCalledWith(
      "u_1", "team.branding.update", "t_1", "Team",
      { changes: { brandColor: "#abcdef" } }
    );
  });

  it("clears branding when value is null", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "u_1", teamId: "t_1" } as any);
    mockRequireRole.mockResolvedValueOnce({ userRole: "OWNER", allowed: true });
    mockPrisma.team.update.mockResolvedValueOnce({
      id: "t_1",
      brandColor: null,
      logoUrl: null,
    });
    const r = await PUT(new Request("http://x", {
      method: "PUT",
      body: JSON.stringify({ brandColor: null, logoUrl: "" }),
    }));
    expect(r.status).toBe(200);
    expect(mockPrisma.team.update).toHaveBeenCalledWith({
      where: { id: "t_1" },
      data: { brandColor: null, logoUrl: null },
      select: { id: true, brandColor: true, logoUrl: true },
    });
  });
});