-- CreateEnum
CREATE TYPE "ApplicationStage" AS ENUM ('INVITED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN', 'DECLINED');

-- CreateEnum
CREATE TYPE "ApplicationSource" AS ENUM ('INVITED', 'DIRECT');

-- DropIndex
DROP INDEX "CandidateProfile_embedding_idx";

-- DropIndex
DROP INDEX "Job_embedding_idx";

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "source" "ApplicationSource" NOT NULL DEFAULT 'INVITED',
    "stage" "ApplicationStage" NOT NULL DEFAULT 'APPLIED',
    "stageChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "onHold" BOOLEAN NOT NULL DEFAULT false,
    "coverNote" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "actorId" TEXT,
    "fromStage" "ApplicationStage",
    "toStage" "ApplicationStage",
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Application_employerId_stage_idx" ON "Application"("employerId", "stage");

-- CreateIndex
CREATE INDEX "Application_jobId_stage_idx" ON "Application"("jobId", "stage");

-- CreateIndex
CREATE INDEX "Application_candidateId_idx" ON "Application"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_jobId_candidateId_key" ON "Application"("jobId", "candidateId");

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_createdAt_idx" ON "ApplicationEvent"("applicationId", "createdAt");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- One application for every job and candidate that already has an AI interview (AIIN-195), so existing jobs show a
-- full pipeline. The stage follows the latest interview's decision; the job's employer owns it.
INSERT INTO "Application" ("id", "jobId", "candidateId", "employerId", "source", "stage", "stageChangedAt", "onHold", "createdAt", "updatedAt")
SELECT
    'app_' || md5(i."jobId" || ':' || i."candidateId"),
    i."jobId",
    i."candidateId",
    j."employerId",
    'INVITED',
    CASE i."decision" WHEN 'REJECTED' THEN 'REJECTED'::"ApplicationStage" WHEN 'SHORTLISTED' THEN 'SCREENING'::"ApplicationStage" ELSE 'APPLIED'::"ApplicationStage" END,
    COALESCE(i."decisionAt", i."createdAt"),
    i."decision" = 'ON_HOLD',
    i."createdAt",
    CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT ON ("jobId", "candidateId") "jobId", "candidateId", "decision", "decisionAt", "createdAt"
    FROM "Interview"
    ORDER BY "jobId", "candidateId", "createdAt" DESC
) i
JOIN "Job" j ON j."id" = i."jobId"
ON CONFLICT ("jobId", "candidateId") DO NOTHING;
