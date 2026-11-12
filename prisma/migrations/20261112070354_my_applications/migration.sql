-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "candidateSeenAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "applicationEmails" BOOLEAN NOT NULL DEFAULT false;
