import { describe, it, expect } from "vitest";
import { safeErrorResponse, logServerError, withSafeError } from "@/lib/safe-error";

describe("safeErrorResponse", () => {
  it("returns generic message; never the raw error string", async () => {
    const res = safeErrorResponse(500, "load call failed");
    const body = await res.json();
    expect(body).toEqual({ error: "load call failed" });
    expect(res.status).toBe(500);
    expect(body.error).not.toContain("Error");
    expect(body.error).not.toContain("at "); // stack-trace marker
  });

  it("never leaks file paths or library details", async () => {
    const res = safeErrorResponse(400, "save failed");
    const body = await res.json();
    expect(body.error).not.toMatch(/\/Users\/|\/home\/|\/var\//);
    expect(body.error).not.toMatch(/node_modules|prisma|next/);
  });
});

describe("logServerError", () => {
  it("does not throw when error is a non-Error value", () => {
    expect(() => logServerError("/api/test", "string error")).not.toThrow();
    expect(() => logServerError("/api/test", { random: "object" })).not.toThrow();
    expect(() => logServerError("/api/test", null)).not.toThrow();
  });

  it("does not throw when Sentry is unavailable", () => {
    // Sentry DSN may or may not be set in test env; helper must not fail either way
    expect(() => logServerError("/api/test", new Error("boom"))).not.toThrow();
  });
});

describe("withSafeError", () => {
  it("returns the inner NextResponse when no error is thrown", async () => {
    const ok = new Response(JSON.stringify({ ok: true }), { status: 200 });
    const result = await withSafeError("/api/test", "load call", async () => ok as any);
    expect(result).toBe(ok);
  });

  it("returns a generic 500 with safeErrorResponse on thrown error", async () => {
    const result = await withSafeError("/api/test", "load call", async () => {
      throw new Error("ENOTFOUND postgres.internal.acme.com /var/lib/secrets/db.pem");
    });
    expect(result).toBeDefined();
    const res = result as Response;
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("load call");
    // Critically: the internal error message must NOT appear in the body
    expect(body.error).not.toContain("ENOTFOUND");
    expect(body.error).not.toContain("/var/");
    expect(body.error).not.toContain("secrets");
  });
});