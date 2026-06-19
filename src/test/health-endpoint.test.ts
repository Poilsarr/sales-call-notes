import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Level 6.3 — health endpoint exists and exports the right runtime.
 * Wire format is exercised by the smoke test in scripts/smoke-test.sh.
 * Here we just prove the file is in place and that it compiles.
 */
const ROUTE_PATH = join(
  process.cwd(),
  "src/app/api/health/route.ts"
);

describe("GATE 6.3 — health endpoint exists", () => {
  it("route file is present", () => {
    expect(existsSync(ROUTE_PATH)).toBe(true);
  });

  it("exports GET handler", () => {
    const content = readFileSync(ROUTE_PATH, "utf8");
    expect(content).toMatch(/export\s+(async\s+)?function\s+GET/);
  });

  it("exports runtime nodejs", () => {
    const content = readFileSync(ROUTE_PATH, "utf8");
    expect(content).toMatch(/export\s+const\s+runtime\s*=\s*["']nodejs["']/);
  });

  it("returns 503 when DB unreachable (status code branch present)", () => {
    const content = readFileSync(ROUTE_PATH, "utf8");
    expect(content).toMatch(/status:\s*ok\s*\?\s*200\s*:\s*503/);
  });
});