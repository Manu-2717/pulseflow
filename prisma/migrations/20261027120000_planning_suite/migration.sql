-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#57a76a',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceDocument" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "trigger" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subtask" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subtask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDependency" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,

    CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_workspaceId_idx" ON "Project"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceDocument_workspaceId_idx" ON "WorkspaceDocument"("workspaceId");

-- CreateIndex
CREATE INDEX "Goal_workspaceId_idx" ON "Goal"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationRule_workspaceId_trigger_action_key" ON "AutomationRule"("workspaceId", "trigger", "action");

-- CreateIndex
CREATE INDEX "Subtask_taskId_idx" ON "Subtask"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskDependency_taskId_dependsOnId_key" ON "TaskDependency"("taskId", "dependsOnId");

-- CreateIndex
CREATE INDEX "TimeEntry_taskId_createdAt_idx" ON "TimeEntry"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "TimeEntry_userId_createdAt_idx" ON "TimeEntry"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceDocument" ADD CONSTRAINT "WorkspaceDocument_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtask" ADD CONSTRAINT "Subtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
