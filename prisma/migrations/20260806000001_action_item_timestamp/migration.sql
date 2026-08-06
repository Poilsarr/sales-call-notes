-- idempotent per TRD.md S8
ALTER TABLE "ActionItem" ADD COLUMN IF NOT EXISTS "timestamp" DOUBLE PRECISION;
