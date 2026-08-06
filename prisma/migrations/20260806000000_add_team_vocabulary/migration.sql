-- Team custom vocabulary (S7): lets teams teach Gauge their internal
-- terminology so analysis and summaries use the right words.
--
-- One row per term; term + definition are free text (term ≤100 chars,
-- definition ≤500 chars, enforced in the API + UI). Cascade delete
-- when the team is removed. Idempotent (IF NOT EXISTS) so re-running
-- is a safe no-op.

CREATE TABLE IF NOT EXISTS "VocabularyEntry" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularyEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VocabularyEntry_teamId_idx" ON "VocabularyEntry"("teamId");

ALTER TABLE "VocabularyEntry" ADD CONSTRAINT "VocabularyEntry_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
