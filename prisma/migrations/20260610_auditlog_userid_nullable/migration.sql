-- Make AuditLog.userId nullable to match onDelete: SetNull semantics
ALTER TABLE "AuditLog" ALTER COLUMN "userId" DROP NOT NULL;
