import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  rateLimit: vi.fn(),
  findUnique: vi.fn(),
  findMany: vi.fn(),
  upsert: vi.fn(),
  create: vi.fn(),
  count: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));

function mockPrisma() {
  return {
    knowledgeEntity: {
      upsert: mocks.upsert,
      findUnique: mocks.findUnique,
      findMany: mocks.findMany,
      count: mocks.count,
    },
    knowledgeRelation: { create: mocks.create, findUnique: mocks.findUnique, findMany: mocks.findMany },
  };
}

vi.mock("@/lib/prisma", () => ({ default: mockPrisma() }));

describe("knowledge integration: ingest → entities → relations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "u1" });
    mocks.rateLimit.mockResolvedValue({ success: true });
  });

  it("ingest creates entities, then entities endpoint lists them", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.upsert.mockResolvedValue({});
    mocks.create.mockResolvedValue({});

    const { POST } = await import("@/app/api/knowledge/ingest/route");
    const ingestRes = await POST(new Request("http://x/api/knowledge/ingest", {
      method: "POST",
      body: JSON.stringify({ callId: "c1", text: "Sarah Chen, CEO of Acme Inc, bought $50k." }),
    }));
    expect(ingestRes.status).toBe(200);

    mocks.findMany.mockResolvedValue([{ id: "e1", type: "person", value: "Sarah Chen" }]);
    mocks.count.mockResolvedValue(1);

    const { GET } = await import("@/app/api/knowledge/entities/route");
    const listRes = await GET(new Request("http://x/api/knowledge/entities"));
    const listJson = await listRes.json();
    expect(listRes.status).toBe(200);
    expect(listJson.entities).toHaveLength(1);
    expect(listJson.total).toBe(1);
  });

  it("entities endpoint rejects invalid type with 400", async () => {
    const { GET } = await import("@/app/api/knowledge/entities/route");
    const res = await GET(new Request("http://x/api/knowledge/entities?type=unicorn"));
    expect(res.status).toBe(400);
  });

  it("entities endpoint supports pagination params", async () => {
    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);
    const { GET } = await import("@/app/api/knowledge/entities/route");
    const res = await GET(new Request("http://x/api/knowledge/entities?limit=10&offset=5"));
    expect(res.status).toBe(200);
    expect(mocks.findMany.mock.calls[0][0].take).toBe(10);
    expect(mocks.findMany.mock.calls[0][0].skip).toBe(5);
  });
});
