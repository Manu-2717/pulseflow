ALTER TABLE "ProjectMembership" DROP CONSTRAINT "ProjectMembership_role_check";
ALTER TABLE "ProjectMembership" ADD CONSTRAINT "ProjectMembership_role_check" CHECK ("role" IN ('ADMIN','MENTOR','MEMBER'));
CREATE TABLE "TaskComment" (
 "id" TEXT NOT NULL,
 "taskId" TEXT NOT NULL,
 "authorId" TEXT NOT NULL,
 "content" TEXT NOT NULL,
 "kind" TEXT NOT NULL DEFAULT 'COMMENT',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "TaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "TaskComment_kind_check" CHECK ("kind" IN ('COMMENT','SUBMITTED','APPROVED','CHANGES_REQUESTED','REOPENED'))
);
CREATE INDEX "TaskComment_taskId_createdAt_idx" ON "TaskComment"("taskId","createdAt");
