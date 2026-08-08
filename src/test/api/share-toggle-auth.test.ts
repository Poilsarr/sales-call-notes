import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: { user: { findUnique: vi.fn() }, call: { findUnique: vi.fn(), update: vi.fn() } },
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));

import { POST } from "@/app/api/calls/[id]/share/route";

describe("POST /api/calls/[id]/share (auth awaited)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 for unauthenticated requests (previously always-401)", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const res = await POST({} as any, { params: Promise.resolve({ id: "c1" }) });
    expect(res.status).toBe(401);
  });

  it("allows the call owner to toggle sharing", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-1" });
    mocks.prisma.user.findUnique.mockResolvedValue({ id: "u1", teamId: null, teamRole: "MEMBER" });
    mocks.prisma.call.findUnique.mockResolvedValue({ id: "c1", userId: "u1", teamId: null, sharedWithTeam: false, isPublic: false });
    mocks.prisma.call.update.mockResolvedValue({ isPublic: true });

    const res = await POST({ nextUrl: { origin: "http://localhost:3000" } } as any, { params: Promise.resolve({ id: "c1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isPublic).toBe(true);
    expect(body.shareUrl).toBe("http://localhost:3000/share/c1");
  });

  it("forbids a teammate from sharing a non-shared call they don't own", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-2" });
    mocks.prisma.user.findUnique.mockResolvedValue({ id: "u2", teamId: "t1", teamRole: "MEMBER" });
    mocks.prisma.call.findUnique.mockResolvedValue({ id: "c1", userId: "u1", teamId: "t1", sharedWithTeam: false, isPublic: false });

    const res = await POST({} as any, { params: Promise.resolve({ id: "c1" }) });
    expect(res.status).toBe(403);
  });
});
