-- Add RetentionPolicy for per-team audio/transcript retention windows.
-- Additive only: one new table, no changes to existing tables.
-- teamId is a plain unique column (no FK) so policies survive team deletes.

-- CreateTable
CREATE TABLE "RetentionPolicy" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "audioDays" INTEGER NOT NULL DEFAULT 90,
    "transcriptDays" INTEGER NOT NULL DEFAULT 365,
    "deleteAudioOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RetentionPolicy_teamId_key" ON "RetentionPolicy"("teamId");
