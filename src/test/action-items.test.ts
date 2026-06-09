import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    actionItem: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    call: {
      findFirst: vi.fn(),
    },
  };
  return { prisma: mockPrisma, default: mockPrisma };
});

vi.mock("@/lib/get-user", () => ({
  getUserByClerkId: vi.fn().mockResolvedValue({ id: "db_user_1", clerkId: "clerk_1", teamId: null }),
}));

vi.mock("@/lib/audit-logger", () => ({
  logAuditAction: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logAuditAction } from "@/lib/audit-logger";
import { GET, POST } from "@/app/api/action-items/route";

const mockAuth = vi.mocked(auth);
const mockFindMany = vi.mocked(prisma.actionItem.findMany);
const mockCreate = vi.mocked(prisma.actionItem.create);
const mockFindFirst = vi.mocked(prisma.call.findFirst);
const mockLogAudit = vi.mocked(logAuditAction);

describe("GET /api/action-items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "clerk_1" } as any);
    mockFindMany.mockResolvedValue([]);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null } as any);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns 200 with empty list", async () => {
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.items).toEqual([]);
  });

  it("returns 200 with action items", async () => {
    mockFindMany.mockResolvedValue([
      { id: "item_1", task: "Follow up with client", owner: "Alice", status: "PENDING" } as any,
    ]);

    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].task).toBe("Follow up with client");
  });
});

describe("POST /api/action-items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "clerk_1" } as any);
    mockFindFirst.mockResolvedValue({ id: "call_1" } as any);
    mockCreate.mockResolvedValue({ id: "item_new", task: "Test task", owner: "", status: "PENDING" } as any);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null } as any);
    const response = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ task: "Test" }) }));
    expect(response.status).toBe(401);
  });

  it("returns 201 when valid", async () => {
    mockCreate.mockResolvedValue({ id: "item_new", task: "Test task", owner: "", status: "PENDING" } as any);
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ task: "Test task" }),
      }),
    );
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.item.task).toBe("Test task");
  });

  it("returns 400 when task is empty", async () => {
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ task: "" }),
      }),
    );
    expect(response.status).toBe(400);
  });
});
