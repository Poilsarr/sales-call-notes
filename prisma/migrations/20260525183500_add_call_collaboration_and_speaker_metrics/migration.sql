-- AlterTable
ALTER TABLE "Analytics"
ADD COLUMN "speakerMetrics" JSONB,
ADD COLUMN "sentimentTimeline" JSONB;

-- AlterTable
ALTER TABLE "Call"
ADD COLUMN "assigneeId" TEXT,
ADD COLUMN "sharedWithTeam" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CallComment" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Call_assigneeId_idx" ON "Call"("assigneeId");

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "CallComment_callId_idx" ON "CallComment"("callId");

-- CreateIndex
CREATE INDEX "CallComment_userId_idx" ON "CallComment"("userId");

-- CreateIndex
CREATE INDEX "CallComment_createdAt_idx" ON "CallComment"("createdAt");

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_assigneeId_fkey"
FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallComment" ADD CONSTRAINT "CallComment_callId_fkey"
FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallComment" ADD CONSTRAINT "CallComment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
