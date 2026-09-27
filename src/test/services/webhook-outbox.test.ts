import { describe, it, expect, vi, beforeEach } from "vitest";

const mockEndpointFindMany = vi.fn();
const mockDeliveryCreate = vi.fn();
const mockDeliveryUpdate = vi.fn();
const mockIntegrationFindMany = vi.fn();
const mockIntegrationCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  default: {
    webhookEndpoint: {
      findMany: (...args: unknown[]) => mockEndpointFindMany(...args),
    },
    webhookDelivery: {
      create: (...args: unknown[]) => mockDeliveryCreate(...args),
      update: (...args: unknown[]) => mockDeliveryUpdate(...args),
    },
    integration: {
      findMany: (...args: unknown[]) => mockIntegrationFindMany(...args),
      create: (...args: unknown[]) => mockIntegrationCreate(...args),
    },
  },
}));

import { sign, verify } from "@/lib/webhook-hmac";
import {
  WebhookService,
  computeBackoffMinutes,
  computeNextRetryAt,
  isHttpsUrl,
  endpointMatchesEvent,
  truncateLastError,
  type WebhookPayload,
} from "@/services/webhooks";

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function basePayload(overrides: Partial<WebhookPayload> = {}): WebhookPayload {
  return {
    event: "call.analyzed",
    callId: "call-123",
    userId: "user-123",
    teamId: "team-1",
    data: {
      summary: "Great call",
      healthScore: 0.9,
      duration: 600,
      language: "en",
    },
    ...overrides,
  };
}

describe("webhook-hmac sign/verify", () => {
  it("roundtrips: verify(sign(payload)) is true", () => {
    const payload = JSON.stringify({ event: "call.analyzed", callId: "c1" });
    const sig = sign(payload, "s3cr3t");
    expect(sig).toMatch(/^sha256=[a-f0-9]{64}$/);
    expect(verify(payload, sig, "s3cr3t")).toBe(true);
  });

  it("rejects tampered payload", () => {
    const sig = sign("original", "s3cr3t");
    expect(verify("tampered", sig, "s3cr3t")).toBe(false);
  });

  it("rejects wrong secret", () => {
    const sig = sign("hello", "correct");
    expect(verify("hello", sig, "wrong")).toBe(false);
  });

  it("rejects missing inputs without throwing", () => {
    expect(verify("hello", null, "s3cr3t")).toBe(false);
    expect(verify("hello", undefined, "s3cr3t")).toBe(false);
    expect(verify("hello", "", "s3cr3t")).toBe(false);
    expect(verify("hello", sign("hello", "s"), "")).toBe(false);
    expect(verify("hello", "not-a-signature", "s3cr3t")).toBe(false);
  });
});

describe("backoff math", () => {
  it("1 attempt -> 2min, 2 attempts -> 4min", () => {
    expect(computeBackoffMinutes(1)).toBe(2);
    expect(computeBackoffMinutes(2)).toBe(4);
  });

  it("grows exponentially then caps at 60", () => {
    expect(computeBackoffMinutes(0)).toBe(1);
    expect(computeBackoffMinutes(3)).toBe(8);
    expect(computeBackoffMinutes(5)).toBe(32);
    expect(computeBackoffMinutes(6)).toBe(60); // 2^6=64 capped
    expect(computeBackoffMinutes(10)).toBe(60);
  });

  it("computeNextRetryAt adds backoff minutes to now", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    expect(computeNextRetryAt(1, now).toISOString()).toBe(
      "2026-01-01T00:02:00.000Z",
    );
    expect(computeNextRetryAt(2, now).toISOString()).toBe(
      "2026-01-01T00:04:00.000Z",
    );
    expect(computeNextRetryAt(10, now).toISOString()).toBe(
      "2026-01-01T01:00:00.000Z",
    );
  });

  it("truncateLastError caps at 500 chars", () => {
    const long = "x".repeat(1000);
    expect(truncateLastError(new Error(long)).length).toBeLessThanOrEqual(500);
    expect(truncateLastError(long).length).toBeLessThanOrEqual(500);
  });
});

describe("https guard", () => {
  it("accepts https, rejects http and junk", () => {
    expect(isHttpsUrl("https://example.com/hook")).toBe(true);
    expect(isHttpsUrl("http://example.com/hook")).toBe(false);
    expect(isHttpsUrl("")).toBe(false);
    expect(isHttpsUrl(null)).toBe(false);
    expect(isHttpsUrl(undefined)).toBe(false);
  });

  it("endpointMatchesEvent honors allow-list and wildcard", () => {
    expect(endpointMatchesEvent("call.analyzed", "call.analyzed")).toBe(true);
    expect(endpointMatchesEvent("call.analyzed", "call.created")).toBe(false);
    expect(endpointMatchesEvent("call.created,call.analyzed", "call.created")).toBe(
      true,
    );
    expect(endpointMatchesEvent("*", "call.deleted")).toBe(true);
    expect(endpointMatchesEvent("", "call.analyzed")).toBe(false);
    expect(endpointMatchesEvent(null, "call.analyzed")).toBe(false);
  });
});

