"use server";

import { PlanTier } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { judgeConfigured } from "@/lib/judge/client";
import { generateSolutions, storedSolutions, type BestSolution } from "@/lib/problems/best-solutions-server";

type Result = { solutions: BestSolution[] } | { error: "notFound" | "locked" | "unavailable" | "none" };

// One generation per problem at a time on this server: a second candidate waits for the first's result
const inFlight = new Map<string, Promise<BestSolution[]>>();

/**
 * A coding problem's best solutions (AIIN-221), for a candidate who has submitted an attempt on it. Same access as
 * running its tests: company prep on and a paid plan. Generated and test-checked the first time, then reused.
 */
export async function getBestSolutions(questionId: string): Promise<Result> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || typeof questionId !== "string") return { error: "notFound" };

    if (!(await checkFeature(FEATURES.COMPANY_PREP))) return { error: "notFound" };
    const subscription = await db.subscription.findUnique({ where: { userId }, select: { status: true, plan: { select: { tier: true } } } });
    if (!subscription || subscription.status !== "ACTIVE" || subscription.plan.tier === PlanTier.FREE) return { error: "notFound" };
    const question = await db.companyQuestion.findFirst({
        where: { id: questionId, status: "PUBLISHED", type: "CODING" },
        select: { id: true, testCases: true },
    });
    if (!question) return { error: "notFound" };

    // Try first: hidden until they've submitted something for this problem
    const attempted = await db.userCompanySolution.findFirst({ where: { userId, questionId }, select: { id: true } });
    if (!attempted) return { error: "locked" };

    const stored = await storedSolutions(question.id, question.testCases);
    if (stored) return { solutions: stored };
    if (!judgeConfigured()) return { error: "unavailable" };

    let pending = inFlight.get(question.id);
    if (!pending) {
        pending = generateSolutions(userId, question.id).finally(() => inFlight.delete(question.id));
        inFlight.set(question.id, pending);
    }
    try {
        const solutions = await pending;
        return solutions.length ? { solutions } : { error: "none" };
    } catch (error) {
        console.error("Couldn't generate best solutions:", error);
        return { error: "unavailable" };
    }
}
