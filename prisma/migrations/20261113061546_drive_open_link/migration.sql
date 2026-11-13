-- AlterTable
ALTER TABLE "Drive" ADD COLUMN     "allowedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "joinCap" INTEGER,
ADD COLUMN     "openLinkOn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "openLinkSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Drive_openLinkSlug_key" ON "Drive"("openLinkSlug");

