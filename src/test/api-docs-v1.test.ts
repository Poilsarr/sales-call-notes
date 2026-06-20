import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PAGE = join(process.cwd(), "src/app/api-docs/v1/page.tsx");
const CONTENT = readFileSync(PAGE, "utf8");

describe("/api-docs/v1 page", () => {
  it("is a server component (no 'use client')", () => {
    expect(CONTENT).not.toMatch(/^"use client"/);
  });

  it("documents the 4 v1 endpoints", () => {
    expect(CONTENT).toContain('method: "GET"');
    expect(CONTENT).toContain('path: "/api/v1/keys"');
    expect(CONTENT).toContain('method: "POST"');
    expect(CONTENT).toContain('path: "/api/v1/keys"');
    expect(CONTENT).toContain('method: "DELETE"');
    expect(CONTENT).toContain('path: "/api/v1/keys/[id]"');
    expect(CONTENT).toContain('method: "GET"');
    expect(CONTENT).toContain('path: "/api/v1/calls"');
  });

  it("shows both scopes (read, read_write)", () => {
    expect(CONTENT).toContain("read");
    expect(CONTENT).toContain("read_write");
  });

  it("includes the rate-limit numbers from PR #58", () => {
    expect(CONTENT).toContain("60 requests / minute / key");
    expect(CONTENT).toContain("600 requests / minute / key");
  });

  it("warns that the raw key is shown ONCE", () => {
    expect(CONTENT).toMatch(/ONCE/);
  });

  it("links to Settings → API Keys", () => {
    expect(CONTENT).toContain("/settings?tab=api-keys");
  });

  it("includes a curl quickstart", () => {
    expect(CONTENT).toContain("curl -H");
    expect(CONTENT).toContain("Authorization: Bearer");
  });

  it("does NOT claim features that don't exist (audit-correctness)", () => {
    expect(CONTENT).not.toContain("OpenAPI 3.1 spec");
    expect(CONTENT).not.toContain("OAuth");
    expect(CONTENT).not.toContain("SDK");
  });
});

describe("feature-content claim honesty", () => {
  it("removed the false 'OpenAPI 3.1 spec published' marketing claim", () => {
    const content = readFileSync(
      join(process.cwd(), "src/lib/feature-content.ts"),
      "utf8",
    );
    expect(content).not.toContain("OpenAPI 3.1 spec published");
    expect(content).toContain("Documented at /api-docs/v1");
  });
});