// Runs "Check solution" and maps stored problems to drafts (AIIN-107). Admin only: callers check the role.
import { createHash } from "node:crypto";
import vm from "node:vm";
import { checkedContent, normalizeDraft, type ProblemDraft, type ProblemTest } from "@/lib/problems/rules";
import { asError, callSource, judge, parseInput, type TestRun } from "@/lib/problems/run-js";
import { judgeConfigured } from "@/lib/judge/client";
import { isJudgeLanguage } from "@/lib/judge/drivers";
import { runProblem } from "@/lib/judge/server";

export const contentHash = (d: Pick<ProblemDraft, "solutionCode" | "tests" | "language">) => createHash("sha256").update(checkedContent(d)).digest("hex");

export interface CheckResult extends TestRun {
    n: number;
    hidden: boolean;
    expected: string;
}

/**
 * Runs the reference solution against every test, in a separate context with a time limit, judged like the
 * candidate's browser judges (lib/problems/run-js.ts). The code is an admin's, so the context is for time limits
 * and a clean global scope, not for isolating untrusted code. Candidate code never runs here.
 */
export function runTests(solution: string, tests: ProblemTest[]): CheckResult[] {
    const source = `(function (input) {${callSource(solution)}})(input)`;
    return tests.map((test, i) => {
        let run: TestRun;
        try {
            run = judge(vm.runInNewContext(source, { input: parseInput(test.input) }, { timeout: 1000 }), test.expected);
        } catch (error) {
            run = asError(error);
        }
        return { ...run, n: i + 1, hidden: test.hidden, expected: test.expected };
    });
}

interface StoredProblem {
    question: string;
    description: string | null;
    kitId: string;
    type: string;
    difficulty: string;
    tags: string[];
    roles: string[];
    starterCode: string | null;
    solutionCode: string | null;
    language: string | null;
    answer: string | null;
    testCases: unknown;
    hints: string[];
}

export const PROBLEM_SELECT = {
    question: true, description: true, kitId: true, type: true, difficulty: true, tags: true, roles: true,
    starterCode: true, solutionCode: true, language: true, answer: true, testCases: true, hints: true,
} as const;

/** A problem's stored tests. Seeded tests may hold JSON values: they become text. */
export function testsOf(testCases: unknown): ProblemTest[] {
    const asText = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v ?? ""));
    return Array.isArray(testCases)
        ? testCases.flatMap((t) => (t && typeof t === "object" && "input" in t && "expected" in t ? [{ input: asText(t.input), expected: asText(t.expected), hidden: (t as { hidden?: unknown }).hidden === true }] : []))
        : [];
}

/** A stored problem as the editor's draft. */
export function toDraft(row: StoredProblem): ProblemDraft {
    const tests = testsOf(row.testCases);
    return normalizeDraft({
        title: row.question, statement: row.description ?? "", kitId: row.kitId, type: row.type, difficulty: row.difficulty,
        tags: row.tags, roles: row.roles, starterCode: row.starterCode ?? "", solutionCode: row.solutionCode ?? "",
        language: row.language ?? "javascript", answer: row.answer ?? "", tests, hints: row.hints,
    });
}

/** A draft as the columns it's stored in. */
export const fromDraft = (d: ProblemDraft) => ({
    question: d.title, description: d.statement || null, kitId: d.kitId, type: d.type, difficulty: d.difficulty,
    tags: d.tags, roles: d.roles, starterCode: d.starterCode || null, solutionCode: d.solutionCode || null,
    answer: d.answer || null, testCases: d.tests.map((t) => ({ ...t })), hints: d.hints,
    language: d.type === "CODING" ? d.language : null,
});

/**
 * The admin's "Check solution": the reference solution against every test, on the judge in its own language.
 * Without the judge, JavaScript still runs here (an admin's own code, in a separate context with a time limit).
 */
export async function checkSolution(userId: string, d: ProblemDraft): Promise<CheckResult[] | { error: "judgeUnavailable" }> {
    if (judgeConfigured() && isJudgeLanguage(d.language)) {
        const run = await runProblem(userId, "check", d.language, d.solutionCode, { tests: d.tests, nameSource: d.solutionCode });
        if (!("error" in run)) {
            return run.cases.map((c) => ({
                n: c.n,
                hidden: c.hidden,
                expected: c.expected,
                passed: c.status === "passed",
                output: c.status === "timeLimit" ? "Time limit" : c.status === "notRun" ? "Not run" : (c.output ?? (run.message || "Error")),
                error: c.status === "passed" ? undefined : c.status === "error" || c.status === "timeLimit" ? (c.output ?? run.message) || c.status : undefined,
            }));
        }
    }
    if (d.language === "javascript") return runTests(d.solutionCode, d.tests);
    return { error: "judgeUnavailable" };
}
