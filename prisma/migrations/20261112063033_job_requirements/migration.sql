-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'OPEN', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "location" TEXT,
ADD COLUMN     "maxNoticeDays" INTEGER,
ADD COLUMN     "maxYears" INTEGER,
ADD COLUMN     "minYears" INTEGER,
ADD COLUMN     "mustHaveSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "niceToHaveSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "requirementsConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "salaryMax" INTEGER,
ADD COLUMN     "salaryMin" INTEGER,
ADD COLUMN     "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "workMode" "WorkMode";

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- Jobs that existed before Talent Match stay usable: open (closed if archived), with requirements still to add (AIIN-192)
UPDATE "Job" SET "status" = CASE WHEN "archivedAt" IS NULL THEN 'OPEN'::"JobStatus" ELSE 'CLOSED'::"JobStatus" END;
