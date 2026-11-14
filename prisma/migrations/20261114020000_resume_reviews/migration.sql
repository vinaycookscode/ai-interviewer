-- CreateTable
CREATE TABLE "ResumeReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "label" TEXT,
    "jobDescription" TEXT,
    "resumeText" TEXT NOT NULL,
    "analysis" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResumeReview_userId_createdAt_idx" ON "ResumeReview"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ResumeReview_createdAt_idx" ON "ResumeReview"("createdAt");

-- AddForeignKey
ALTER TABLE "ResumeReview" ADD CONSTRAINT "ResumeReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

