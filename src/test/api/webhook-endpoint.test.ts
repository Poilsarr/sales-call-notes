import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getUserByClerkId: vi.fn(),
  endpointFindFirst: vi.fn(),
  endpointFindMany: vi.fn(),
  endpointCreate: vi.fn(),
  endpointUpdate: vi.fn(),
  deliveryFindMany: vi.fn(),
  deliveryUpdate: vi.fn(),
  registerWebhook: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/get-user", () => ({
  getUserByClerkId: mocks.getUserByClerkId,
}));

vi.mock("@/lib/prisma", () => {
  const txEndpoint = {
    create: mocks.endpointCreate,
    update: mocks.endpointUpdate,
    findFirst: mocks.endpointFindFirst,
  };
  return {
    default: {
      webhookEndpoint: {
        findFirst: mocks.endpointFindFirst,
        findMany: mocks.endpointFindMany,
        create: mocks.endpointCreate,
        update: mocks.endpointUpdate,
      },
      webhookDelivery: {
        findMany: mocks.deliveryFindMany,
        update: mocks.deliveryUpdate,
      },
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({ webhookEndpoint: txEndpoint, webhookDelivery: { update: mocks.deliveryUpdate } }),
      ),
    },
  };
});

vi.mock("@/services/webhooks", () => ({
  WebhookService: class {
    registerWebhook = mocks.registerWebhook;
  },
}));

import { POST as WebhookPOST, GET as WebhookGET } from "@/app/api/webhooks/route";
import { POST as DispatchPOST } from "@/app/api/cron/webhook-dispatch/route";

function jsonRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://x", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ userId: "clerk_1" } as never);
  mocks.getUserByClerkId.mockResolvedValue({
    id: "u_1",
    plan: "business",
    teamId: "t_1",
  } as never);
  process.env.CRON_SECRET = "test-cron-secret";
});

describe("POST /api/webhooks validation", () => {
  it("rejects non-https urls", async () => {
    const res = await WebhookPOST(jsonRequest({ url: "http://evil.com/hook" }) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/https/);
    expect(mocks.endpointCreate).not.toHaveBeenCalled();
  });

  it("rejects events outside the whitelist", async () => {
    const res = await WebhookPOST(
      jsonRequest({ url: "https://example.com/hook", events: ["call.nonexistent"] }) as never,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/subset/);
    expect(mocks.endpointCreate).not.toHaveBeenCalled();
  });

  it("accepts defaults (call.analyzed + generated secret)", async () => {
    mocks.endpointFindFirst.mockResolvedValueOnce(null);
    mocks.endpointCreate.mockImplementationOnce(async (args: { data: Record<string, unknown> }) => ({
      id: "wh_1",
      url: args.data["url"],
      events: args.data["events"],
    }));

    const res = await WebhookPOST(jsonRequest({ url: "https://example.com/hook" }) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("wh_1");
    expect(body.url).toBe("https://example.com/hook");
    expect(body.events).toEqual(["call.analyzed"]);
    expect(body.hasSecret).toBe(true);
    // Raw secret returned exactly once on create: 32-byte hex = 64 chars.
    expect(typeof body.secret).toBe("string");
    expect(body.secret).toMatch(/^[0-9a-f]{64}$/);
  });

  it("preserves the Business-plan gate", async () => {
    mocks.getUserByClerkId.mockResolvedValueOnce({ id: "u_1", plan: "free", teamId: "t_1" } as never);
    const res = await WebhookPOST(jsonRequest({ url: "https://example.com/hook" }) as never);
    expect(res.status).toBe(403);
  });
});

describe("GET /api/webhooks redacts secrets", () => {
  it("lists endpoints without secrets", async () => {
    mocks.endpointFindMany.mockResolvedValueOnce([
      {
        id: "wh_1",
        url: "https://example.com/hook",
        events: ["call.analyzed"],
        enabled: true,
        createdAt: new Date("2026-01-01T00:00:00Z"),
      },
    ]);

    const res = await WebhookGET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.endpoints)).toBe(true);
    expect(body.endpoints).toHaveLength(1);
    expect(body.endpoints[0]).toMatchObject({
      id: "wh_1",
      url: "https://example.com/hook",
      events: ["call.analyzed"],
      enabled: true,
    });
    expect("secret" in body.endpoints[0]).toBe(false);
    expect("secretHash" in body.endpoints[0]).toBe(false);
    // The query itself must exclude the secret column.
    expect(mocks.endpointFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.not.objectContaining({ secret: true }),
      }),
    );
  });
});

describe("POST /api/cron/webhook-dispatch CRON_SECRET guard", () => {
  it("rejects requests without a bearer token", async () => {
    const res = await DispatchPOST(new Request("http://x", { method: "POST" }) as never);
    expect(res.status).toBe(401);
    expect(mocks.deliveryFindMany).not.toHaveBeenCalled();
  });

  it("rejects requests with the wrong secret", async () => {
    const res = await DispatchPOST(
      new Request("http://x", {
        method: "POST",
        headers: { authorization: "Bearer wrong" },
      }) as never,
    );
    expect(res.status).toBe(401);
  });

  it("returns 500 when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    const res = await DispatchPOST(
      new Request("http://x", {
        method: "POST",
        headers: { authorization: "Bearer test-cron-secret" },
      }) as never,
    );
    expect(res.status).toBe(500);
  });
});
