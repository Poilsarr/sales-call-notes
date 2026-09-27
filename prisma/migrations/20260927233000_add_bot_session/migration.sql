-- Add BotSession for meeting-bot intake (Recall bot dispatch + webhook status).
-- Additive only: one new standalone table, no changes to existing tables.
-- Standalone (no FK to Team) to keep the intake decoupled from Team edits.

-- CreateTable
CREATE TABLE "BotSession" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "meetingUrl" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'unknown',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "recallBotId" TEXT,
    "title" TEXT,
    "consentShown" BOOLEAN NOT NULL DEFAULT false,
    "transcriptUrl" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BotSession_teamId_idx" ON "BotSession"("teamId");

-- CreateIndex
CREATE INDEX "BotSession_status_idx" ON "BotSession"("status");
