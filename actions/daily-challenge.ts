"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { dayDate, istDay } from "@/lib/daily-challenge/logic";
import { ANSWER_LIMIT, gradeChallenge, recordActivity, todaysQuestion } from "@/lib/daily-challenge/server";

/**
 * Saves the signed-in candidate's answer to today's challenge, counts the day for the streak, then asks U to
 * grade it. One answer a day: a second one is refused (AIIN-99).
 */
export async function submitDailyChallenge(answer: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || session.user.role !== "CANDIDATE") return { error: "unauthorized" as const };

    const text = answer.trim();
    if (text.length < 2) return { error: "empty" as const };
    if (text.length > ANSWER_LIMIT) return { error: "tooLong" as const };

    const now = new Date();
    const question = await todaysQuestion(userId, now);
    if (!question) return { error: "noQuestion" as const };

    let created;
    try {
        created = await db.dailyChallengeAnswer.create({
            data: { userId, day: dayDate(istDay(now)), track: question.track, questionId: question.id, answer: text },
            select: { id: true },
        });
    } catch {
        return { error: "alreadyAnswered" as const };
    }
    // The streak counts as soon as the answer is saved, even if grading has to wait
    await recordActivity(userId, now);
    await gradeChallenge(created.id);

    revalidatePath("/candidate/challenge");
    revalidatePath("/candidate/dashboard");
    return { success: true as const };
}
