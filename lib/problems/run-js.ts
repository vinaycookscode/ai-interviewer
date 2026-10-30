// How a JavaScript solution is called with a test's input and judged against its expected output.
// Shared by the candidate's browser (company prep) and the admin's "Check solution" on the server (AIIN-107),
// so both judge the same way. Pure: no database, no "@/" imports.

export interface TestCase {
    input: unknown;
    expected: unknown;
    hidden?: boolean;
}

export interface TestRun {
    passed: boolean;
    output: string;
    error?: string;
}

/** The solution's function: the first `function name(` or `const name = (…) =>`, else `solution`. */
export function functionName(code: string): string {
    const funcMatch = code.match(/function\s+(\w+)\s*\(/);
    const arrowMatch = code.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=])\s*=>/);
    return funcMatch?.[1] || arrowMatch?.[1] || "solution";
}

interface ListNode {
    val: unknown;
    next: ListNode | null;
}

const isList = (value: unknown) => !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 1 && Array.isArray((value as { list?: unknown }).list);

/** `{"list":[1,2,3]}` is a linked list: the solution gets its head node (`{ val, next }`), or null when empty. */
function revive(value: unknown): unknown {
    if (isList(value)) return ((value as { list: unknown[] }).list).reduceRight<ListNode | null>((next, val) => ({ val, next }), null);
    return Array.isArray(value) ? value.map(revive) : value;
}

/**
 * A test's input as the function's argument: JSON, or "[2,7,11,15], 9" as { nums, target }. An array is spread
 * into arguments, so a single array argument is written wrapped: `[[1,2,3]]`.
 */
export function parseInput(input: unknown): unknown {
    if (typeof input !== "string") return input;
    try {
        if (input.includes(",") && input.includes("[") && !input.trimStart().startsWith("[[") && !input.includes("{")) {
            const parts = input.split("],");
            if (parts.length === 2) return { nums: JSON.parse(parts[0] + "]"), target: parseInt(parts[1].trim()) };
        }
        return revive(JSON.parse(input));
    } catch {
        return input;
    }
}

/** A returned linked list as the array of its values, so it compares with an expected `[5,4,3]`. */
function listValues(result: unknown, expected: unknown): unknown {
    const isNode = (v: unknown): v is ListNode => !!v && typeof v === "object" && !Array.isArray(v) && "val" in v && "next" in v;
    if (result === null && Array.isArray(expected)) return [];
    if (!isNode(result)) return result;
    const values: unknown[] = [];
    // A cycle never ends: stop at a length no test uses
    for (let node: ListNode | null = result; node && values.length < 10_000; node = node.next) values.push(node.val);
    return values;
}

/** The body of a function of `input` that defines the solution and calls it. */
export function callSource(code: string): string {
    const name = functionName(code);
    return `
        ${code}

        if (typeof ${name} === 'function') {
            if (typeof input === 'object' && input !== null) {
                if (input.nums && input.target !== undefined) {
                    return ${name}(input.nums, input.target);
                } else if (Array.isArray(input)) {
                    return ${name}(...input);
                }
                return ${name}(input);
            }
            return ${name}(input);
        }
        throw new Error('Function ${name} not defined');
    `;
}

/** The result against the expected output, compared as JSON. */
export function judge(raw: unknown, expected: unknown): TestRun {
    let parsedExpected = expected;
    if (typeof expected === "string") {
        try {
            parsedExpected = JSON.parse(expected);
        } catch {
            // Plain text
        }
    }
    const result = listValues(raw, parsedExpected);
    const resultStr = JSON.stringify(result);
    let expectedStr: string;
    if (typeof expected === "string") {
        try {
            expectedStr = JSON.stringify(JSON.parse(expected));
        } catch {
            expectedStr = expected;
        }
    } else {
        expectedStr = JSON.stringify(expected);
    }
    const passed =
        resultStr === expectedStr ||
        (Array.isArray(result) && Array.isArray(expected) && result.length === expected.length && result.every((v: unknown, i: number) => v === expected[i]));
    return { passed, output: resultStr || "undefined", error: passed ? undefined : `Expected ${expectedStr}, got ${resultStr}` };
}

export const asError = (err: unknown): TestRun => ({ passed: false, output: "Error", error: (err instanceof Error && err.message) || "Execution error" });
