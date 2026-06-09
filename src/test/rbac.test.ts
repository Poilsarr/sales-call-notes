import { describe, it, expect, vi, beforeEach } from "vitest";
import { hasRole, ROLE_HIERARCHY, requireRole, assertRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

const mockFindUnique = vi.mocked(prisma.user.findUnique);

describe("ROLE_HIERARCHY", () => {
  it("has correct ordering VIEWER < MEMBER < ADMIN < OWNER", () => {
    expect(ROLE_HIERARCHY.VIEWER).toBeLessThan(ROLE_HIERARCHY.MEMBER);
    expect(ROLE_HIERARCHY.MEMBER).toBeLessThan(ROLE_HIERARCHY.ADMIN);
    expect(ROLE_HIERARCHY.ADMIN).toBeLessThan(ROLE_HIERARCHY.OWNER);
  });
});

describe("hasRole", () => {
  it("returns true when user role equals required role", () => {
    expect(hasRole("ADMIN", "ADMIN")).toBe(true);
    expect(hasRole("MEMBER", "MEMBER")).toBe(true);
  });

  it("returns true when user role exceeds required role", () => {
    expect(hasRole("ADMIN", "MEMBER")).toBe(true);
    expect(hasRole("OWNER", "ADMIN")).toBe(true);
    expect(hasRole("OWNER", "MEMBER")).toBe(true);
  });

  it("returns false when user role is below required role", () => {
    expect(hasRole("MEMBER", "ADMIN")).toBe(false);
    expect(hasRole("VIEWER", "MEMBER")).toBe(false);
    expect(hasRole("VIEWER", "ADMIN")).toBe(false);
  });

  it("treats unknown role as VIEWER (level 0)", () => {
    expect(hasRole("UNKNOWN", "MEMBER")).toBe(false);
    expect(hasRole("UNKNOWN", "VIEWER")).toBe(true);
  });
});

describe("requireRole", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
  });

  it("allows ADMIN to access ADMIN-required resource", async () => {
    mockFindUnique.mockResolvedValue({
      teamId: "team_1",
      teamRole: "ADMIN",
    } as any);

    const result = await requireRole("clerk_1", "team_1", "ADMIN");
    expect(result.allowed).toBe(true);
    expect(result.userRole).toBe("ADMIN");
  });

  it("allows OWNER to access ADMIN-required resource", async () => {
    mockFindUnique.mockResolvedValue({
      teamId: "team_1",
      teamRole: "OWNER",
    } as any);

    const result = await requireRole("clerk_1", "team_1", "ADMIN");
    expect(result.allowed).toBe(true);
    expect(result.userRole).toBe("OWNER");
  });

  it("denies MEMBER from ADMIN-required resource", async () => {
    mockFindUnique.mockResolvedValue({
      teamId: "team_1",
      teamRole: "MEMBER",
    } as any);

    const result = await requireRole("clerk_1", "team_1", "ADMIN");
    expect(result.allowed).toBe(false);
    expect(result.userRole).toBe("MEMBER");
  });

  it("denies VIEWER from MEMBER-required resource", async () => {
    mockFindUnique.mockResolvedValue({
      teamId: "team_1",
      teamRole: "VIEWER",
    } as any);

    const result = await requireRole("clerk_1", "team_1", "MEMBER");
    expect(result.allowed).toBe(false);
    expect(result.userRole).toBe("VIEWER");
  });

  it("denies user not in team", async () => {
    mockFindUnique.mockResolvedValue({
      teamId: "team_2",
      teamRole: "ADMIN",
    } as any);

    const result = await requireRole("clerk_1", "team_1", "ADMIN");
    expect(result.allowed).toBe(false);
    expect(result.userRole).toBe("VIEWER");
  });

  it("denies user not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await requireRole("clerk_1", "team_1", "ADMIN");
    expect(result.allowed).toBe(false);
    expect(result.userRole).toBe("VIEWER");
  });

  it("allows MEMBER to access MEMBER-required resource", async () => {
    mockFindUnique.mockResolvedValue({
      teamId: "team_1",
      teamRole: "MEMBER",
    } as any);

    const result = await requireRole("clerk_1", "team_1", "MEMBER");
    expect(result.allowed).toBe(true);
    expect(result.userRole).toBe("MEMBER");
  });
});

describe("assertRole", () => {
  it("does not throw when user role meets requirement", () => {
    expect(() => assertRole("ADMIN", "MEMBER", "read")).not.toThrow();
    expect(() => assertRole("OWNER", "ADMIN", "delete")).not.toThrow();
  });

  it("throws 403 when user role below requirement", () => {
    try {
      assertRole("MEMBER", "ADMIN", "delete");
    } catch (err: any) {
      expect(err.status).toBe(403);
    }
  });

  it("throws 403 when user role is VIEWER", () => {
    expect(() => assertRole("VIEWER", "MEMBER", "write")).toThrowError(
      "Insufficient role for write"
    );
  });
});
