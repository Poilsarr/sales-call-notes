-- Intelligence V2 — your rivals, living visuals
-- Adds User/Team.companyName, TrackedCompetitor watchlist, and CompetitorMention denorm
-- for watchlist-scoped intelligence (mode=watchlist|all) + threat radar/heatmap/river/treemap.
-- All additive, nullable, safe for existing rows (discovery mode = empty watchlist).

-- AlterTable User: companyName for solo users
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyName" VARCHAR(120);

-- AlterTable Team: companyName for team workspaces
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "companyName" VARCHAR(120);

-- CreateTable TrackedCompetitor
CREATE TABLE IF NOT EXISTS "TrackedCompetitor" (
    "id" TEXT NOT NULL,
    "teamId" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "normalizedName" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    CONSTRAINT "TrackedCompetitor_pkey" PRIMARY KEY ("id")
);

-- AlterTable CompetitorMention: denorm + watchlist hit
ALTER TABLE "CompetitorMention" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "CompetitorMention" ADD COLUMN IF NOT EXISTS "teamId" TEXT;
ALTER TABLE "CompetitorMention" ADD COLUMN IF NOT EXISTS "normalizedCompetitor" VARCHAR(100);
ALTER TABLE "CompetitorMention" ADD COLUMN IF NOT EXISTS "isWatchlistHit" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CompetitorMention" ADD COLUMN IF NOT EXISTS "matchedEntryId" TEXT;

-- Backfill denorm from Call (existing rows keep null until backfill script runs)
-- NOTE: run separately if CompetitorMention has >50k rows to avoid long lock:
--   UPDATE "CompetitorMention" cm SET "userId"=c."userId", "teamId"=c."teamId"
--   FROM "Call" c WHERE cm."callId"=c.id AND cm."userId" IS NULL;
--   UPDATE "CompetitorMention" SET "normalizedCompetitor"=lower(trim("competitor"))
--   WHERE "normalizedCompetitor" IS NULL;

-- CreateIndex TrackedCompetitor
CREATE INDEX IF NOT EXISTS "TrackedCompetitor_teamId_idx" ON "TrackedCompetitor"("teamId");
CREATE INDEX IF NOT EXISTS "TrackedCompetitor_userId_idx" ON "TrackedCompetitor"("userId");
CREATE INDEX IF NOT EXISTS "TrackedCompetitor_normalizedName_idx" ON "TrackedCompetitor"("normalizedName");

-- Partial unique indexes for XOR tenant isolation (B-03): only enforce when scoped column is NOT NULL
-- Prisma's @@unique with nullable columns allows (NULL, 'clio') duplicates; these fix it.
CREATE UNIQUE INDEX IF NOT EXISTS "TrackedCompetitor_teamId_normalizedName_key" ON "TrackedCompetitor"("teamId", "normalizedName") WHERE "teamId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "TrackedCompetitor_userId_normalizedName_key" ON "TrackedCompetitor"("userId", "normalizedName") WHERE "userId" IS NOT NULL;

-- Check XOR: exactly one of teamId/userId set, and normalizedName non-empty
-- Use NOT VALID to avoid scanning existing rows (all NULL today); validate later.
DO $$ BEGIN
  ALTER TABLE "TrackedCompetitor" ADD CONSTRAINT "TrackedCompetitor_xor_check"
    CHECK ((("teamId" IS NOT NULL)::int + ("userId" IS NOT NULL)::int) = 1) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "TrackedCompetitor" ADD CONSTRAINT "TrackedCompetitor_norm_check"
    CHECK (char_length("normalizedName") > 0) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateIndex CompetitorMention denorm
CREATE INDEX IF NOT EXISTS "CompetitorMention_userId_createdAt_idx" ON "CompetitorMention"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "CompetitorMention_teamId_createdAt_idx" ON "CompetitorMention"("teamId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "CompetitorMention_userId_normalizedCompetitor_idx" ON "CompetitorMention"("userId", "normalizedCompetitor");
CREATE INDEX IF NOT EXISTS "CompetitorMention_teamId_normalizedCompetitor_idx" ON "CompetitorMention"("teamId", "normalizedCompetitor");
CREATE INDEX IF NOT EXISTS "CompetitorMention_userId_isWatchlistHit_createdAt_idx" ON "CompetitorMention"("userId", "isWatchlistHit", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "CompetitorMention_teamId_isWatchlistHit_createdAt_idx" ON "CompetitorMention"("teamId", "isWatchlistHit", "createdAt" DESC);

-- ForeignKeys
DO $$ BEGIN
  ALTER TABLE "TrackedCompetitor" ADD CONSTRAINT "TrackedCompetitor_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "TrackedCompetitor" ADD CONSTRAINT "TrackedCompetitor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "CompetitorMention" ADD CONSTRAINT "CompetitorMention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "CompetitorMention" ADD CONSTRAINT "CompetitorMention_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "CompetitorMention" ADD CONSTRAINT "CompetitorMention_matchedEntryId_fkey" FOREIGN KEY ("matchedEntryId") REFERENCES "TrackedCompetitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
