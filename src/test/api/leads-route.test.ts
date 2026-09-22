import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  emailLead: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  auditLog: { create: vi.fn() },
  checkRateLimitStrict: vi.fn(),
  captureApiError: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: { emailLead: mocks.emailLead, auditLog: mocks.auditLog },
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitStrict: mocks.checkRateLimitStrict,
}));
vi.mock("@/lib/sentry", () => ({ captureApiError: mocks.captureApiError }));

import { POST } from "@/app/api/leads/route";

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/leads", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/leads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimitStrict.mockResolvedValue({
      success: true,
      unavailable: false,
      remaining: 4,
      reset: 0,
    });
    mocks.auditLog.create.mockResolvedValue({});
  });

  it("rejects an invalid email with 400 and never echoes it", async () => {
    const res = await POST(makeRequest({ email: "not-an-email-at-all" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("not-an-email-at-all");
    expect(mocks.emailLead.findUnique).not.toHaveBeenCalled();
    expect(mocks.emailLead.create).not.toHaveBeenCalled();
    expect(mocks.checkRateLimitStrict).not.toHaveBeenCalled();
  });

  it("rejects a missing email with 400", async () => {
    const res = await POST(makeRequest({ source: "pricing" }));
    expect(res.status).toBe(400);
    expect(mocks.emailLead.create).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON with 400", async () => {
    const res = await POST(makeRequest("{not-json"));
    expect(res.status).toBe(400);
    expect(mocks.emailLead.create).not.toHaveBeenCalled();
  });

  it("rejects overlong source/ctaId with 400", async () => {
    const res = await POST(
      makeRequest({ email: "a@example.com", source: "x".repeat(65), ctaId: "y".repeat(65) }),
    );
    expect(res.status).toBe(400);
    expect(mocks.emailLead.create).not.toHaveBeenCalled();
  });

  it("fakes success for honeypot submissions without any DB or limiter touch", async () => {
    const res = await POST(
      makeRequest({ email: "bot@example.com", website: "http://spam.example" }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    expect(mocks.checkRateLimitStrict).not.toHaveBeenCalled();
    expect(mocks.emailLead.findUnique).not.toHaveBeenCalled();
    expect(mocks.emailLead.create).not.toHaveBeenCalled();
    expect(mocks.emailLead.update).not.toHaveBeenCalled();
  });

  it("creates a new lead with a normalized email and returns 201", async () => {
    mocks.emailLead.findUnique.mockResolvedValue(null);
    mocks.emailLead.create.mockResolvedValue({ id: "lead-1" });

    const res = await POST(
      makeRequest(
        { email: "  New-User@Example.COM ", source: "pricing", ctaId: "exit-modal" },
        { "x-forwarded-for": "1.2.3.4, 203.0.113.9" },
      ),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true, id: "lead-1" });
    expect(mocks.checkRateLimitStrict).toHaveBeenCalledWith("leads:203.0.113.9", "leads");
    expect(mocks.emailLead.create).toHaveBeenCalledWith({
      data: {
        email: "new-user@example.com",
        source: "pricing",
        ctaId: "exit-modal",
        status: "pending",
      },
    });
    // Audit log uses a null user and never stores the raw email.
    expect(mocks.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: null,
        action: "LEAD_CAPTURED",
        entityId: "lead-1",
        entityType: "EmailLead",
      }),
    });
    const auditMeta = JSON.stringify(mocks.auditLog.create.mock.calls);
    expect(auditMeta).not.toContain("new-user@example.com");
  });

  it("is idempotent on re-POST: same email returns 200 with the same id", async () => {
    mocks.emailLead.findUnique.mockResolvedValue({ id: "lead-9" });
    mocks.emailLead.update.mockResolvedValue({ id: "lead-9" });

    const res = await POST(
      makeRequest({ email: "returning@example.com", source: "blog", ctaId: "inline" }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, id: "lead-9" });
    expect(mocks.emailLead.create).not.toHaveBeenCalled();
    expect(mocks.emailLead.update).toHaveBeenCalledWith({
      where: { email: "returning@example.com" },
      data: { source: "blog", ctaId: "inline" },
    });
  });

  it("leaves stored source/ctaId untouched when re-POST omits them", async () => {
    mocks.emailLead.findUnique.mockResolvedValue({ id: "lead-9" });

    const res = await POST(makeRequest({ email: "returning@example.com" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, id: "lead-9" });
    expect(mocks.emailLead.update).not.toHaveBeenCalled();
    expect(mocks.emailLead.create).not.toHaveBeenCalled();
  });

  it("returns 429 without DB writes when the leads bucket is exhausted", async () => {
    mocks.checkRateLimitStrict.mockResolvedValueOnce({
      success: false,
      unavailable: false,
      remaining: 0,
      reset: 0,
    });

    const res = await POST(makeRequest({ email: "limited@example.com" }));
    expect(res.status).toBe(429);
    expect(mocks.emailLead.findUnique).not.toHaveBeenCalled();
    expect(mocks.emailLead.create).not.toHaveBeenCalled();
  });

  it("fails CLOSED with 429 when the limiter itself throws", async () => {
    mocks.checkRateLimitStrict.mockRejectedValueOnce(new Error("Redis down"));

    const res = await POST(makeRequest({ email: "closed@example.com" }));
    expect(res.status).toBe(429);
    expect(mocks.emailLead.findUnique).not.toHaveBeenCalled();
    expect(mocks.emailLead.create).not.toHaveBeenCalled();
  });

  it("returns a generic 500 with no raw email in the payload or Sentry context", async () => {
    const email = "secret-lead-xyz-123@example.com";
    mocks.emailLead.findUnique.mockRejectedValueOnce(new Error("db is down"));

    const res = await POST(makeRequest({ email }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain(email);
    expect(body).toEqual({ error: "Failed to save lead" });
    expect(mocks.captureApiError).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(mocks.captureApiError.mock.calls)).not.toContain(email);
  });
});
