// Problems managed in /admin/problems (AIIN-107): what a problem holds, what's valid, what may be published,
// and how a change is described in the history. Pure: no database, no "@/" imports.

export const PROBLEM_TYPES = ["CODING", "APTITUDE", "HR", "GD"] as const;
export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type ProblemStatus = (typeof STATUSES)[number];

export const LIMITS = { title: 200, statement: 20000, code: 20000, answer: 5000, tests: 50, testField: 2000, hints: 3, hint: 300, tags: 10, tag: 40 };

/** Until code runs on the server for every language (AIIN-105), problems are checked in JavaScript. */
export const CHECK_LANGUAGE = "javascript";

export interface ProblemTest {
    input: string;
    expected: string;
    hidden: boolean;
}

export interface ProblemDraft {
    title: string;
    statement: string;
    kitId: string;
    type: string;
    difficulty: string;
    tags: string[];
    roles: string[];
    starterCode: string;
    solutionCode: string;
    answer: string;
    tests: ProblemTest[];
    hints: string[];
}

const clean = (list: string[], limit: number, length: number) =>
    [...new Set(list.map((s) => s.trim()).filter(Boolean))].slice(0, limit).map((s) => s.slice(0, length));

/** Trims and bounds a draft from the form: the server never trusts the client's shape. */
export function normalizeDraft(raw: Partial<ProblemDraft>): ProblemDraft {
    const text = (v: unknown) => (typeof v === "string" ? v : "");
    const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
    return {
        title: text(raw.title).trim(),
        statement: text(raw.statement).trim(),
        kitId: text(raw.kitId),
        type: text(raw.type),
        difficulty: text(raw.difficulty),
        tags: clean(list(raw.tags), LIMITS.tags, LIMITS.tag),
        roles: clean(list(raw.roles), LIMITS.tags, 80),
        starterCode: text(raw.starterCode),
        solutionCode: text(raw.solutionCode),
        answer: text(raw.answer).trim(),
        tests: (Array.isArray(raw.tests) ? raw.tests : [])
            .filter((t): t is ProblemTest => !!t && typeof t === "object")
            .map((t) => ({ input: text(t.input).trim(), expected: text(t.expected).trim(), hidden: t.hidden === true }))
            .filter((t) => t.input || t.expected),
        hints: list(raw.hints).map((h) => h.trim()).filter(Boolean),
    };
}

export type DraftError =
    | "title" | "titleLong" | "statementLong" | "kit" | "type" | "difficulty" | "codeLong" | "answerLong"
    | "tooManyTests" | "testLong" | "testIncomplete" | "tooManyHints" | "hintLong";

/** What stops a draft from being saved at all. A draft needn't pass its tests. */
export function draftErrors(d: ProblemDraft): DraftError[] {
    const errors: DraftError[] = [];
    if (!d.title) errors.push("title");
    if (d.title.length > LIMITS.title) errors.push("titleLong");
    if (d.statement.length > LIMITS.statement) errors.push("statementLong");
    if (!d.kitId) errors.push("kit");
    if (!(PROBLEM_TYPES as readonly string[]).includes(d.type)) errors.push("type");
    if (!(DIFFICULTIES as readonly string[]).includes(d.difficulty)) errors.push("difficulty");
    if (d.starterCode.length > LIMITS.code || d.solutionCode.length > LIMITS.code) errors.push("codeLong");
    if (d.answer.length > LIMITS.answer) errors.push("answerLong");
    if (d.tests.length > LIMITS.tests) errors.push("tooManyTests");
    if (d.tests.some((t) => t.input.length > LIMITS.testField || t.expected.length > LIMITS.testField)) errors.push("testLong");
    if (d.tests.some((t) => !t.input || !t.expected)) errors.push("testIncomplete");
    if (d.hints.length > LIMITS.hints) errors.push("tooManyHints");
    if (d.hints.some((h) => h.length > LIMITS.hint)) errors.push("hintLong");
    return errors;
}

export type PublishBlock = "noSolution" | "noTests" | "unchecked";

/** Why a valid draft can't be published yet. Coding problems need a solution that passed every test as they are now. */
export function publishBlocks(d: ProblemDraft, checkedHash: string | null, currentHash: string): PublishBlock[] {
    if (d.type !== "CODING") return [];
    const blocks: PublishBlock[] = [];
    if (!d.solutionCode.trim()) blocks.push("noSolution");
    if (!d.tests.length) blocks.push("noTests");
    if (!blocks.length && checkedHash !== currentHash) blocks.push("unchecked");
    return blocks;
}

/** The part of a problem the check covers: change any of it and it must be checked again. */
export const checkedContent = (d: Pick<ProblemDraft, "solutionCode" | "tests">) =>
    JSON.stringify({ language: CHECK_LANGUAGE, solution: d.solutionCode, tests: d.tests.map((t) => [t.input, t.expected]) });

export function testCounts(tests: { hidden?: boolean }[]) {
    const hidden = tests.filter((t) => t.hidden).length;
    return { visible: tests.length - hidden, hidden };
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const sentence = (parts: string[]) => (parts.length <= 1 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`);

/** One line for the history: what a save changed, e.g. "added 2 hidden tests and edited the statement". */
export function describeChanges(before: ProblemDraft, after: ProblemDraft, names: { kit: (id: string) => string } = { kit: (id) => id }): string | null {
    const parts: string[] = [];
    if (before.title !== after.title) parts.push("renamed it");
    if (before.statement !== after.statement) parts.push("edited the statement");
    if (before.kitId !== after.kitId) parts.push(`moved it to ${names.kit(after.kitId)}`);
    if (before.type !== after.type) parts.push(`made it ${after.type.toLowerCase()}`);
    if (before.difficulty !== after.difficulty) parts.push(`set the difficulty to ${after.difficulty.toLowerCase()}`);
    if (!same(before.tags, after.tags) || !same(before.roles, after.roles)) parts.push("changed the tags or roles");
    if (before.starterCode !== after.starterCode) parts.push("edited the starter code");
    if (before.solutionCode !== after.solutionCode) parts.push("edited the solution");
    if (before.answer !== after.answer) parts.push("edited the model answer");

    const key = (t: ProblemTest) => `${t.input}\u0000${t.expected}\u0000${t.hidden}`;
    const was = before.tests.map(key);
    const now = after.tests.map(key);
    const added = after.tests.filter((t) => !was.includes(key(t)));
    const removed = before.tests.filter((t) => !now.includes(key(t)));
    if (added.length) {
        const { visible, hidden } = testCounts(added);
        parts.push(`added ${sentence([visible ? plural(visible, "visible test") : "", hidden ? plural(hidden, "hidden test") : ""].filter(Boolean))}`);
    }
    if (removed.length) parts.push(`removed ${plural(removed.length, "test")}`);
    if (!added.length && !removed.length && !same(was, now)) parts.push("reordered the tests");

    if (!same(before.hints, after.hints)) {
        parts.push(after.hints.length > before.hints.length ? `added hint ${after.hints.length}` : after.hints.length < before.hints.length ? "removed a hint" : "edited the hints");
    }
    return parts.length ? sentence(parts) : null;
}
