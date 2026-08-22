-- Add PaddleEvent for webhook idempotency (H3) — dedup by notification_id/event_id

CREATE TABLE IF NOT EXISTS "PaddleEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaddleEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PaddleEvent_type_idx" ON "PaddleEvent"("type");
CREATE INDEX IF NOT EXISTS "PaddleEvent_createdAt_idx" ON "PaddleEvent"("createdAt");
