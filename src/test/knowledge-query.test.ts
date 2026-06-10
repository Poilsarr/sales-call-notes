import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  upsert: vi.fn(),
  create: vi.fn(),
  findUnique: vi.fn(),
  findMany: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({
  default: {
    knowledgeEntity: {
      upsert: mocks.upsert,
      findUnique: mocks.findUnique,
      findMany: mocks.findMany,
    },
    knowledgeRelation: {
      create: mocks.create,
      findMany: mocks.findMany,
    },
  },
}));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mocks.rateLimit,
}));

describe("/api/knowledge/query GET", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
    mocks.findMany.mockReset();
    mocks.rateLimit.mockReset();
    mocks.rateLimit.mockResolvedValue({ success: true });
  });

  it("returns 401 when unauthenticated", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const { GET } = await import("@/app/api/knowledge/query/route");
    const res = await GET(new Request("http://x/api/knowledge/query?q=acme"));
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mocks.auth.mockResolvedValue({ userId: "u1" });
    mocks.rateLimit.mockResolvedValue({ success: false });
    const { GET } = await import("@/app/api/knowledge/query/route");
    const res = await GET(new Request("http://x/api/knowledge/query?q=acme"));
    expect(res.status).toBe(429);
  });

  it("rejects empty q with 400", async () => {
    mocks.auth.mockResolvedValue({ userId: "u1" });
    const { GET } = await import("@/app/api/knowledge/query/route");
    const res = await GET(new Request("http://x/api/knowledge/query?q="));
    expect(res.status).toBe(400);
  });

  it("rejects invalid type with 400", async () => {
    mocks.auth.mockResolvedValue({ userId: "u1" });
    const { GET } = await import("@/app/api/knowledge/query/route");
    const res = await GET(new Request("http://x/api/knowledge/query?q=acme&type=unicorn"));
    expect(res.status).toBe(400);
  });

  it("returns entities and relations matching query", async () => {
    mocks.auth.mockResolvedValue({ userId: "u1" });
    mocks.findMany
      .mockResolvedValueOnce([{ id: "e1", type: "company", value: "Acme Corp" }])
      .mockResolvedValueOnce([{ id: "r1", relation: "works_at" }]);
    const { GET } = await import("@/app/api/knowledge/query/route");
    const res = await GET(new Request("http://x/api/knowledge/query?q=acme"));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.entities).toHaveLength(1);
    expect(json.relations).toHaveLength(1);
  });

  it("passes type filter to prisma", async () => {
    mocks.auth.mockResolvedValue({ userId: "u1" });
    mocks.findMany.mockResolvedValue([]);
    const { GET } = await import("@/app/api/knowledge/query/route");
    await GET(new Request("http://x/api/knowledge/query?q=sarah&type=person"));
    const args = mocks.findMany.mock.calls[0][0];
    expect(args.where.type).toBe("person");
    expect(args.where.userId).toBe("u1");
  });

  it("clamps limit to [1,100]", async () => {
    mocks.auth.mockResolvedValue({ userId: "u1" });
    mocks.findMany.mockResolvedValue([]);
    const { GET } = await import("@/app/api/knowledge/query/route");
    const r1 = await GET(new Request("http://x/api/knowledge/query?q=x&limit=999"));
    expect(r1.status).toBe(400);
    const r2 = await GET(new Request("http://x/api/knowledge/query?q=x&limit=0"));
    expect(r2.status).toBe(400);
  });
});
