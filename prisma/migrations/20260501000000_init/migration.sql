-- Init migration — bootstraps the base schema for Gauge.
--
-- Background: the base schema (User, Team, Call, ActionItem, Decision,
-- NextStep, Speaker, Analytics, Integration, RateLimit, CompetitorMention,
-- AuditLog, Notification) was bootstrapped in dev via `prisma db push` and
-- never captured in a migration. The first real migration
-- (20260518230619_add_call_insights) creates CallInsight with a FK to
-- "Call", so `prisma migrate deploy` against an empty database fails with
-- `relation "Call" does not exist`.
--
-- This migration recreates the EXACT pre-#1 state: every table, column,
-- index and constraint that existed BEFORE migration #1, i.e. WITHOUT
-- anything that migrations #1-#15 create (CallInsight, CallComment,
-- KnowledgeEntity, KnowledgeRelation, ApiKey, PartnerApplication,
-- VocabularyEntry, User billing/preferences/BYOK columns, Team
-- brandColor/logoUrl, Call assigneeId/sharedWithTeam/isPublic/archived/
-- title, Analytics speakerMetrics/sentimentTimeline, ActionItem.timestamp,
-- and the AuditLog.userId NOT NULL drop).
--
-- Note: Call.userId has NO foreign key in this base state. The
-- Call_userId_fkey constraint is created later by
-- 20260525183500_add_call_collaboration_and_speaker_metrics (which adds it
-- unconditionally), so pre-creating it here would make that migration fail.
-- Call.teamId → Team is base (no migration ever adds that FK).

BEGIN;

-- ─── User ────────────────────────────────────────────────────────────────
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "credits" INTEGER NOT NULL DEFAULT 5,
    "hasOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- ─── Team ────────────────────────────────────────────────────────────────
-- Base (pre-#1): later migrations only ADD brandColor/logoUrl (#6) and the
-- table was never created by any migration — it MUST exist before #6.
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "settings" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- ─── Call ────────────────────────────────────────────────────────────────
-- Base: userId/teamId/filename/... — no assigneeId, sharedWithTeam, isPublic,
-- archived, title (added by migrations #2/#8/#9/#12). No userId FK (#2 adds
-- Call_userId_fkey); teamId FK is base (no migration ever adds it).
CREATE TABLE "Call" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "filename" TEXT NOT NULL,
    "audioUrl" TEXT,
    "duration" INTEGER,
    "transcript" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "summary" TEXT,
    "healthScore" DOUBLE PRECISION,
    "sentiment" TEXT,
    "crmSynced" BOOLEAN NOT NULL DEFAULT false,
    "crmProvider" TEXT,
    "crmRecordId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'upload',
    "tags" TEXT,
    "embedding" DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- ─── ActionItem ──────────────────────────────────────────────────────────
-- Base: no `timestamp` column (added by migration #15).
CREATE TABLE "ActionItem" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "due" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionItem_pkey" PRIMARY KEY ("id")
);

-- ─── Decision ────────────────────────────────────────────────────────────
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- ─── NextStep ────────────────────────────────────────────────────────────
CREATE TABLE "NextStep" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "date" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NextStep_pkey" PRIMARY KEY ("id")
);

-- ─── Speaker ─────────────────────────────────────────────────────────────
CREATE TABLE "Speaker" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "name" TEXT,
    "label" TEXT NOT NULL,
    "segments" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Speaker_pkey" PRIMARY KEY ("id")
);

-- ─── Analytics ───────────────────────────────────────────────────────────
-- Base: no speakerMetrics / sentimentTimeline (added by migration #2).
CREATE TABLE "Analytics" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "talkRatio" TEXT,
    "interruptions" INTEGER,
    "questionsAsked" INTEGER,
    "objections" TEXT,
    "budgetMentioned" BOOLEAN NOT NULL DEFAULT false,
    "timelineMentioned" BOOLEAN NOT NULL DEFAULT false,
    "decisionMakerPresent" BOOLEAN NOT NULL DEFAULT false,
    "competitorMentioned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("id")
);

-- ─── Integration ─────────────────────────────────────────────────────────
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- ─── RateLimit ───────────────────────────────────────────────────────────
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- ─── CompetitorMention ───────────────────────────────────────────────────
CREATE TABLE "CompetitorMention" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "competitor" TEXT NOT NULL,
    "context" TEXT,
    "sentiment" TEXT,
    "mentionedBy" TEXT,
    "timestamp" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitorMention_pkey" PRIMARY KEY ("id")
);

-- ─── AuditLog ────────────────────────────────────────────────────────────
-- Base: userId NOT NULL (migration #4 drops NOT NULL later).
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityId" TEXT,
    "entityType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- ─── Notification ────────────────────────────────────────────────────────
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- ─── Indexes ─────────────────────────────────────────────────────────────
-- User (base: clerkId/email unique + email/clerkId btree). The
-- paddleCustomerId/teamId indexes are added by migration #7.
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- Team (slug unique + slug/ownerId btree; later migrations no-op thanks to
-- their IF NOT EXISTS guards).
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");
CREATE INDEX "Team_slug_idx" ON "Team"("slug");
CREATE INDEX "Team_ownerId_idx" ON "Team"("ownerId");

-- Call (userId/teamId/createdAt; assigneeId index is added by migration #2).
CREATE INDEX "Call_userId_idx" ON "Call"("userId");
CREATE INDEX "Call_teamId_idx" ON "Call"("teamId");
CREATE INDEX "Call_createdAt_idx" ON "Call"("createdAt");

CREATE INDEX "ActionItem_callId_idx" ON "ActionItem"("callId");
CREATE INDEX "ActionItem_status_idx" ON "ActionItem"("status");

CREATE INDEX "Decision_callId_idx" ON "Decision"("callId");

CREATE INDEX "NextStep_callId_idx" ON "NextStep"("callId");
CREATE INDEX "NextStep_status_idx" ON "NextStep"("status");

CREATE INDEX "Speaker_callId_idx" ON "Speaker"("callId");

CREATE UNIQUE INDEX "Analytics_callId_key" ON "Analytics"("callId");

CREATE INDEX "Integration_teamId_idx" ON "Integration"("teamId");
CREATE INDEX "Integration_provider_idx" ON "Integration"("provider");
CREATE UNIQUE INDEX "Integration_teamId_provider_key" ON "Integration"("teamId", "provider");

CREATE UNIQUE INDEX "RateLimit_userId_key" ON "RateLimit"("userId");
CREATE INDEX "RateLimit_userId_idx" ON "RateLimit"("userId");

CREATE INDEX "CompetitorMention_callId_idx" ON "CompetitorMention"("callId");
CREATE INDEX "CompetitorMention_competitor_idx" ON "CompetitorMention"("competitor");
CREATE INDEX "CompetitorMention_createdAt_idx" ON "CompetitorMention"("createdAt");

CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX "Notification_readAt_idx" ON "Notification"("readAt");

-- ─── Foreign keys ────────────────────────────────────────────────────────
-- NOTE: Call_userId_fkey is intentionally NOT here — migration #2
-- (20260525183500_add_call_collaboration_and_speaker_metrics) adds it
-- unconditionally. Same for Call_assigneeId_fkey (#2) and
-- User_teamId_fkey + User_paddleCustomerId_key (#7).

ALTER TABLE "Team" ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Call" ADD CONSTRAINT "Call_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Decision" ADD CONSTRAINT "Decision_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NextStep" ADD CONSTRAINT "NextStep_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Speaker" ADD CONSTRAINT "Speaker_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Integration" ADD CONSTRAINT "Integration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CompetitorMention" ADD CONSTRAINT "CompetitorMention_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
