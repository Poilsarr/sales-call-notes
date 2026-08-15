# PROD-MIGRATE-REPAIR-RUNBOOK — One-Time Production DB Repair

> **Status**: READY FOR EXECUTION
> **Owner**: orchestrator (DevOps Automator)
> **Scope**: heal the empty prod Neon database (`neondb`) so Vercel builds can run `prisma migrate deploy && next build` green again.
> **Type**: ONE-TIME repair. Read-only checks + two `prisma migrate` writes + one read-only drift check. **NO app code changes.**

---

## 1. Context & root cause (verified, do not re-derive)

| Fact | Verified state |
|---|---|
| Vercel `buildCommand` | `prisma migrate deploy && next build` (`vercel.json` line 2) |
| CI (GitHub Actions) | runs only `next build` — no `migrate deploy`, which is why CI passes while Vercel fails |
| Prod DB | Neon database `neondb`, reachable via `DATABASE_URL_UNPOOLED` in `.env.vercel-prod` (direct connection; the pooled `DATABASE_URL` is unsuitable for DDL) |
| `_prisma_migrations` | exactly **1 row**: `20260518230619_add_call_insights`, `started_at 2026-08-12T06:46:33.963Z`, `finished_at NULL`, `rolled_back_at NULL`, `applied_steps_count 0`, logs contain `relation "Call" does not exist` (42P01). It failed at transaction START — 0 steps applied, nothing to undo in the DB, but Prisma sees it as "failed". |
| Application tables | **none** (public schema is empty apart from `_prisma_migrations`) |
| Root cause | No init migration exists in the repo. Migrations 1–15 assume base tables (`User`/`Team`/`Call`/…) that were never captured. The migrations only ever CREATE 8 tables (`ApiKey`, `CallComment`, `CallInsight`, `KnowledgeEntity`, `KnowledgeRelation`, `PartnerApplication`, `Team`, `VocabularyEntry`) — everything else they touch is an `ALTER TABLE` on base tables that only an init migration can create. |
| Fix in flight | A true init migration is being added by a parallel executor at `prisma/migrations/<INIT_DIR>/` (planned name `20260501000000_init`). It is **not yet in the repo** — Step 2 waits for it. |
| Contract | `src/test/migration-deploy-gate.test.ts` (PR #101) pins `migrate deploy` inside the Vercel build. **We KEEP the contract.** This runbook does NOT recommend changing `vercel.json`, `package.json`, the gate test, or `scripts/check-schema-drift.ts`. |

**Repair strategy in one line**: mark the failed migration rolled-back → verify init migration present → `prisma migrate deploy` (16 migrations: init + 15, in order) → verify 16 rows + no drift.

---

## 2. Session preamble (run once)

Run every command from the **repo root**:

```bash
cd "/Users/kushagarhsingh/Desktop/com analayze/sales-call-notes"
set -uo pipefail   # do NOT use `set -e` blindly — you must inspect each exit code anyway
```

### Env injection helpers — NEVER print the URL or password

Prisma CLI loads the repo-root `.env` (dev `DATABASE_URL`), but **it does not override environment variables that are already set**. So injecting the prod URL as an inline env prefix is the clean, deterministic override. Use `DATABASE_URL_UNPOOLED` (direct connection) — never the pooled `DATABASE_URL`.

Do **NOT** use `env $(grep … | xargs)` style — it breaks on quoted values and is fragile. Use this extraction (values with `=` in query params are handled by `cut -d= -f2-`; surrounding quotes are stripped by `tr`):

```bash
# Extract the UNPOOLED (direct) prod URL into a shell variable. Never echoed.
PROD_DATABASE_URL="$(grep -E '^DATABASE_URL_UNPOOLED=' .env.vercel-prod | head -1 | cut -d= -f2- | tr -d '"')"

# Abort loudly if extraction failed or the shape is wrong (database must be neondb).
[ -n "$PROD_DATABASE_URL" ] || { echo "FATAL: DATABASE_URL_UNPOOLED missing/empty in .env.vercel-prod"; exit 1; }
case "$PROD_DATABASE_URL" in
  */neondb|*/neondb?*) : ;;
  *) echo "FATAL: DATABASE_URL_UNPOOLED does not point at /neondb — aborting"; exit 1 ;;
esac

# Throwaway shadow DB on the SAME Neon project (already created; safe to write to).
SHADOW_DATABASE_URL="${PROD_DATABASE_URL/\/neondb/\/gauge_shadow}"
```

Safe sanity print (redacts credentials, shows only target db + host):

```bash
printf 'target: %s\n' "${PROD_DATABASE_URL%%\?*}" | sed -E 's#(://)[^@]*@#\1***@#'
# Expected: target: postgresql://***@ep-long-tooth-...neon.tech:5432/neondb
```

---

## 3. Step 0 — Pre-flight checks (READ-ONLY)

### 3.1 Write the read-only inspection script

Create **`preflight-prod.cjs`** at the repo root (CommonJS — this package has no `"type": "module"`). It reads the URL from `.env.vercel-prod` itself, never prints it, and only reports query results:

```js
// preflight-prod.cjs — READ-ONLY. Never prints the connection URL.
const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const envText = fs.readFileSync(path.join(__dirname, ".env.vercel-prod"), "utf8");
const line = envText.split("\n").find((l) => l.startsWith("DATABASE_URL_UNPOOLED="));
if (!line) {
  console.error("FATAL: DATABASE_URL_UNPOOLED not found in .env.vercel-prod");
  process.exit(1);
}
const url = line.slice("DATABASE_URL_UNPOOLED=".length).trim().replace(/^["']|["']$/g, "");
if (!url) {
  console.error("FATAL: DATABASE_URL_UNPOOLED is empty");
  process.exit(1);
}

const dbName = (url.match(/\/([^/?]+)(?=\?|$)/) || [])[1];
const prisma = new PrismaClient({ datasourceUrl: url }); // Prisma 5: datasourceUrl, not datasources

(async () => {
  const [dbRow] = await prisma.$queryRawUnsafe(`SELECT current_database()`);
  console.log("current_database:", dbRow.current_database); // must be: neondb

  console.log("\n--- _prisma_migrations ---");
  const migrations = await prisma.$queryRawUnsafe(
    `SELECT migration_name, started_at, finished_at, rolled_back_at, applied_steps_count
       FROM _prisma_migrations
      ORDER BY started_at`
  );
  console.log(JSON.stringify(migrations, null, 2));

  console.log("\n--- public tables (excluding _prisma_migrations) ---");
  const tables = await prisma.$queryRawUnsafe(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name <> '_prisma_migrations'
      ORDER BY table_name`
  );
  console.log("count:", tables.length);
  console.log(JSON.stringify(tables, null, 2));
})().catch((e) => {
  console.error("QUERY FAILED:", e.message);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
```

### 3.2 Run it

```bash
node preflight-prod.cjs
```

### 3.3 Exact expected output (pre-repair)

```
current_database: neondb

--- _prisma_migrations ---
[
  {
    "migration_name": "20260518230619_add_call_insights",
    "started_at": "2026-08-12T06:46:33.963Z",
    "finished_at": null,
    "rolled_back_at": null,
    "applied_steps_count": 0
  }
]

--- public tables (excluding _prisma_migrations) ---
count: 0
[]
```

Invariants to confirm before proceeding:
- `current_database: neondb` (any other name = wrong target, abort).
- Exactly **1** migration row: `20260518230619_add_call_insights`, `finished_at: null`, `rolled_back_at: null`, `applied_steps_count: 0`.
- Public table count = **0**.

If any of these differ, STOP and re-read §7 (emergency) before doing anything.

---

## 4. Step 1 — Resolve the failed migration (roll it back)

The failed row has `applied_steps_count 0` and the objects it creates (`CallInsight`, FK to `Call`) do NOT exist in prod. Correct call: **`--rolled-back`** — this lets `migrate deploy` re-run the migration later (after init creates `Call`).

```bash
DATABASE_URL="$PROD_DATABASE_URL" npx prisma migrate resolve --rolled-back 20260518230619_add_call_insights
```

### Expected result

```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "neondb" at "ep-long-tooth-...neon.tech:5432"

Migration 20260518230619_add_call_insights marked as rolled back.
```

Exit code **0**. If you see `migration ... marked as applied` — you typed the wrong flag; see §7.1 decision logic before touching anything else.

### Verify (re-run the read-only script)

```bash
node preflight-prod.cjs
```

Expect the row to now show `rolled_back_at` set to a timestamp (still `finished_at: null`, `applied_steps_count: 0`, table count still 0).

**Optional but recommended** — confirm the same row via `migrate status` (read-only):

```bash
DATABASE_URL="$PROD_DATABASE_URL" npx prisma migrate status
```

Prisma will report the migration as rolled back and the remaining 15 as "not yet applied" — the exact wording varies by version; exit code may be non-zero, that is expected at this point.

---

## 5. Step 2 — Verify the init migration is present (wait for the parallel executor)

> `<INIT_DIR>` is a placeholder. Substitute the actual folder name added by the parallel executor (planned: `20260501000000_init`).

```bash
# List migration folders (directories only):
find prisma/migrations -mindepth 1 -maxdepth 1 -type d | sort

# Assertions (each must pass):
#  1. <INIT_DIR> exists and sorts FIRST (lexicographically before 20260518230619_add_call_insights).
#  2. <INIT_DIR>/migration.sql exists and is non-empty.
#  3. Total folder count is 16 (exactly ONE new folder: the init). NO other new folders appeared.
#     (15 original + 1 init). migration_lock.toml is a file, not a folder — not counted.

ls -la "prisma/migrations/<INIT_DIR>/migration.sql"
test -s "prisma/migrations/<INIT_DIR>/migration.sql" && echo "init migration.sql present and non-empty"

# Folder count check:
echo "folder count: $(find prisma/migrations -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"   # expect 16
```

If the init folder is **not** there yet, STOP — the parallel executor is still landing it. Wait for it, then re-run the assertions. Do not proceed to Step 3 without it.

Also sanity-check the init file actually creates the base tables the app needs (spot check — read the file, do not edit it):

```bash
grep -E 'CREATE TABLE' "prisma/migrations/<INIT_DIR>/migration.sql" | head -30
```

It must create at least `User`, `Call`, `Team`, `ActionItem`, `Decision`, `NextStep`, `Speaker`, `Analytics`, `Integration`, `RateLimit`, `CompetitorMention`, `AuditLog`, `Notification` (the tables the 15 incremental migrations only `ALTER`). If it does not contain `CREATE TABLE "Call"`, the deploy in Step 3 will fail again — fix the init FIRST.

---

## 6. Step 3 — Bootstrap prod (apply all 16 migrations)

```bash
DATABASE_URL="$PROD_DATABASE_URL" npx prisma migrate deploy
```

### Success-output signature to look for

```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "neondb" at "ep-long-tooth-...neon.tech:5432"

16 migrations found in prisma/migrations

Applying migration `<INIT_DIR>`
Applying migration `20260518230619_add_call_insights`
Applying migration `20260525183500_add_call_collaboration_and_speaker_metrics`
Applying migration `20260610_add_user_preferences`
Applying migration `20260610_auditlog_userid_nullable`
Applying migration `20260610_knowledge_graph`
Applying migration `20260621000000_add_api_keys_and_team_branding`
Applying migration `20260626132842_add_user_billing_and_team_model`
Applying migration `20260717000000_add_call_ispublic`
Applying migration `20260719000000_add_call_archived`
Applying migration `20260720000000_add_partner_application`
Applying migration `20260720010000_add_partner_referral_code`
Applying migration `20260804000000_add_call_title`
Applying migration `20260805000000_add_byok_keys`
Applying migration `20260806000000_add_team_vocabulary`
Applying migration `20260806000001_action_item_timestamp`

All migrations have been successfully applied.
```

Two-part success signature:
1. The **final line** `All migrations have been successfully applied.` AND
2. **exit code 0**.

Failure mode: deploy stops at the first failing migration with `P3009`/`P3014` and a non-zero exit. Do NOT keep re-running blindly — go to §7.2.

---

## 7. Step 4 — Post-verification (READ-ONLY)

### 7.1 Re-run the pre-flight script

```bash
node preflight-prod.cjs
```

**Expected:**
- `current_database: neondb`
- `_prisma_migrations`: **16 rows**, one per migration folder name. Every row has `finished_at` NOT NULL and `applied_steps_count` > 0. No row has error text in `logs`.
- Public tables: **count 20** (the 20 models in `schema.prisma`) + `_prisma_migrations` = 21 total. At minimum spot-check that `User`, `Call`, `Team`, and `CallInsight` are present (the last one is the previously-failed migration — it must be there now).

> Benign variation: some Prisma versions re-INSERT the row for a re-applied migration instead of updating it, so you may see a second row for `20260518230619_add_call_insights` (17 rows, 16 names) with the old rolled-back row lingering. That is cosmetic. The authoritative invariants: every migration name has a row with `finished_at NOT NULL`, and no row has `finished_at IS NULL`. Do not hand-edit `_prisma_migrations`.

### 7.2 Drift check against migrations ↔ schema (uses the throwaway shadow)

`scripts/check-schema-drift.ts` runs `prisma migrate diff --from-migrations --to-schema-datamodel --shadow-database-url "$SHADOW"`. It does **not** diff the prod database; `DATABASE_URL` is only used for a host log line. **CRITICAL**: the script falls back to `DATABASE_URL` as the shadow when `SHADOW_DATABASE_URL` is unset — that would create/drop tables in prod. **Always set `SHADOW_DATABASE_URL` to `gauge_shadow`.**

```bash
DATABASE_URL="$PROD_DATABASE_URL" \
SHADOW_DATABASE_URL="$SHADOW_DATABASE_URL" \
npx tsx scripts/check-schema-drift.ts
```

**Expected:** `✓ No drift. schema.prisma matches all migrations.` and exit code **0**.

This creates and drops tables inside `gauge_shadow` — safe, it is a throwaway scratch DB on the same Neon project.

**Fallback if `gauge_shadow` is unreachable**: skip the drift check and rely on `migrate deploy`'s own shadow-based verification (deploy already replays migrations against a temporary shadow to validate checksums) plus the §7.1 row/table checks. Record in the log that drift verification was skipped and why.

### 7.3 Optional final status

```bash
DATABASE_URL="$PROD_DATABASE_URL" npx prisma migrate status
```

Expected: `Database schema is up to date!` and exit code 0.

---

## 8. Post-repair — Vercel recovery & cleanup

1. **Trigger a fresh Vercel deploy** (the currently-red deployment will not re-run on its own). Either re-run the failed deployment from the Vercel dashboard, run `vercel --prod`, or push a trivial commit to `main`. The build will run `prisma migrate deploy` (no-op — all 16 already applied) then `next build` → green.
2. **Delete the prod env file** (it is untracked AND not covered by `.gitignore` — `.gitignore` only lists `.env`, `.env.local`, `.env*.local`; leaving it around risks an accidental `git add -A` commit of every prod secret):

```bash
rm .env.vercel-prod
```

3. **Delete the temporary inspection script** (contains no secrets, but keep the tree clean):

```bash
rm preflight-prod.cjs
```

4. **Never commit** the `.env.vercel-prod` contents anywhere. If it must be preserved for future ops, store it OUTSIDE the repo (e.g. `~/Desktop/` or a secret manager) before deleting.

---

## 9. Rollback / emergency

### 9.1 Decision logic: `--rolled-back` vs `--applied` (for ANY failed migration)

Before resolving, ask one question: **does the migration's DDL already exist in the DB?**

- `applied_steps_count = 0` **and** the target objects do not exist (query `information_schema`; e.g. for `20260518230619` check `CallInsight` is absent) → **`--rolled-back`**. Deploy will re-run it after the dependency is fixed. ✅ Our current case.
- `applied_steps_count > 0` **or** the objects already exist (DDL partially/fully applied before the error) → **`--applied`**. Marks it applied so deploy skips re-running it. If you use `--rolled-back` in this state, deploy re-runs the DDL and fails with "already exists".
- **Never** pick `--applied` just to "make it go away" on a migration that was never applied — you would silently skip its DDL and create a schema gap (exactly the bug class the drift gate exists for).

### 9.2 `migrate resolve` fails

**Checksum mismatch** (Prisma refuses because the local `migration.sql` differs from the checksum recorded in `_prisma_migrations`):
- Do NOT force anything. Stop.
- `git diff -- prisma/migrations/20260518230619_add_call_insights/` — if an executor modified the file, restore it (`git checkout -- <file>`) and re-run Step 1.
- If the file is unchanged from git, compare against the row's `logs`/`checksum`; with `applied_steps_count = 0` it is still safe to use `--rolled-back` — re-run the resolve command once. If it still refuses, snapshot the error and escalate; do not hand-edit `_prisma_migrations`.

**"Migration not found"** — the folder name passed does not match a folder in `prisma/migrations/`. Re-check the exact name (`find prisma/migrations -maxdepth 1 -type d | sort`).

### 9.3 `migrate deploy` fails mid-chain

Deploy is transactional per-migration (each runs in its own transaction), so there is **nothing to undo globally**:
1. Stop. Identify the failing migration from the error + the `_prisma_migrations` row with `finished_at NULL` (re-run `node preflight-prod.cjs`).
2. Fix the cause (usually a bug in the migration itself — most likely the init migration if it didn't create `Call` before `20260518230619` runs).
3. `DATABASE_URL="$PROD_DATABASE_URL" npx prisma migrate resolve --rolled-back <FAILING_NAME>` (per §9.1 logic — if its DDL already exists, use `--applied` instead).
4. Re-run Step 3. Deploy re-applies the resolved migration and continues with the rest.

### 9.4 Worst case (irrecoverable)

The prod DB is empty and disposable — the entire repair can be restarted from §3 at any time because every write is migration-table bookkeeping plus replayable DDL. There is no user data to lose. The only hard requirement: **never point any tool at `neondb` outside the exact commands in this runbook.**

---

## 10. Safety guardrails (non-negotiable)

1. **Never run anything against `neondb` except the exact commands in this runbook.** All `prisma migrate`/`node` invocations above either are read-only (`$queryRawUnsafe` SELECTs, `migrate status`, drift check with explicit shadow) or are the two sanctioned migration commands (`migrate resolve`, `migrate deploy`).
2. **Never use `prisma db push` against prod.** Ever. It force-syncs schema and can destroy data. This runbook only uses migrations.
3. **Never set `SHADOW_DATABASE_URL` to the prod URL, and never omit it** for `check-schema-drift.ts` — the script falls back to `DATABASE_URL` as the shadow (would create/drop tables in prod). `gauge_shadow` is the only permitted shadow for this repair.
4. **Always use `DATABASE_URL_UNPOOLED`** for prod DDL (direct connection). The pooled `DATABASE_URL` runs through PgBouncer transaction-mode, which breaks multi-statement migrations/DDL.
5. **Never print, paste, or log the URL or password.** The helpers in §2 never echo it; the safe print redacts credentials. If any tool output ever shows the full connection string, treat that output as sensitive and scrub it from the session log.
6. **Never `git add -A`.** The repo already has unrelated dirty files (`graphify-out/…`, `scripts/.proof-*.json`), and `.env.vercel-prod` is untracked and not gitignored. Stage only intentional files, never `.env*`.
7. **Run everything from the repo root** so Prisma finds `prisma/schema.prisma` and the local `node_modules/.bin/prisma` (5.22.0). If `npx` offers to install a different Prisma version, decline.
8. **Do not modify** `vercel.json`, `package.json`, `src/test/migration-deploy-gate.test.ts`, or `scripts/check-schema-drift.ts` — the migrate-at-build contract is intentional and stays.
9. Do not `git commit` anything as part of this repair unless a migration bug is found and fixed — migration fixes belong in their own reviewable change.

---

## 11. Exact ordered command sequence (cheat sheet — no URLs/passwords)

```bash
cd "/Users/kushagarhsingh/Desktop/com analayze/sales-call-notes"

# 0. helpers
PROD_DATABASE_URL="$(grep -E '^DATABASE_URL_UNPOOLED=' .env.vercel-prod | head -1 | cut -d= -f2- | tr -d '"')"
[ -n "$PROD_DATABASE_URL" ] && case "$PROD_DATABASE_URL" in */neondb|*/neondb?*) :;; *) exit 1;; esac
SHADOW_DATABASE_URL="${PROD_DATABASE_URL/\/neondb/\/gauge_shadow}"

