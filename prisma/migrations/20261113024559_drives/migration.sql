-- CreateEnum
CREATE TYPE "DriveStage" AS ENUM ('INVITED', 'OPENED', 'APTITUDE_STARTED', 'APTITUDE_PASSED', 'APTITUDE_FAILED', 'INTERVIEW_STARTED', 'INTERVIEW_FINISHED');

-- CreateEnum
CREATE TYPE "DriveSource" AS ENUM ('CSV', 'OPEN_LINK', 'MANUAL');

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "driveId" TEXT;

-- CreateTable
CREATE TABLE "Drive" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "draft" BOOLEAN NOT NULL DEFAULT true,
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "interviewCutoff" DOUBLE PRECISION,
    "autoShortlist" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Drive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveCollege" (
    "id" TEXT NOT NULL,
    "driveId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "placementOfficerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriveCollege_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveCandidate" (
    "id" TEXT NOT NULL,
    "driveId" TEXT NOT NULL,
    "driveCollegeId" TEXT,
    "userId" TEXT NOT NULL,
    "interviewId" TEXT,
    "stage" "DriveStage" NOT NULL DEFAULT 'INVITED',
    "rollNumber" TEXT,
    "source" "DriveSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriveCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Drive_employerId_idx" ON "Drive"("employerId");

-- CreateIndex
CREATE INDEX "Drive_jobId_idx" ON "Drive"("jobId");

-- CreateIndex
CREATE INDEX "DriveCollege_driveId_idx" ON "DriveCollege"("driveId");

-- CreateIndex
CREATE UNIQUE INDEX "DriveCandidate_interviewId_key" ON "DriveCandidate"("interviewId");

-- CreateIndex
CREATE INDEX "DriveCandidate_driveId_stage_idx" ON "DriveCandidate"("driveId", "stage");

-- CreateIndex
CREATE INDEX "DriveCandidate_driveCollegeId_idx" ON "DriveCandidate"("driveCollegeId");

-- CreateIndex
CREATE UNIQUE INDEX "DriveCandidate_driveId_userId_key" ON "DriveCandidate"("driveId", "userId");

-- CreateIndex
CREATE INDEX "Interview_driveId_idx" ON "Interview"("driveId");

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "Drive"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drive" ADD CONSTRAINT "Drive_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveCollege" ADD CONSTRAINT "DriveCollege_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "Drive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveCandidate" ADD CONSTRAINT "DriveCandidate_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "Drive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveCandidate" ADD CONSTRAINT "DriveCandidate_driveCollegeId_fkey" FOREIGN KEY ("driveCollegeId") REFERENCES "DriveCollege"("id") ON DELETE SET NULL ON UPDATE CASCADE;
