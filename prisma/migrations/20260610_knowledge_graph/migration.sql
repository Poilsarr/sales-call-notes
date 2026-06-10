CREATE TABLE "KnowledgeEntity" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "calls" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KnowledgeEntity_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "KnowledgeEntity_userId_type_value_key" ON "KnowledgeEntity"("userId", "type", "value");
CREATE INDEX "KnowledgeEntity_userId_type_value_idx" ON "KnowledgeEntity"("userId", "type", "value");

CREATE TABLE "KnowledgeRelation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "fromEntityId" TEXT NOT NULL,
  "toEntityId" TEXT NOT NULL,
  "relation" TEXT NOT NULL,
  "calls" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KnowledgeRelation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "KnowledgeRelation_userId_idx" ON "KnowledgeRelation"("userId");
CREATE INDEX "KnowledgeRelation_fromEntityId_idx" ON "KnowledgeRelation"("fromEntityId");
CREATE INDEX "KnowledgeRelation_toEntityId_idx" ON "KnowledgeRelation"("toEntityId");
CREATE INDEX "KnowledgeRelation_relation_idx" ON "KnowledgeRelation"("relation");
