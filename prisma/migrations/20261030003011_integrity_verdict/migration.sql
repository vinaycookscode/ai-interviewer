-- CreateEnum
CREATE TYPE "IntegrityVerdict" AS ENUM ('NO_CONCERNS', 'WORTH_A_LOOK', 'STRONG_CONCERNS');

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "integrityComputedAt" TIMESTAMP(3),
ADD COLUMN     "integrityReasons" JSONB,
ADD COLUMN     "integrityRulesVersion" INTEGER,
ADD COLUMN     "integrityVerdict" "IntegrityVerdict",
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Interview_jobId_integrityVerdict_idx" ON "Interview"("jobId", "integrityVerdict");

-- CreateIndex
CREATE INDEX "ProctoringEvent_interviewId_timestamp_idx" ON "ProctoringEvent"("interviewId", "timestamp");
