-- AlterTable
ALTER TABLE "CompanyQuestion" ADD COLUMN     "checkedHash" TEXT,
ADD COLUMN     "hints" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ProblemChange" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProblemChange_questionId_createdAt_idx" ON "ProblemChange"("questionId", "createdAt");

-- CreateIndex
CREATE INDEX "CompanyQuestion_status_idx" ON "CompanyQuestion"("status");

-- AddForeignKey
ALTER TABLE "ProblemChange" ADD CONSTRAINT "ProblemChange_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "CompanyQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