describe("WebhookService outbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEndpointFindMany.mockResolvedValue([]);
    mockIntegrationFindMany.mockResolvedValue([]);
    mockFetch.mockResolvedValue({ ok: true } as unknown as Response);
  });

  it("legacy Integration row still enqueued (backward compat)", async () => {
    mockIntegrationFindMany.mockResolvedValue([
      {
        id: "int-1",
        teamId: "team-1",
        provider: "webhook",
        enabled: true,
        config: JSON.stringify({ url: "https://example.com/legacy-hook" }),
      },
    ]);

    const svc = new WebhookService();
    await svc.trigger(basePayload());

    expect(mockIntegrationFindMany).toHaveBeenCalledWith({
      where: { provider: "webhook", enabled: true, teamId: "team-1" },
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe("https://example.com/legacy-hook");
    expect(opts.method).toBe("POST");
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(opts.headers["User-Agent"]).toBe("Gauge-Webhook/1.0");
    expect(opts.headers["X-Gauge-Event"]).toBe("call.analyzed");
    // Payload shape preserved for call.analyzed
    const sent = JSON.parse(opts.body as string);
    expect(sent.event).toBe("call.analyzed");
    expect(sent.callId).toBe("call-123");
  });

  it("https guard rejects http:// legacy URL (no fetch)", async () => {
    mockIntegrationFindMany.mockResolvedValue([
      {
        id: "int-1",
        teamId: "team-1",
        provider: "webhook",
        enabled: true,
        config: JSON.stringify({ url: "http://evil.example.com/hook" }),
      },
    ]);

    const svc = new WebhookService();
    await svc.trigger(basePayload());

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("creates pending delivery and signs with endpoint secret", async () => {
    mockEndpointFindMany.mockResolvedValue([
      {
        id: "ep-1",
        teamId: "team-1",
        url: "https://example.com/hook",
        secret: "ep-secret",
        events: "call.analyzed",
        enabled: true,
      },
    ]);
    mockDeliveryCreate.mockResolvedValue({ id: "del-1", attempts: 0 });
    mockDeliveryUpdate.mockResolvedValue({});

    const svc = new WebhookService();
    await svc.trigger(basePayload());

    expect(mockDeliveryCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        endpointId: "ep-1",
        teamId: "team-1",
        event: "call.analyzed",
        status: "pending",
      }),
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe("https://example.com/hook");
    const expectedSig = sign(opts.body as string, "ep-secret");
    expect(opts.headers["X-Gauge-Signature"]).toBe(expectedSig);
    expect(opts.headers["X-Gauge-Event"]).toBe("call.analyzed");
    expect(mockDeliveryUpdate).toHaveBeenCalledWith({
      where: { id: "del-1" },
      data: { status: "delivered" },
    });
  });

  it("skips endpoints whose event filter does not match", async () => {
    mockEndpointFindMany.mockResolvedValue([
      {
        id: "ep-1",
        teamId: "team-1",
        url: "https://example.com/hook",
        secret: "s",
        events: "call.created",
        enabled: true,
      },
    ]);

    const svc = new WebhookService();
    await svc.trigger(basePayload({ event: "call.analyzed" }));

    expect(mockDeliveryCreate).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("on failure marks retrying with exponential backoff + truncated error", async () => {
    mockEndpointFindMany.mockResolvedValue([
      {
        id: "ep-1",
        teamId: "team-1",
        url: "https://example.com/hook",
        secret: "s",
        events: "call.analyzed",
        enabled: true,
      },
    ]);
    mockDeliveryCreate.mockResolvedValue({ id: "del-1", attempts: 0 });
    mockDeliveryUpdate.mockResolvedValue({});
    mockFetch.mockRejectedValue(new Error("boom-" + "x".repeat(1000)));

    const svc = new WebhookService();
    await svc.trigger(basePayload());

    expect(mockDeliveryUpdate).toHaveBeenCalledTimes(1);
    const arg = mockDeliveryUpdate.mock.calls[0][0] as {
      where: { id: string };
      data: { status: string; attempts: number; nextRetryAt: Date; lastError: string };
    };
    expect(arg.where).toEqual({ id: "del-1" });
    expect(arg.data.status).toBe("retrying");
    expect(arg.data.attempts).toBe(1);
    expect(arg.data.lastError.length).toBeLessThanOrEqual(500);
    // nextRetryAt ≈ now + 2 minutes
    const deltaMs = arg.data.nextRetryAt.getTime() - Date.now();
    expect(deltaMs).toBeGreaterThan(60_000);
    expect(deltaMs).toBeLessThanOrEqual(3 * 60_000);
  });

  it("does nothing without a teamId (cross-tenant guard)", async () => {
    const svc = new WebhookService();
    await svc.trigger(basePayload({ teamId: null }));
    expect(mockEndpointFindMany).not.toHaveBeenCalled();
    expect(mockIntegrationFindMany).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
