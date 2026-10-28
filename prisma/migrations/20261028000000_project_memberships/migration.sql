CREATE TABLE "ProjectMembership" (
 "id" TEXT NOT NULL,
 "projectId" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "role" TEXT NOT NULL DEFAULT 'MEMBER',
 CONSTRAINT "ProjectMembership_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "ProjectMembership_role_check" CHECK ("role" IN ('ADMIN','MEMBER')),
 CONSTRAINT "ProjectMembership_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "ProjectMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ProjectMembership_projectId_userId_key" ON "ProjectMembership"("projectId","userId");
CREATE INDEX "ProjectMembership_userId_idx" ON "ProjectMembership"("userId");
INSERT INTO "ProjectMembership" ("id","projectId","userId","role")
SELECT DISTINCT 'backfill-' || md5(t."projectId" || ':' || t."assigneeId"), t."projectId", t."assigneeId", 'MEMBER'
FROM "Task" t JOIN "Membership" m ON m."workspaceId" = t."workspaceId" AND m."userId" = t."assigneeId"
WHERE t."projectId" IS NOT NULL AND t."assigneeId" IS NOT NULL;
