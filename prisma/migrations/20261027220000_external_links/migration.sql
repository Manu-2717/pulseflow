-- CreateTable
CREATE TABLE "TaskExternalLink" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "state" TEXT,
    "checkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskExternalLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskExternalLink_taskId_idx" ON "TaskExternalLink"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskExternalLink_taskId_url_key" ON "TaskExternalLink"("taskId", "url");

-- AddForeignKey
ALTER TABLE "TaskExternalLink" ADD CONSTRAINT "TaskExternalLink_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
