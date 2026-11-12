-- AlterTable
ALTER TABLE "CandidateProfile" ADD COLUMN     "city" TEXT,
ADD COLUMN     "factsConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "noticePeriodDays" INTEGER,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "proposedFacts" JSONB,
ADD COLUMN     "resumeFacts" JSONB,
ADD COLUMN     "resumeReadAt" TIMESTAMP(3),
ADD COLUMN     "resumeText" TEXT,
ADD COLUMN     "totalYears" DOUBLE PRECISION;
