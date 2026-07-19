-- Add `archived` column to Call model for plan-based retention.
--
-- Background: free users keep a limited number of calls (uploadLimit in
-- src/lib/plans.ts). When a free user uploads beyond their limit, the
-- OLDEST calls beyond the cap are soft-archived (archived=true) so they
-- stay in the DB (restorable on upgrade) but are hidden from the calls
-- list / history. Pro & Business have uploadLimit="unlimited" so they
-- are never archived.
--
-- Idempotent (IF NOT EXISTS) so re-running is a safe no-op.

ALTER TABLE "Call" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;
