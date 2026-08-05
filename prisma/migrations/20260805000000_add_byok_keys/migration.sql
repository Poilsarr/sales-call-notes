-- Add BYOK (bring-your-own-key) columns to User.
--
-- Background: Pro+ users can plug in their own OpenAI/Groq API keys so
-- their calls are billed to their key, not our pool. Raw keys are
-- AES-256-GCM encrypted at rest with the BYOK_MASTER_KEY env var
-- (src/lib/byok.ts) — never stored in plaintext. Nullable so existing
-- rows need no backfill; NULL means "use Gauge's shared keys".
--
-- Idempotent (IF NOT EXISTS) so re-running is a safe no-op.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "byok_openai_key" TEXT,
                   ADD COLUMN IF NOT EXISTS "byok_groq_key" TEXT;
