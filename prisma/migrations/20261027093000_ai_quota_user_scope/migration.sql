DROP INDEX "AiBriefQuota_workspaceId_userId_windowStart_key";
ALTER TABLE "AiBriefQuota" DROP CONSTRAINT "AiBriefQuota_workspaceId_fkey";
ALTER TABLE "AiBriefQuota" DROP COLUMN "workspaceId";
CREATE UNIQUE INDEX "AiBriefQuota_userId_windowStart_key" ON "AiBriefQuota"("userId", "windowStart");
