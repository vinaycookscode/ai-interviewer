// Runs code on the judge for practice, interviews and the admin's check (AIIN-105). Server only.
// No access checks here: callers check the user may use the problem or interview first.
import { db } from "@/lib/db";
import { judge } from "@/lib/problems/run-js";
import { runOnJudge, type RunStatus } from "@/lib/judge/client";
import { buildProgram, inferSignature, newTag, readResults, runnableProgram, type CaseResult, type JudgeLanguage, type RunLanguage, type Signature } from "@/lib/judge/drivers";

export const RUNS_PER_MINUTE = 30;

type Kind = "practice" | "interview" | "check";

/** Under the limit of 30 runs a minute per person. */
export async function underRateLimit(userId: string): Promise<boolean> {
    const recent = await db.codeRun.count({ where: { userId, createdAt: { gt: new Date(Date.now() - 60_000) } } });
    return recent < RUNS_PER_MINUTE;
}

/** Language, time, status and who: never the code. */
async function logRun(userId: string, kind: Kind, language: RunLanguage, status: string, ms: number) {
    await db.codeRun.create({ data: { userId, kind, language, status, durationMs: ms } }).catch((error) => console.error("Couldn't log the run:", error));
}

export interface ProblemTests {
    tests: { input: string; expected: string; hidden: boolean }[];
    /** Where the function's name and parameter names come from: the reference solution, else the starter. */
    nameSource: string;
}

export function signatureFor(problem: ProblemTests): Signature | null {
    return inferSignature(problem.nameSource, problem.tests);
}

export interface ProblemRun {
    status: Exclude<RunStatus, "unavailable">;
    /** The compiler's or runtime's message, when the program didn't run through. */
    message: string;
    cases: (CaseResult & { hidden: boolean; expected: string })[];
    ms: number;
}

/** Runs code against every test of a problem: one program, one judge call. */
export async function runProblem(
    userId: string,
    kind: Kind,
    language: JudgeLanguage,
    code: string,
    problem: ProblemTests
): Promise<ProblemRun | { error: "unavailable" | "noTests" }> {
    const signature = signatureFor(problem);
    if (!signature || !problem.tests.length) return { error: "noTests" };
    const tag = newTag();
    const result = await runOnJudge(language, buildProgram(language, code, problem.tests, signature, tag));
    if (result.status === "unavailable") return { error: "unavailable" };

    const stopped = result.status === "timeLimit" ? "timeLimit" : result.status === "ok" ? null : "error";
    const cases = readResults(result.stdout, tag, problem.tests.map((t) => t.expected), stopped, (value, expected) => judge(value, expected).passed).map((c, i) => ({
        ...c,
        hidden: problem.tests[i].hidden,
        expected: problem.tests[i].expected,
    }));
    const status = result.status;
    await logRun(userId, kind, language, status, result.ms);
    return { status, message: status === "ok" ? "" : result.stderr, cases, ms: result.ms };
}

/** Runs an interview answer as a program and returns what it printed. */
export async function runProgram(userId: string, language: RunLanguage, code: string) {
    const result = await runOnJudge(language, runnableProgram(language, code));
    if (result.status !== "unavailable") await logRun(userId, "interview", language, result.status, result.ms);
    return result;
}
