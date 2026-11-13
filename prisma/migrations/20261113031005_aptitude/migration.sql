-- AlterTable
ALTER TABLE "Drive" ADD COLUMN     "aptitudeCutoff" INTEGER,
ADD COLUMN     "aptitudeEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aptitudeTestId" TEXT;

-- CreateTable
CREATE TABLE "AptitudeTest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "ownerId" TEXT,
    "shuffle" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AptitudeTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AptitudeSection" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "askCount" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AptitudeSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AptitudeQuestion" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "options" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "retiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AptitudeQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AptitudeAttempt" (
    "id" TEXT NOT NULL,
    "driveCandidateId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "questionIds" TEXT[],
    "optionOrders" JSONB NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "score" INTEGER,
    "total" INTEGER,
    "percent" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "tabSwitches" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AptitudeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AptitudeTest_ownerId_idx" ON "AptitudeTest"("ownerId");

-- CreateIndex
CREATE INDEX "AptitudeSection_testId_idx" ON "AptitudeSection"("testId");

-- CreateIndex
CREATE INDEX "AptitudeQuestion_testId_sectionId_idx" ON "AptitudeQuestion"("testId", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "AptitudeAttempt_driveCandidateId_key" ON "AptitudeAttempt"("driveCandidateId");

-- CreateIndex
CREATE INDEX "AptitudeAttempt_testId_idx" ON "AptitudeAttempt"("testId");

-- CreateIndex
CREATE INDEX "AptitudeAttempt_deadline_idx" ON "AptitudeAttempt"("deadline");

-- AddForeignKey
ALTER TABLE "Drive" ADD CONSTRAINT "Drive_aptitudeTestId_fkey" FOREIGN KEY ("aptitudeTestId") REFERENCES "AptitudeTest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AptitudeSection" ADD CONSTRAINT "AptitudeSection_testId_fkey" FOREIGN KEY ("testId") REFERENCES "AptitudeTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AptitudeQuestion" ADD CONSTRAINT "AptitudeQuestion_testId_fkey" FOREIGN KEY ("testId") REFERENCES "AptitudeTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AptitudeQuestion" ADD CONSTRAINT "AptitudeQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "AptitudeSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AptitudeAttempt" ADD CONSTRAINT "AptitudeAttempt_driveCandidateId_fkey" FOREIGN KEY ("driveCandidateId") REFERENCES "DriveCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AptitudeAttempt" ADD CONSTRAINT "AptitudeAttempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "AptitudeTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
