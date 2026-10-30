-- CreateTable
CREATE TABLE "ActivityDay" (
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,

    CONSTRAINT "ActivityDay_pkey" PRIMARY KEY ("userId","day")
);

-- CreateTable
CREATE TABLE "DailyChallengeAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "track" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "score" INTEGER,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyChallengeAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallengeAnswer_userId_day_key" ON "DailyChallengeAnswer"("userId", "day");

-- AddForeignKey
ALTER TABLE "ActivityDay" ADD CONSTRAINT "ActivityDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeAnswer" ADD CONSTRAINT "DailyChallengeAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeAnswer" ADD CONSTRAINT "DailyChallengeAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "CompanyQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One streak for the app: carry over every day a plan task was completed (IST days)
INSERT INTO "ActivityDay" ("userId", "day")
SELECT DISTINCT e."userId", (tc."completedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date
FROM "TaskCompletion" tc
JOIN "ProgramEnrollment" e ON e."id" = tc."enrollmentId"
WHERE tc."completedAt" IS NOT NULL
ON CONFLICT DO NOTHING;
