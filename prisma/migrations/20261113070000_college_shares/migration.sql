-- CreateTable
CREATE TABLE "CollegeShare" (
    "id" TEXT NOT NULL,
    "driveCollegeId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "showShortlisted" BOOLEAN NOT NULL DEFAULT false,
    "sentTo" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastOpenedAt" TIMESTAMP(3),
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollegeShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollegeShare_tokenHash_key" ON "CollegeShare"("tokenHash");

-- CreateIndex
CREATE INDEX "CollegeShare_driveCollegeId_idx" ON "CollegeShare"("driveCollegeId");

-- AddForeignKey
ALTER TABLE "CollegeShare" ADD CONSTRAINT "CollegeShare_driveCollegeId_fkey" FOREIGN KEY ("driveCollegeId") REFERENCES "DriveCollege"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeShare" ADD CONSTRAINT "CollegeShare_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

