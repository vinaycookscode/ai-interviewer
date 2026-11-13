-- CreateEnum
CREATE TYPE "GradingStatus" AS ENUM ('PENDING', 'GRADING', 'DONE', 'FAILED');

-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "gradeAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gradingAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gradingError" TEXT,
ADD COLUMN     "gradingStatus" "GradingStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Answer_gradingStatus_gradeAfter_idx" ON "Answer"("gradingStatus", "gradeAfter");

-- CreateIndex
CREATE INDEX "Answer_interviewId_gradingStatus_idx" ON "Answer"("interviewId", "gradingStatus");

-- Answers that already exist were graded (or skipped) the old way: they're done, so the worker never re-grades history
UPDATE "Answer" SET "gradingStatus" = 'DONE';
