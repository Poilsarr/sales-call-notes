import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => {
  const mocks = {
    user: { findUnique: vi.fn() },
    vocabularyEntry: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  };
  return { default: mocks, prisma: mocks };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/rbac", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/lib/audit-logger", () => ({
  logAuditAction: vi.fn(),
}));

import { GET, POST } from "@/app/api/team/vocabulary/route";
import { PATCH, DELETE } from "@/app/api/team/vocabulary/[id]/route";
import { auth } from "@clerk/nextjs/server";
import { requireRole } from "@/lib/rbac";
import { logAuditAction } from "@/lib/audit-logger";
import prisma from "@/lib/prisma";

const mockAuth = vi.mocked(auth);
const mockRequireRole = vi.mocked(requireRole);
const mockLog = vi.mocked(logAuditAction);
const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  vocabularyEntry: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
};

const TEAM_ID = "team_1";

beforeEach(() => {
  mockAuth.mockReset().mockResolvedValue({ userId: "user_1" });
  mockRequireRole.mockReset().mockResolvedValue({ allowed: true, userRole: "ADMIN" });
  mockLog.mockReset();
  mockPrisma.user.findUnique.mockReset().mockResolvedValue({ teamId: TEAM_ID });
  mockPrisma.vocabularyEntry.findMany.mockReset().mockResolvedValue([]);
  mockPrisma.vocabularyEntry.findFirst.mockReset().mockResolvedValue(null);
  mockPrisma.vocabularyEntry.create.mockReset().mockResolvedValue({
    id: "entry_1",
    term: "Lighthouse deal",
    definition: "$50k+ tier",
  });
  mockPrisma.vocabularyEntry.update.mockReset().mockResolvedValue({
    id: "entry_1",
    term: "Lighthouse deal",
    definition: "$75k+ tier",
  });
  mockPrisma.vocabularyEntry.delete.mockReset().mockResolvedValue({ id: "entry_1" });
  mockPrisma.vocabularyEntry.count.mockReset().mockResolvedValue(0);
});

describe("GET /api/team/vocabulary", () => {
  it("returns entries scoped to the user's team", async () => {
    mockPrisma.vocabularyEntry.findMany.mockResolvedValue([
      { id: "e1", term: "Lighthouse deal", definition: "$50k+ tier" },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entries).toHaveLength(1);
    expect(body.role).toBe("ADMIN");
    expect(mockPrisma.vocabularyEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { teamId: TEAM_ID } }),
    );
  });

  it("returns an empty list for users without a team", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ teamId: null });
    const res = await GET();
    expect((await res.json()).entries).toEqual([]);
    expect(mockRequireRole).not.toHaveBeenCalled();
  });

  it("rejects non-members", async () => {
    mockRequireRole.mockResolvedValue({ allowed: false, userRole: "VIEWER" });
    expect((await GET()).status).toBe(403);
  });

  it("401s unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await GET()).status).toBe(401);
  });
});

describe("POST /api/team/vocabulary", () => {
  const post = (body: unknown) =>
    POST(new Request("http://localhost/api/team/vocabulary", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }));

  it("creates an entry for an admin", async () => {
    const res = await post({ term: " Lighthouse deal ", definition: " $50k+ tier " });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.entry.term).toBe("Lighthouse deal");
    expect(mockPrisma.vocabularyEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ teamId: TEAM_ID }) }),
    );
    expect(mockLog).toHaveBeenCalled();
  });

  it("rejects members (403)", async () => {
    mockRequireRole.mockResolvedValue({ allowed: false, userRole: "MEMBER" });
    expect((await post({ term: "x", definition: "y" })).status).toBe(403);
  });

  it("rejects empty term / definition (400)", async () => {
    expect((await post({ term: "", definition: "y" })).status).toBe(400);
    expect((await post({ term: "x", definition: "  " })).status).toBe(400);
  });

  it("rejects when the team glossary is at cap", async () => {
    mockPrisma.vocabularyEntry.count.mockResolvedValue(200);
    const res = await post({ term: "x", definition: "y" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("capped at 200");
  });

  it("400s when the user has no team", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ teamId: null });
    expect((await post({ term: "x", definition: "y" })).status).toBe(400);
  });
});

describe("PATCH /api/team/vocabulary/[id]", () => {
  const patch = (body: unknown) =>
    PATCH(new Request("http://localhost/api/team/vocabulary/entry_1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }), { params: { id: "entry_1" } });

  it("updates an entry owned by the team", async () => {
    mockPrisma.vocabularyEntry.findFirst.mockResolvedValue({
      id: "entry_1", teamId: TEAM_ID, term: "Lighthouse deal", definition: "$50k+ tier",
    });
    const res = await patch({ definition: "$75k+ tier" });
    expect(res.status).toBe(200);
    expect(mockPrisma.vocabularyEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "entry_1" } }),
    );
    expect((await res.json()).entry.definition).toBe("$75k+ tier");
  });

  it("404s when the entry is not in the user's team", async () => {
    expect((await patch({ definition: "x" })).status).toBe(404);
  });
});

describe("DELETE /api/team/vocabulary/[id]", () => {
  const del = () =>
    DELETE(new Request("http://localhost/api/team/vocabulary/entry_1", { method: "DELETE" }),
      { params: { id: "entry_1" } });

  it("deletes an entry owned by the team", async () => {
    mockPrisma.vocabularyEntry.findFirst.mockResolvedValue({
      id: "entry_1", teamId: TEAM_ID, term: "Lighthouse deal", definition: "$50k+ tier",
    });
    const res = await del();
    expect(res.status).toBe(200);
    expect(mockPrisma.vocabularyEntry.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "entry_1" } }),
    );
  });

  it("404s for an entry the team does not own", async () => {
    expect((await del()).status).toBe(404);
  });

  it("rejects non-admins", async () => {
    mockRequireRole.mockResolvedValue({ allowed: false, userRole: "MEMBER" });
    expect((await del()).status).toBe(404);
  });
});
