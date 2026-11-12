-- AlterTable
ALTER TABLE "CandidateProfile" ADD COLUMN     "discoverable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "discoverableSince" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CandidateBlock" (
    "candidateId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateBlock_pkey" PRIMARY KEY ("candidateId","employerId")
);

-- CreateIndex
CREATE INDEX "CandidateBlock_employerId_idx" ON "CandidateBlock"("employerId");

-- AddForeignKey
ALTER TABLE "CandidateBlock" ADD CONSTRAINT "CandidateBlock_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateBlock" ADD CONSTRAINT "CandidateBlock_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
