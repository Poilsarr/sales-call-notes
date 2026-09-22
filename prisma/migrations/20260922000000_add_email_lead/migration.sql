-- CreateTable
CREATE TABLE IF NOT EXISTS "EmailLead" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT,
    "ctaId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmTokenHash" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EmailLead_email_key" ON "EmailLead"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EmailLead_confirmTokenHash_key" ON "EmailLead"("confirmTokenHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmailLead_status_idx" ON "EmailLead"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmailLead_createdAt_idx" ON "EmailLead"("createdAt");
