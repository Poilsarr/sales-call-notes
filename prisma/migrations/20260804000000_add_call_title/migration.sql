-- Add `title` column to Call model for custom call renaming.
--
-- Background: users can rename a call with a custom title (displayName =
-- title ?? filename everywhere). `filename` stays the source of truth for
-- the uploaded file; `title` is optional user text (1-120 code points,
-- validated in src/lib/call-title.ts). Nullable so existing rows need no
-- backfill; NULL means "show the filename".
--
-- Idempotent (IF NOT EXISTS) so re-running is a safe no-op.

ALTER TABLE "Call" ADD COLUMN IF NOT EXISTS "title" TEXT;
