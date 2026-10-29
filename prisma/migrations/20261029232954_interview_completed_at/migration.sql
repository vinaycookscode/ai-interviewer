-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "completedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Interview_jobId_score_idx" ON "Interview"("jobId", "score");

-- Backfill: a finished interview ended with its last answer; without answers, use when it was created.
UPDATE "Interview" i
SET "completedAt" = COALESCE(
    (SELECT MAX(a."createdAt") FROM "Answer" a WHERE a."interviewId" = i."id"),
    i."createdAt"
)
WHERE i."status" = 'COMPLETED' AND i."completedAt" IS NULL;
