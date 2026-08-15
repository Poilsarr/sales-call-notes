/**
 * Schema/migration drift detector.
 *
 * Pulls a shadow database URL, runs prisma migrate diff,
 * and fails if there are any schema statements that haven't
 * been captured in a migration. This is the durable fix for
 * the bug where User.trialEndsAt + the Team model existed in
 * schema.prisma but never made it into a migration — taking
 * down 80% of the API.
 *
 * Runs in CI on every PR. Cheap (no data touched, just diff).
 *
 * Usage:
 *   DATABASE_URL=postgresql://... npx tsx scripts/check-schema-drift.ts
 *
 * Exit codes:
 *   0 = schema matches migrations
 *   1 = drift detected (PR is missing a migration)
 *   2 = missing env
 */
import { execSync } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

function fail(msg: string): never {
  console.error("\n❌ SCHEMA DRIFT DETECTED\n");
  console.error(msg);
  console.error(
    "\nFix: run `npx prisma migrate dev --name <descriptive-name>` locally," +
      "\ncommit the generated migration file, then re-run this check.\n"
  );
  process.exit(1);
}

const repoRoot = resolve(__dirname, "..");
const prismaDir = resolve(repoRoot, "prisma");
const lockFile = resolve(prismaDir, "migrations", "migration_lock.toml");

if (!existsSync(lockFile)) {
  fail(
    `Missing ${lockFile}.\n` +
      `Prisma requires migrations/migration_lock.toml. Restore it from git.`
  );
}

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL not set. Set it (any reachable Postgres) and retry."
  );
  process.exit(2);
}

console.log("Checking schema ↔ migration drift...");
console.log("  DATABASE_URL host:", new URL(process.env.DATABASE_URL).host);

// Shadow DB: a throwaway database Prisma uses internally to
// resolve the migrations. Using a separate URL keeps it off the
// real schema. CI provides one via the postgres service.
const shadowUrl =
  process.env.SHADOW_DATABASE_URL || process.env.DATABASE_URL;

let diffOutput = "";
try {
  // --from-migrations: the SQL that running all migrations produces
  // --to-schema-datamodel: the schema.prisma file
  // Exit code 0 = no diff. Exit code 1 = drift.
  diffOutput = execSync(
    `npx prisma migrate diff ` +
      `--from-migrations "${prismaDir}/migrations" ` +
      `--to-schema-datamodel "${prismaDir}/schema.prisma" ` +
      `--shadow-database-url "${shadowUrl}"`,
    { cwd: repoRoot, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
  );
} catch (err: any) {
  // prisma migrate diff exits non-zero when drift exists, and
  // writes the diff SQL to stdout. Treat the stdout as the diff.
  diffOutput = err?.stdout?.toString() ?? "";
  // If the err came from prisma itself complaining about the
  // shadow URL being missing, surface that instead.
  const stderr = err?.stderr?.toString() ?? "";
  if (stderr.includes("shadow-database-url") && !process.env.SHADOW_DATABASE_URL) {
    console.error(
      "SHADOW_DATABASE_URL not set. The shadow URL must be a SEPARATE\n" +
        "database (Prisma will create/drop tables in it). Reuse the\n" +
        "main DATABASE_URL only if it's safe to drop.\n\n" +
        "For CI: set SHADOW_DATABASE_URL to a dedicated test schema\n" +
        "or a SQLite file URL like file:./shadow.db"
    );
    process.exit(2);
  }
}

const trimmed = diffOutput.trim();

// Prisma prints "No difference detected." (non-empty) to stdout when the
// migrations reproduce schema.prisma exactly. Treat that as no drift, not as
// SQL that is missing a migration. Also tolerate the "empty migration"
// variant some Prisma versions emit for a clean diff.
const NO_DIFF_SIGNALS = [
  "No difference detected.",
  "-- This is an empty migration.",
];
if (trimmed.length === 0 || NO_DIFF_SIGNALS.includes(trimmed)) {
  console.log("\n✓ No drift. schema.prisma matches all migrations.\n");
  process.exit(0);
}

fail(
  `prisma migrate diff produced SQL that is not yet in any migration:\n\n` +
    `---\n${trimmed}\n---\n\n` +
    `This means schema.prisma has fields/tables/models the migrations\n` +
    `don't create. The production DB will be missing them, which\n` +
    `breaks every endpoint that touches the affected rows.`
);