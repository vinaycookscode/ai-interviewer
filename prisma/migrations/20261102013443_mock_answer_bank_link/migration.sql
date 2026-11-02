-- AlterTable
ALTER TABLE "MockAnswer" ADD COLUMN     "companyQuestionId" TEXT;

-- AlterTable
ALTER TABLE "MockInterview" ADD COLUMN     "bankQuestionIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AddForeignKey
ALTER TABLE "MockAnswer" ADD CONSTRAINT "MockAnswer_companyQuestionId_fkey" FOREIGN KEY ("companyQuestionId") REFERENCES "CompanyQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
