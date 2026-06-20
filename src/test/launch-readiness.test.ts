/**
 * Pin the launch-readiness migration. If a future PR accidentally
 * deletes or mutates this migration, the test catches it.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_DIR = join(
  process.cwd(),
  "prisma",
  "migrations",
  "20260621000000_add_api_keys_and_team_branding",
);
const SQL_PATH = join(MIGRATION_DIR, "migration.sql");

describe("launch-readiness migration (add_api_keys_and_team_branding)", () => {
  it("directory exists", () => {
    expect(existsSync(MIGRATION_DIR)).toBe(true);
  });

  it("migration.sql exists", () => {
    expect(existsSync(SQL_PATH)).toBe(true);
  });

  it("creates the ApiKey table (PR #52)", () => {
    const sql = readFileSync(SQL_PATH, "utf8");
    expect(sql).toMatch(/CREATE TABLE "ApiKey"/);
    expect(sql).toMatch(/"prefix" TEXT NOT NULL/);
    expect(sql).toMatch(/"hash" TEXT NOT NULL/);
    expect(sql).toMatch(/"scope" TEXT NOT NULL DEFAULT 'read'/);
    expect(sql).toMatch(/"lastUsedAt" TIMESTAMP\(3\)/);
    expect(sql).toMatch(/"revokedAt" TIMESTAMP\(3\)/);
  });

  it("creates ApiKey indexes (lookup-by-prefix is the hot path)", () => {
    const sql = readFileSync(SQL_PATH, "utf8");
    expect(sql).toMatch(/UNIQUE INDEX "ApiKey_prefix_key"/);
    expect(sql).toMatch(/INDEX "ApiKey_userId_idx"/);
    expect(sql).toMatch(/INDEX "ApiKey_revokedAt_idx"/);
  });

  it("adds the ApiKey.userId → User foreign key with cascade", () => {
    const sql = readFileSync(SQL_PATH, "utf8");
    expect(sql).toMatch(/ApiKey_userId_fkey/);
    expect(sql).toMatch(/FOREIGN KEY \("userId"\) REFERENCES "User"\("id"\)/);
    expect(sql).toMatch(/ON DELETE CASCADE/);
  });

  it("adds Team.brandColor + Team.logoUrl (PR #47)", () => {
    const sql = readFileSync(SQL_PATH, "utf8");
    expect(sql).toMatch(/ALTER TABLE "Team" ADD COLUMN "brandColor" TEXT/);
    expect(sql).toMatch(/ALTER TABLE "Team" ADD COLUMN "logoUrl" TEXT/);
  });

  it("does not contain destructive operations (no DROP TABLE)", () => {
    const sql = readFileSync(SQL_PATH, "utf8");
    expect(sql).not.toMatch(/DROP TABLE/i);
  });
});

describe("rate-limit smoke script", () => {
  const SCRIPT = join(process.cwd(), "scripts", "smoke-rate-limit.sh");

  it("script exists", () => {
    expect(existsSync(SCRIPT)).toBe(true);
  });

  it("script is executable", () => {
    const stat = require("node:fs").statSync(SCRIPT);
    // Check owner-execute bit.
    expect(stat.mode & 0o100).toBeGreaterThan(0);
  });

  it("script exits 0 cleanly when KEY env is unset (skip behavior)", () => {
    const { execFileSync } = require("node:child_process");
    expect(() =>
      execFileSync("bash", [SCRIPT], {
        env: { ...process.env, KEY: "" },
        encoding: "utf8",
      }),
    ).not.toThrow();
  });

  it("script reads the 60-rpm read limit correctly", () => {
    const src = readFileSync(SCRIPT, "utf8");
    expect(src).toContain("READ_LIMIT=60");
    expect(src).toContain("/api/v1/calls");
    expect(src).toContain("429");
    expect(src).toContain("Retry-After");
  });
});

describe("post-deploy smoke workflow", () => {
  const WF = join(
    process.cwd(),
    ".github",
    "workflows",
    "post-deploy-smoke.yml",
  );

  it("workflow file exists", () => {
    expect(existsSync(WF)).toBe(true);
  });

  it("workflow triggers on manual dispatch", () => {
    const src = readFileSync(WF, "utf8");
    expect(src).toContain("workflow_dispatch");
  });

  it("workflow runs scripts/smoke-test.sh", () => {
    const src = readFileSync(WF, "utf8");
    expect(src).toContain("scripts/smoke-test.sh");
  });
});

describe("DEPLOYMENT_CHECKLIST.md honest status", () => {
  const CHECKLIST = readFileSync(
    join(process.cwd(), "DEPLOYMENT_CHECKLIST.md"),
    "utf8",
  );

  it("every [ ] item is annotated as EXTERNAL-BLOCKED", () => {
    // Extract every unchecked line + the lines that follow it
    // (until the next list item or section break).
    const lines = CHECKLIST.split("\n");
    const uncheckedIdx = lines
      .map((l, i) => (/^- \[ \] /.test(l) ? i : -1))
      .filter((i) => i >= 0);

    for (const idx of uncheckedIdx) {
      // Check the unchecked line itself + 8 following lines for the marker.
      const slice = lines.slice(idx, idx + 9).join("\n");
      expect(
        /EXTERNAL-BLOCKED/i.test(slice),
        `Unchecked line missing EXTERNAL-BLOCKED: "${lines[idx].slice(0, 100)}"`,
      ).toBe(true);
    }
  });

  it("mentions the new migration by name", () => {
    expect(CHECKLIST).toContain("add_api_keys_and_team_branding");
  });

  it("mentions rate-limit smoke script", () => {
    expect(CHECKLIST).toContain("smoke-rate-limit.sh");
  });
});