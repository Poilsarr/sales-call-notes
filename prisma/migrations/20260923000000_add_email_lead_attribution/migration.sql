-- Add visitor attribution columns to EmailLead (Executor B, VISITOR-PIPELINE-PLAN).
-- All columns nullable, no backfill, no data rewrite. Small table so a plain
-- ADD COLUMN + CREATE INDEX is safe (no CONCURRENTLY needed).

ALTER TABLE "EmailLead" ADD COLUMN IF NOT EXISTS "distinctId" VARCHAR(128);
ALTER TABLE "EmailLead" ADD COLUMN IF NOT EXISTS "landingPage" VARCHAR(1024);
ALTER TABLE "EmailLead" ADD COLUMN IF NOT EXISTS "referrer" VARCHAR(1024);
ALTER TABLE "EmailLead" ADD COLUMN IF NOT EXISTS "utmSource" VARCHAR(128);
ALTER TABLE "EmailLead" ADD COLUMN IF NOT EXISTS "utmMedium" VARCHAR(128);
ALTER TABLE "EmailLead" ADD COLUMN IF NOT EXISTS "utmCampaign" VARCHAR(128);
ALTER TABLE "EmailLead" ADD COLUMN IF NOT EXISTS "utmContent" VARCHAR(128);
ALTER TABLE "EmailLead" ADD COLUMN IF NOT EXISTS "utmTerm" VARCHAR(128);
ALTER TABLE "EmailLead" ADD COLUMN IF NOT EXISTS "userAgent" VARCHAR(512);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmailLead_distinctId_idx" ON "EmailLead"("distinctId");
