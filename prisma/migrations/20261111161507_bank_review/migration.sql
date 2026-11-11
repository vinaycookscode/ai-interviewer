-- CreateTable
CREATE TABLE "BankAttempt" (
    "id" TEXT NOT NULL,
    "bankItemId" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "feedback" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankAttempt_bankItemId_createdAt_idx" ON "BankAttempt"("bankItemId", "createdAt");

-- CreateIndex
CREATE INDEX "BankItem_userId_nextReview_idx" ON "BankItem"("userId", "nextReview");

-- AddForeignKey
ALTER TABLE "BankAttempt" ADD CONSTRAINT "BankAttempt_bankItemId_fkey" FOREIGN KEY ("bankItemId") REFERENCES "BankItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Schedule what's already been practised (AIIN-212), by the rule in lib/bank/review.ts: a scored answer of 7 or more
-- puts the question in box 2 (every 3 days), anything lower in box 1 (tomorrow), counted in IST days from the answer.
UPDATE "BankItem" b
SET "box" = CASE WHEN a."score" >= 7 THEN 2 ELSE 1 END,
    "nextReview" = ((((a."createdAt" + interval '5 hours 30 minutes')::date) + CASE WHEN a."score" >= 7 THEN 3 ELSE 1 END)::timestamp - interval '5 hours 30 minutes')
FROM "MockAnswer" a
WHERE a."id" = b."mockAnswerId" AND a."score" > 0 AND b."nextReview" IS NULL;
