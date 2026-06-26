-- Add User billing columns + Team model.
--
-- Background: schema.prisma gained these fields after the
-- 20260610_add_user_preferences migration but no migration was
-- ever written. Production DB has been missing the columns
-- since then, breaking every endpoint that touches User rows
-- (analyze, billing, integrations, team, history).
--
-- This migration closes the gap. All statements are idempotent
-- (IF NOT EXISTS / DO blocks) so re-running it on a DB where
-- parts already exist is safe. The schema is the source of
-- truth; if a column has since been added by hand or a previous
-- attempt, the IF NOT EXISTS guards make this a no-op.

-- ─── User table additions ───
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "paddleCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "paddleSubscriptionId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "cancellationEffectiveDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "teamId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "teamRole" TEXT NOT NULL DEFAULT 'MEMBER';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "slackUserId" TEXT;

-- Unique constraints required by schema.prisma
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'User_paddleCustomerId_key'
  ) THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_paddleCustomerId_key" UNIQUE ("paddleCustomerId");
  END IF;
END $$;

-- Indexes that improve query performance
CREATE INDEX IF NOT EXISTS "User_teamId_idx" ON "User"("teamId");
CREATE INDEX IF NOT EXISTS "User_slackUserId_idx" ON "User"("slackUserId");

-- ─── Team table ───
CREATE TABLE IF NOT EXISTS "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "settings" TEXT,
    "brandColor" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Team_slug_key" ON "Team"("slug");
CREATE INDEX IF NOT EXISTS "Team_slug_idx" ON "Team"("slug");
CREATE INDEX IF NOT EXISTS "Team_ownerId_idx" ON "Team"("ownerId");

-- FK from Team.ownerId → User.id (matches schema relation "teamOwner")
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Team_ownerId_fkey'
  ) THEN
    ALTER TABLE "Team"
      ADD CONSTRAINT "Team_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- FK from User.teamId → Team.id (matches schema relation "teamMembers")
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'User_teamId_fkey'
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_teamId_fkey"
      FOREIGN KEY ("teamId") REFERENCES "Team"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;