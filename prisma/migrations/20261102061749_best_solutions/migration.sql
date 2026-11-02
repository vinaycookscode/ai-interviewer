-- CreateTable
CREATE TABLE "ProblemSolution" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "timeComplexity" TEXT NOT NULL,
    "spaceComplexity" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "code" JSONB NOT NULL,
    "testsHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemSolution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProblemSolution_questionId_position_idx" ON "ProblemSolution"("questionId", "position");

-- AddForeignKey
ALTER TABLE "ProblemSolution" ADD CONSTRAINT "ProblemSolution_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "CompanyQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
