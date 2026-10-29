-- CreateEnum
CREATE TYPE "HiringDecision" AS ENUM ('UNDECIDED', 'SHORTLISTED', 'ON_HOLD', 'REJECTED');

-- CreateEnum
CREATE TYPE "DecisionSource" AS ENUM ('MANUAL', 'BULK', 'AUTO_CUTOFF');

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "decision" "HiringDecision" NOT NULL DEFAULT 'UNDECIDED',
ADD COLUMN     "decisionAt" TIMESTAMP(3),
ADD COLUMN     "decisionById" TEXT;

-- CreateTable
CREATE TABLE "InterviewDecisionEvent" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "from" "HiringDecision" NOT NULL,
    "to" "HiringDecision" NOT NULL,
    "note" TEXT,
    "byUserId" TEXT,
    "source" "DecisionSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewDecisionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewDecisionEvent_interviewId_idx" ON "InterviewDecisionEvent"("interviewId");

-- AddForeignKey
ALTER TABLE "InterviewDecisionEvent" ADD CONSTRAINT "InterviewDecisionEvent_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewDecisionEvent" ADD CONSTRAINT "InterviewDecisionEvent_byUserId_fkey" FOREIGN KEY ("byUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
