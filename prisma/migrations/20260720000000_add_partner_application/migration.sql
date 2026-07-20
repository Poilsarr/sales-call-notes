-- CreateTable
CREATE TABLE IF NOT EXISTS "PartnerApplication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "reach" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PartnerApplication_createdAt_idx" ON "PartnerApplication"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PartnerApplication_status_idx" ON "PartnerApplication"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PartnerApplication_email_idx" ON "PartnerApplication"("email");