# 1. pre-flight (read-only) — expect 1 failed row, 0 tables
node preflight-prod.cjs

# 2. resolve the failed migration
DATABASE_URL="$PROD_DATABASE_URL" npx prisma migrate resolve --rolled-back 20260518230619_add_call_insights

# 3. verify init migration present (substitute <INIT_DIR>), folder count = 16
find prisma/migrations -mindepth 1 -maxdepth 1 -type d | sort
ls -la "prisma/migrations/<INIT_DIR>/migration.sql"

# 4. bootstrap prod — expect "All migrations have been successfully applied." + exit 0
DATABASE_URL="$PROD_DATABASE_URL" npx prisma migrate deploy

# 5. post-verification — expect 16 rows finished, 20 app tables, no drift
node preflight-prod.cjs
DATABASE_URL="$PROD_DATABASE_URL" SHADOW_DATABASE_URL="$SHADOW_DATABASE_URL" npx tsx scripts/check-schema-drift.ts

# 6. cleanup
rm preflight-prod.cjs .env.vercel-prod
```

---

## 12. Change manifest

This runbook is a **document only**. It makes no repo changes.

- ✅ Created: `docs/roadmap/execution/plans/PROD-MIGRATE-REPAIR-RUNBOOK.md`
- ✅ NO changes to `vercel.json`
- ✅ NO changes to `package.json`
- ✅ NO changes to `src/test/migration-deploy-gate.test.ts`
- ✅ NO changes to `scripts/check-schema-drift.ts`
- ✅ No DB writes performed during research/authoring; no `git` commits made.
