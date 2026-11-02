-- CreateEnum
CREATE TYPE "IntegrityReviewOutcome" AS ENUM ('NO_ISSUE', 'CONFIRMED');

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "integrityReviewOutcome" "IntegrityReviewOutcome";

-- CreateTable
CREATE TABLE "IntegrityReview" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "outcome" "IntegrityReviewOutcome" NOT NULL,
    "note" TEXT,
    "verdict" "IntegrityVerdict" NOT NULL,
    "reasonCodes" TEXT[],
    "byUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrityReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IntegrityReview_interviewId_createdAt_idx" ON "IntegrityReview"("interviewId", "createdAt");

-- AddForeignKey
ALTER TABLE "IntegrityReview" ADD CONSTRAINT "IntegrityReview_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrityReview" ADD CONSTRAINT "IntegrityReview_byUserId_fkey" FOREIGN KEY ("byUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
