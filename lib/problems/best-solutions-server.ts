// Generating, checking and loading a coding problem's best solutions (AIIN-221). Server only; no access checks here:
// callers check who may see them.
import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getGeminiModelInstance } from "@/lib/gemini";
import { runProblem } from "@/lib/judge/server";
import { inferSignature, starterFor } from "@/lib/judge/drivers";
import { testsOf } from "@/lib/problems/server";
import { SOLUTION_LANGUAGES, parseSolutions, solutionsPrompt, type SolutionLanguage } from "@/lib/problems/best-solutions";

export interface BestSolution {
    name: string;
    time: string;
    space: string;
    explanation: string;
    /** Only languages whose code passed every test */
    code: Partial<Record<SolutionLanguage, string>>;
}

const hashTests = (tests: { input: string; expected: string }[]) =>
    createHash("sha256").update(JSON.stringify(tests.map((t) => [t.input, t.expected]))).digest("hex");

/** Runs tasks two at a time: the code runner takes two jobs at once. */
async function inPairs<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
    const results: T[] = new Array(tasks.length);
    let next = 0;
    const worker = async () => {
        while (next < tasks.length) {
            const i = next++;
            results[i] = await tasks[i]();
        }
    };
    await Promise.all([worker(), worker()]);
    return results;
}

/** The stored solutions, if they were checked against the problem's current tests; else null. */
export async function storedSolutions(questionId: string, testCases: Prisma.JsonValue): Promise<BestSolution[] | null> {
    const rows = await db.problemSolution.findMany({
        where: { questionId, testsHash: hashTests(testsOf(testCases)) },
        orderBy: { position: "asc" },
        select: { name: true, timeComplexity: true, spaceComplexity: true, explanation: true, code: true },
    });
    if (!rows.length) return null;
    return rows.map((r) => ({ name: r.name, time: r.timeComplexity, space: r.spaceComplexity, explanation: r.explanation, code: r.code as BestSolution["code"] }));
}

/**
 * Asks Gemini for 2–3 approaches, runs each language of each against every test (hidden ones too), and stores the
 * approaches with at least one passing language, replacing older ones. `userId` only identifies who caused the runs.
 */
export async function generateSolutions(userId: string, questionId: string): Promise<BestSolution[]> {
    const q = await db.companyQuestion.findUnique({
        where: { id: questionId },
        select: { question: true, description: true, testCases: true, solutionCode: true, starterCode: true },
    });
    if (!q) return [];
    const tests = testsOf(q.testCases);
    const nameSource = q.solutionCode || q.starterCode || "";
    const signature = inferSignature(nameSource, tests);
    if (!signature || !tests.length) return [];

    const starters = Object.fromEntries(SOLUTION_LANGUAGES.map((l) => [l, starterFor(l, signature, q.starterCode)]));
    const model = await getGeminiModelInstance();
    const result = await model.generateContent(solutionsPrompt(q.question, q.description || "", starters));
    const drafts = parseSolutions(result.response.text());

    const checks = drafts.flatMap((d, di) =>
        (Object.entries(d.code) as [SolutionLanguage, string][]).map(([language, code]) => async () => {
            const run = await runProblem(userId, "check", language, code, { tests, nameSource }, { log: false });
            const passed = !("error" in run) && run.status === "ok" && run.cases.every((c) => c.status === "passed");
            return { di, language, code, passed };
        })
    );
    const outcomes = await inPairs(checks);

    const kept: BestSolution[] = drafts.flatMap((d, di) => {
        const code = Object.fromEntries(outcomes.filter((o) => o.di === di && o.passed).map((o) => [o.language, o.code]));
        return Object.keys(code).length ? [{ name: d.name, time: d.time, space: d.space, explanation: d.explanation, code }] : [];
    });

    const testsHash = hashTests(tests);
    await db.$transaction([
        db.problemSolution.deleteMany({ where: { questionId } }),
        ...kept.map((s, position) =>
            db.problemSolution.create({
                data: { questionId, position, name: s.name, timeComplexity: s.time, spaceComplexity: s.space, explanation: s.explanation, code: s.code, testsHash },
            })
        ),
    ]);
    return kept;
}
