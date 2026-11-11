"use server";

import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { PlanTier } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { bankKey, bankType, parseNewQuestion } from "@/lib/bank/items";
import { gradeBankAnswer, scheduleReview, writeModelAnswer } from "@/lib/bank/server";
import { istDay, startOfIstDay } from "@/lib/ist";

/**
 * Save a Company prep question to the candidate's Question Bank (AIIN-209). Same access as the company page: company
 * prep on, a paid plan, a published question. Saving twice keeps one item.
 */
export async function saveToBank(questionId: string): Promise<{ ok: true } | { error: "notFound" }> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || typeof questionId !== "string") return { error: "notFound" };

    if (!(await checkFeature(FEATURES.COMPANY_PREP))) return { error: "notFound" };
    const subscription = await db.subscription.findUnique({ where: { userId }, select: { status: true, plan: { select: { tier: true } } } });
    if (!subscription || subscription.status !== "ACTIVE" || subscription.plan.tier === PlanTier.FREE) return { error: "notFound" };

    const question = await db.companyQuestion.findFirst({
        where: { id: questionId, status: "PUBLISHED" },
        select: { id: true, question: true, type: true, tags: true, kit: { select: { company: true } } },
    });
    if (!question) return { error: "notFound" };

    const sourceKey = bankKey({ companyQuestionId: question.id });
    await db.bankItem.upsert({
        where: { userId_sourceKey: { userId, sourceKey } },
        create: {
            userId,
            sourceKey,
            source: "COMPANY_PREP",
            questionText: question.question,
            type: bankType(question.type, question.question),
            companyName: question.kit.company,
            tags: question.tags,
            companyQuestionId: question.id,
        },
        update: {},
    });
    return { ok: true };
}

/**
 * Add a question the candidate was asked in a real interview (AIIN-211). It stays in their bank only. A model answer,
 * if asked for, is written after the response so adding never waits on Gemini.
 */
export async function addToBank(input: unknown): Promise<{ ok: true; id: string } | { error: "unauthorized" | "question" | "company" | "type" | "notes" }> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { error: "unauthorized" };

    const parsed = parseNewQuestion(input);
    if (!parsed.ok) return { error: parsed.field };
    const q = parsed.value;

    const item = await db.bankItem.create({
        data: {
            userId,
            sourceKey: bankKey({ selfId: randomUUID() }),
            source: "SELF_ADDED",
            questionText: q.question,
            type: q.type,
            companyName: q.company,
            notes: q.notes,
        },
        select: { id: true },
    });
    if (q.writeAnswer) after(() => writeModelAnswer(userId, item.id, q));
    revalidatePath("/candidate/question-bank");
    return { ok: true, id: item.id };
}

/** The candidate's notes on one of their own bank items (AIIN-210); up to 2,000 characters. */
export async function saveBankNotes(itemId: string, notes: string): Promise<{ ok: boolean }> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || typeof itemId !== "string" || typeof notes !== "string" || notes.length > 2000) return { ok: false };
    const { count } = await db.bankItem.updateMany({ where: { id: itemId, userId }, data: { notes: notes.trim() || null } });
    return { ok: count === 1 };
}

/** Remove an item from the candidate's own bank. The answers it came from are kept (AIIN-209 AC3). */
export async function deleteBankItem(itemId: string): Promise<{ ok: boolean }> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || typeof itemId !== "string") return { ok: false };
    const { count } = await db.bankItem.deleteMany({ where: { id: itemId, userId } });
    return { ok: count === 1 };
}

/** Bank answers a candidate may have graded in one IST day: enough to review everything due, not a free Gemini tap. */
const DAILY_ATTEMPTS = 30;

export type PractiseResult =
    | { ok: true; score: number; feedback: string; previous: number | null; inDays: number; status: "PRACTISING" | "CONFIDENT"; againstReference: boolean }
    | { error: "notFound" | "empty" | "limit" | "unavailable" };

/**
 * Answer a question from the candidate's own bank (AIIN-212): graded by Gemini against the strong answer when there
 * is one, kept as a BankAttempt, and the question moved to its next box. Nothing is saved if grading fails.
 */
export async function practiseBankItem(itemId: string, transcript: string): Promise<PractiseResult> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || typeof itemId !== "string") return { error: "notFound" };
    const answer = typeof transcript === "string" ? transcript.trim().slice(0, 5000) : "";
    if (!answer) return { error: "empty" };

    const item = await db.bankItem.findFirst({
        where: { id: itemId, userId },
        select: {
            id: true,
            box: true,
            questionText: true,
            topic: true,
            aiAnswer: true,
            companyQuestion: { select: { answer: true, tips: true } },
            mockAnswer: { select: { score: true, createdAt: true } },
            attempts: { orderBy: { createdAt: "desc" }, take: 1, select: { score: true, createdAt: true } },
        },
    });
    if (!item) return { error: "notFound" };

    const today = await db.bankAttempt.count({ where: { bankItem: { userId }, createdAt: { gte: startOfIstDay(istDay(new Date())) } } });
    if (today >= DAILY_ATTEMPTS) return { error: "limit" };

    const reference = item.companyQuestion?.answer || item.aiAnswer ? { answer: item.companyQuestion?.answer ?? item.aiAnswer, tips: item.companyQuestion?.tips ?? null } : null;
    const grade = await gradeBankAnswer(item.questionText, answer, item.topic ?? "an entry-level", reference);
    if (!grade) return { error: "unavailable" };

    // The score to beat: the latest answer before this one, from the bank or from practice
    const earlier = [item.attempts[0], item.mockAnswer].filter((a): a is { score: number | null; createdAt: Date } => !!a && a.score != null);
    const previous = earlier.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.score ?? null;

    await db.bankAttempt.create({ data: { bankItemId: item.id, transcript: answer, score: grade.score, feedback: grade.feedback } });
    const next = await scheduleReview(item, grade.score);
    revalidatePath("/candidate/question-bank");
    return { ok: true, score: grade.score, feedback: grade.feedback, previous, inDays: next.inDays, status: next.status, againstReference: !!reference };
}
