"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PlanTier } from "@prisma/client";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { isJudgeLanguage, isRunLanguage } from "@/lib/judge/drivers";
import { runProblem, runProgram, underRateLimit } from "@/lib/judge/server";
import { testsOf } from "@/lib/problems/server";

// Code runs only on the judge (AIIN-105). Server Actions are public endpoints, so each checks who's asking first.

const CODE_LIMIT = 50_000;

/**
 * Runs the signed-in candidate's answer in their own interview, while it's in progress, and returns what it printed.
 * Replaces the old unauthenticated call to the public Piston service.
 */
export async function runInterviewCode(interviewId: string, language: string, code: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { error: "unauthorized" as const };
    const interview = await db.interview.findFirst({ where: { id: interviewId, candidateId: userId, status: "IN_PROGRESS" }, select: { id: true } });
    if (!interview) return { error: "notFound" as const };
    if (!isRunLanguage(language)) return { error: "language" as const };
    if (!code.trim() || code.length > CODE_LIMIT) return { error: "size" as const };
    if (!(await underRateLimit(userId))) return { error: "rateLimited" as const };

    const result = await runProgram(userId, language, code);
    if (result.status === "unavailable") return { error: "unavailable" as const };
    return { status: result.status, stdout: result.stdout, stderr: result.stderr, ms: result.ms };
}

/**
 * Runs a candidate's code against a published coding problem's tests. Hidden tests come back as passed or not, never
 * with their input, expected output or what the code gave.
 */
export async function runProblemTests(questionId: string, language: string, code: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { error: "unauthorized" as const };
    if (!isJudgeLanguage(language)) return { error: "language" as const };
    if (!code.trim() || code.length > CODE_LIMIT) return { error: "size" as const };

    // Same access as the company prep pages: the feature on, and a paid plan
    if (!(await checkFeature(FEATURES.COMPANY_PREP))) return { error: "notFound" as const };
    const subscription = await db.subscription.findUnique({ where: { userId }, select: { status: true, plan: { select: { tier: true } } } });
    if (!subscription || subscription.status !== "ACTIVE" || subscription.plan.tier === PlanTier.FREE) return { error: "notFound" as const };
    const question = await db.companyQuestion.findFirst({
        where: { id: questionId, status: "PUBLISHED", type: "CODING" },
        select: { testCases: true, solutionCode: true, starterCode: true },
    });
    if (!question) return { error: "notFound" as const };
    if (!(await underRateLimit(userId))) return { error: "rateLimited" as const };

    const run = await runProblem(userId, "practice", language, code, {
        tests: testsOf(question.testCases),
        nameSource: question.solutionCode || question.starterCode || "",
    });
    if ("error" in run) return { error: run.error };
    return {
        status: run.status,
        message: run.message,
        ms: run.ms,
        cases: run.cases.map((c) => (c.hidden ? { n: c.n, status: c.status, hidden: true as const } : { n: c.n, status: c.status, hidden: false as const, expected: c.expected, output: c.output })),
    };
}
