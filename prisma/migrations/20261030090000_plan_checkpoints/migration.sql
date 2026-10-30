-- AlterTable
ALTER TABLE "MockInterview" ADD COLUMN     "checkpointDay" INTEGER,
ADD COLUMN     "enrollmentId" TEXT,
ADD COLUMN     "topics" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "PlacementProgram" ADD COLUMN     "track" TEXT NOT NULL DEFAULT 'general';

-- CreateIndex
CREATE UNIQUE INDEX "MockInterview_enrollmentId_checkpointDay_key" ON "MockInterview"("enrollmentId", "checkpointDay");

-- AddForeignKey
ALTER TABLE "MockInterview" ADD CONSTRAINT "MockInterview_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- The existing 90-day bootcamp is the data structures plan: built for the SDE track
UPDATE "PlacementProgram" SET "track" = 'sde' WHERE "slug" = '90-day-placement-bootcamp';
