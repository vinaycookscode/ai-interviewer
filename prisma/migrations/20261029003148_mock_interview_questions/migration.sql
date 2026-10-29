-- AlterTable
ALTER TABLE "MockInterview" ADD COLUMN     "questions" TEXT[] DEFAULT ARRAY[]::TEXT[];
