ALTER TABLE "Invite" ADD COLUMN "projectId" TEXT;
CREATE INDEX "Invite_projectId_idx" ON "Invite"("projectId");
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
