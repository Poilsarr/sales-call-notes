-- Reconciliation migration — align the DB produced by migrations #1-#15
-- with schema.prisma.
--
-- Background: the drift gate (scripts/check-schema-drift.ts) was silently
-- false-green while the migration chain could not replay on an empty shadow
-- DB (no init migration -> "Call does not exist" -> empty stdout -> "no
-- drift"). Once the init migration (20260501000000_init) made replay
-- possible, the gate honestly surfaced five pre-existing divergences baked
-- into the immutable, already-applied migrations #1/#2/#6/#7/#14:
--
--   #1 CallInsight: CREATE TABLE omitted `personalization` + `salesScorecard`
--      (schema.prisma declares both).
--   #2 Call_userId_fkey: created ON DELETE CASCADE, schema.prisma declares
--      the Prisma default RESTRICT.
--   #6 ApiKey: schema declares @@index([prefix]) but no such index exists.
--   #7 User: extra User_slackUserId_idx (schema has no such index) and a
--      missing User_paddleCustomerId_idx (only the UNIQUE constraint was
--      created; schema also declares @@index([paddleCustomerId])).
--   #14 VocabularyEntry_teamId_fkey: created ON DELETE CASCADE, schema.prisma
--      declares the Prisma default RESTRICT.
--
-- This migration applies exactly the delta `prisma migrate diff
-- --from-migrations --to-schema-datamodel` produces, so that replaying the
-- full chain (init + #1-#15 + this) reproduces schema.prisma and the drift
-- gate stays genuinely green. Safe on any database: the affected tables
-- (CallInsight, ApiKey, User, Call, VocabularyEntry) contain no production
-- data at the time of writing.

-- DropForeignKey
ALTER TABLE "Call" DROP CONSTRAINT "Call_userId_fkey";

-- DropForeignKey
ALTER TABLE "VocabularyEntry" DROP CONSTRAINT "VocabularyEntry_teamId_fkey";

-- DropIndex
DROP INDEX "User_slackUserId_idx";

-- AlterTable
ALTER TABLE "CallInsight" ADD COLUMN     "personalization" JSONB,
ADD COLUMN     "salesScorecard" JSONB;

-- CreateIndex
CREATE INDEX "ApiKey_prefix_idx" ON "ApiKey"("prefix");

-- CreateIndex
CREATE INDEX "User_paddleCustomerId_idx" ON "User"("paddleCustomerId");

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyEntry" ADD CONSTRAINT "VocabularyEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
