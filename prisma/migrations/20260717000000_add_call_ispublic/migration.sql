-- Add isPublic column to Call model for public share links (Phase 2.1).
--
-- Background: Phase 2.1 introduces public, SEO-indexable share
-- pages at /share/[id]. A call is only visible on that route when
-- its isPublic flag is true. The schema gained this field but no
-- migration was written, so production DB is missing the column
-- and /share/[id] would 500.
--
-- All statements are idempotent (IF NOT EXISTS) so re-running on a
-- DB where the column already exists is a safe no-op.

-- ─── Call table additions ───
ALTER TABLE "Call" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false;
