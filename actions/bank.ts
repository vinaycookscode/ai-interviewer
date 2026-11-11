"use server";

import { PlanTier } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { bankKey, bankType } from "@/lib/bank/items";

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

/** Remove an item from the candidate's own bank. The answers it came from are kept (AIIN-209 AC3). */
export async function deleteBankItem(itemId: string): Promise<{ ok: boolean }> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || typeof itemId !== "string") return { ok: false };
    const { count } = await db.bankItem.deleteMany({ where: { id: itemId, userId } });
    return { ok: count === 1 };
}
