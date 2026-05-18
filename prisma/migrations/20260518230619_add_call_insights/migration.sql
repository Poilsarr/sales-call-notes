-- CreateTable
CREATE TABLE "CallInsight" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "sentimentScore" DOUBLE PRECISION,
    "talkRatio" JSONB,
    "objections" JSONB,
    "coachingNotes" JSONB,
    "closeProbability" DOUBLE PRECISION,
    "topics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CallInsight_callId_key" ON "CallInsight"("callId");

-- CreateIndex
CREATE INDEX "CallInsight_callId_idx" ON "CallInsight"("callId");

-- AddForeignKey
ALTER TABLE "CallInsight" ADD CONSTRAINT "CallInsight_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;
