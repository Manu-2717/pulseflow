-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "recurrence" TEXT,
ADD COLUMN     "recurrenceSourceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Task_recurrenceSourceId_key" ON "Task"("recurrenceSourceId");
