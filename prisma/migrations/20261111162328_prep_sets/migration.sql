-- CreateTable
CREATE TABLE "PrepSet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrepSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrepSetItem" (
    "id" TEXT NOT NULL,
    "prepSetId" TEXT NOT NULL,
    "bankItemId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "aiSuggested" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,

    CONSTRAINT "PrepSetItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrepSet_userId_interviewId_key" ON "PrepSet"("userId", "interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "PrepSetItem_prepSetId_bankItemId_key" ON "PrepSetItem"("prepSetId", "bankItemId");

-- AddForeignKey
ALTER TABLE "PrepSet" ADD CONSTRAINT "PrepSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepSet" ADD CONSTRAINT "PrepSet_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepSetItem" ADD CONSTRAINT "PrepSetItem_prepSetId_fkey" FOREIGN KEY ("prepSetId") REFERENCES "PrepSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepSetItem" ADD CONSTRAINT "PrepSetItem_bankItemId_fkey" FOREIGN KEY ("bankItemId") REFERENCES "BankItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
