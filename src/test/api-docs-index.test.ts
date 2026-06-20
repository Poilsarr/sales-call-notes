import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const INDEX = readFileSync(
  join(process.cwd(), "src/app/api-docs/page.tsx"),
  "utf8",
);

describe("/api-docs index page", () => {
  it("is a server component", () => {
    expect(INDEX).not.toMatch(/^"use client"/);
  });

  it("links to the v1 docs page", () => {
    expect(INDEX).toContain("/api-docs/v1");
  });

  it("links to Settings → API Keys", () => {
    expect(INDEX).toContain("/settings?tab=api-keys");
  });

  it("does not claim planned endpoints are shipped (audit-correctness)", () => {
    // Karpathy rule 5: don't lie about what isn't true.
    expect(INDEX).toContain("planned");
    expect(INDEX).toContain("&quot;planned&quot;");
    expect(INDEX).toContain("&apos;t depend");
  });
});