CREATE TABLE "AiBriefQuota" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AiBriefQuota_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AiBriefQuota_workspaceId_userId_windowStart_key" ON "AiBriefQuota"("workspaceId", "userId", "windowStart");
ALTER TABLE "AiBriefQuota" ADD CONSTRAINT "AiBriefQuota_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiBriefQuota" ADD CONSTRAINT "AiBriefQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
