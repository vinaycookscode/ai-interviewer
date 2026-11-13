-- CreateEnum
CREATE TYPE "OutboundStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'FAILED', 'BOUNCED');

-- CreateTable
CREATE TABLE "OutboundEmail" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "driveId" TEXT,
    "driveCandidateId" TEXT,
    "interviewId" TEXT,
    "dedupeKey" TEXT,
    "status" "OutboundStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sendAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboundEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutboundEmail_dedupeKey_key" ON "OutboundEmail"("dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "OutboundEmail_providerId_key" ON "OutboundEmail"("providerId");

-- CreateIndex
CREATE INDEX "OutboundEmail_status_sendAfter_idx" ON "OutboundEmail"("status", "sendAfter");

-- CreateIndex
CREATE INDEX "OutboundEmail_driveId_status_idx" ON "OutboundEmail"("driveId", "status");

-- CreateIndex
CREATE INDEX "OutboundEmail_driveCandidateId_idx" ON "OutboundEmail"("driveCandidateId");
