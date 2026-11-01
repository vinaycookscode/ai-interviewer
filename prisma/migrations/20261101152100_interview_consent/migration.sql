-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "consentDeclinedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "InterviewConsent" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "noticeVersion" TEXT NOT NULL,
    "checks" TEXT[],
    "language" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "InterviewConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InterviewConsent_interviewId_noticeVersion_key" ON "InterviewConsent"("interviewId", "noticeVersion");

-- AddForeignKey
ALTER TABLE "InterviewConsent" ADD CONSTRAINT "InterviewConsent_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
