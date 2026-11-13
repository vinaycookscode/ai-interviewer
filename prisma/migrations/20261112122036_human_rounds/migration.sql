-- CreateEnum
CREATE TYPE "RoundOutcome" AS ENUM ('PASSED', 'FAILED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "HumanRound" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "roundName" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 45,
    "interviewer" TEXT,
    "meetingLink" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "outcome" "RoundOutcome",
    "cancelledAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HumanRound_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HumanRound_applicationId_startsAt_idx" ON "HumanRound"("applicationId", "startsAt");

-- AddForeignKey
ALTER TABLE "HumanRound" ADD CONSTRAINT "HumanRound_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
