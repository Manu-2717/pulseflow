-- PostgreSQL 15+ supports a column list for SET NULL. Preserve project scope
-- when a roster entry is removed, clearing only its assignment.
-- Prisma cannot currently express the SET NULL column list in its schema.
UPDATE "Task" t SET "assigneeId" = NULL
WHERE t."projectId" IS NOT NULL AND t."assigneeId" IS NOT NULL
AND NOT EXISTS (
 SELECT 1 FROM "ProjectMembership" pm
 WHERE pm."projectId" = t."projectId" AND pm."userId" = t."assigneeId"
);
ALTER TABLE "Task" ADD CONSTRAINT "Task_project_assignment_membership_fkey"
FOREIGN KEY ("projectId", "assigneeId")
REFERENCES "ProjectMembership" ("projectId", "userId")
ON DELETE SET NULL ("assigneeId") ON UPDATE CASCADE;
