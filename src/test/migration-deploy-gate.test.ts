import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Regression test for the class of bug that hit commit 20e924d:
 * a Prisma migration file ships in the repo but is never
 * applied to prod because the build step does not run
 * `prisma migrate deploy`. Result: the prod DB is missing
 * columns the deployed code reads, and every request that
 * touches those columns throws
 *   "The column `User.X` does not exist in the current database."
 * which surfaced to users as:
 *   - "Failed to save call: ... trialEndsAt does not exist"
 *   - "Analysis failed. Please try again or contact support."
 *   - "Failed to load analytics" on the dashboard
 *
 * These tests pin the contract: every Vercel build MUST run
 * `prisma migrate deploy` before the Next.js build. If a
 * future commit removes the hook, these tests fail and the
 * merge is blocked.
 */
describe("prisma migrate deploy is wired into the Vercel build", () => {
  it("vercel.json buildCommand includes prisma migrate deploy", () => {
    const vercelJsonPath = path.join(process.cwd(), "vercel.json");
    expect(fs.existsSync(vercelJsonPath)).toBe(true);
    const config = JSON.parse(fs.readFileSync(vercelJsonPath, "utf-8"));
    expect(typeof config.buildCommand).toBe("string");
    expect(config.buildCommand).toMatch(/prisma\s+migrate\s+deploy/);
  });

  it("package.json exposes a db:deploy script that runs prisma migrate deploy", () => {
    const pkgPath = path.join(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    expect(pkg.scripts).toBeDefined();
    expect(pkg.scripts["db:deploy"]).toBeDefined();
    expect(pkg.scripts["db:deploy"]).toMatch(/prisma\s+migrate\s+deploy/);
  });

  it("every migration file is in prisma/migrations and is a real .sql file", () => {
    const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
    expect(fs.existsSync(migrationsDir)).toBe(true);
    const entries = fs.readdirSync(migrationsDir);
    const migrationFolders = entries.filter(
      (name) =>
        !name.startsWith(".") &&
        name !== "migration_lock.toml" &&
        fs.statSync(path.join(migrationsDir, name)).isDirectory(),
    );
    expect(migrationFolders.length).toBeGreaterThan(0);
    for (const folder of migrationFolders) {
      const sqlPath = path.join(migrationsDir, folder, "migration.sql");
      expect(fs.existsSync(sqlPath), `missing ${sqlPath}`).toBe(true);
      const content = fs.readFileSync(sqlPath, "utf-8");
      expect(content.length).toBeGreaterThan(0);
    }
  });

  it("the most recent migration in the repo has been applied to the live prod DB (regression for #100)", () => {
    // This test is informational: it requires DATABASE_URL and
    // is skipped in CI. To run locally:
    //   DATABASE_URL=... npx vitest run src/test/migration-deploy-gate.test.ts
    if (!process.env.DATABASE_URL) {
      // Local dev / CI without DB: just assert the hook is wired
      // (covered by the other tests). The gate that matters is
      // Vercel's buildCommand, which we already assert above.
      return;
    }
    // If DATABASE_URL is present, assert schema parity by
    // importing the Prisma client and trying a no-op query.
    // We do this synchronously to keep the test fast.
    const { execFileSync } = require("child_process");
    const out = execFileSync(
      "npx",
      ["prisma", "migrate", "status"],
      { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] },
    );
    expect(out).not.toMatch(/Following migration.*have not yet been applied/);
  });
});
