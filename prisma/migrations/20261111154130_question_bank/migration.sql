-- CreateEnum
CREATE TYPE "BankSource" AS ENUM ('MOCK', 'INTERVIEW', 'COMPANY_PREP', 'SELF_ADDED', 'RECOMMENDED');

-- CreateEnum
CREATE TYPE "BankStatus" AS ENUM ('NEW', 'PRACTISING', 'CONFIDENT');

-- CreateTable
CREATE TABLE "BankItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "source" "BankSource" NOT NULL,
    "questionText" TEXT NOT NULL,
    "topic" TEXT,
    "type" TEXT NOT NULL,
    "companyName" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "BankStatus" NOT NULL DEFAULT 'NEW',
    "box" INTEGER NOT NULL DEFAULT 0,
    "nextReview" TIMESTAMP(3),
    "notes" TEXT,
    "companyQuestionId" TEXT,
    "mockAnswerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankItem_userId_status_idx" ON "BankItem"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BankItem_userId_sourceKey_key" ON "BankItem"("userId", "sourceKey");

-- AddForeignKey
ALTER TABLE "BankItem" ADD CONSTRAINT "BankItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankItem" ADD CONSTRAINT "BankItem_companyQuestionId_fkey" FOREIGN KEY ("companyQuestionId") REFERENCES "CompanyQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankItem" ADD CONSTRAINT "BankItem_mockAnswerId_fkey" FOREIGN KEY ("mockAnswerId") REFERENCES "MockAnswer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: every mock answer already given lands in its candidate's bank (AIIN-209), one item per question, linked
-- to the latest answer. Keys, types and status follow lib/bank/items.ts.
WITH answers AS (
    SELECT DISTINCT ON (mi."userId", COALESCE('cq:' || ma."companyQuestionId", 'mock:' || ma."id"))
        mi."userId",
        COALESCE('cq:' || ma."companyQuestionId", 'mock:' || ma."id") AS "sourceKey",
        ma."id" AS "mockAnswerId",
        ma."companyQuestionId",
        ma."question",
        mi."role",
        cq."type" AS "cqType",
        kit."company",
        cq."tags",
        ma."createdAt"
    FROM "MockAnswer" ma
    JOIN "MockInterview" mi ON mi."id" = ma."mockInterviewId"
    LEFT JOIN "CompanyQuestion" cq ON cq."id" = ma."companyQuestionId"
    LEFT JOIN "CompanyPrepKit" kit ON kit."id" = cq."kitId"
    ORDER BY mi."userId", COALESCE('cq:' || ma."companyQuestionId", 'mock:' || ma."id"), ma."createdAt" DESC
)
INSERT INTO "BankItem" ("id", "userId", "sourceKey", "source", "questionText", "topic", "type", "companyName", "tags", "status", "companyQuestionId", "mockAnswerId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "userId",
    "sourceKey",
    'MOCK',
    "question",
    "role",
    CASE
        WHEN upper("cqType") = 'GD' THEN 'HR'
        WHEN upper("cqType") IN ('HR', 'TECHNICAL', 'CODING', 'APTITUDE') THEN upper("cqType")
        WHEN "question" ~* '^\s*(tell me about|describe a time|describe a situation|give an example|walk me through a time|why do you|why should|why are you|where do you see|what are your (key )?strengths|what is your greatest|how do you handle|how would you handle a (conflict|disagreement)|what motivates)' THEN 'HR'
        ELSE 'TECHNICAL'
    END,
    "company",
    COALESCE("tags", ARRAY[]::TEXT[]),
    'PRACTISING',
    "companyQuestionId",
    "mockAnswerId",
    "createdAt",
    "createdAt"
FROM answers;
