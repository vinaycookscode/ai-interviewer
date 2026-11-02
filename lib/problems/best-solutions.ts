// Best solutions for a coding problem (AIIN-221): the prompt that asks for them and the parser that checks what comes
// back. Pure: no database, no "@/" imports. Running them against the tests happens on the server.

export const SOLUTION_LANGUAGES = ["javascript", "python", "java", "cpp"] as const;
export type SolutionLanguage = (typeof SOLUTION_LANGUAGES)[number];

export interface DraftSolution {
    name: string;
    time: string;
    space: string;
    explanation: string;
    code: Partial<Record<SolutionLanguage, string>>;
}

const LIMIT = { name: 60, complexity: 24, explanation: 600, code: 6000 };

/** The prompt: the problem, and each language's starter so the code fits the tests' calling convention. */
export function solutionsPrompt(title: string, statement: string, starters: Partial<Record<SolutionLanguage, string>>): string {
    const shapes = SOLUTION_LANGUAGES.filter((l) => starters[l])
        .map((l) => `${l}:\n${starters[l]}`)
        .join("\n\n");
    return `You are writing model solutions for a coding interview practice problem.

Problem: ${title}
${statement}

Write 2 or 3 genuinely different approaches, from simplest to best, for example brute force, then better, then optimal.
Skip an approach that isn't meaningfully different. Each must be correct for every valid input.

Each language's code must keep exactly this function or method signature and class shape:
${shapes}

Return ONLY a JSON array, no markdown, like:
[{"name": "Brute force", "time": "O(n²)", "space": "O(1)", "explanation": "Two plain sentences on the idea and its trade-off.", "code": {"javascript": "...", "python": "...", "java": "...", "cpp": "..."}}]
Use big-O with ² or ³ for powers. Code only: no comments explaining the problem, no input reading, no printing.`;
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** What came back, checked and bounded; anything malformed is dropped. At most three approaches. */
export function parseSolutions(raw: string): DraftSolution[] {
    let data: unknown;
    try {
        data = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
    } catch {
        return [];
    }
    if (!Array.isArray(data)) return [];
    return data
        .flatMap((d): DraftSolution[] => {
            if (!d || typeof d !== "object") return [];
            const o = d as Record<string, unknown>;
            const code: DraftSolution["code"] = {};
            const given = o.code && typeof o.code === "object" ? (o.code as Record<string, unknown>) : {};
            for (const l of SOLUTION_LANGUAGES) {
                const c = text(given[l], LIMIT.code);
                if (c) code[l] = c;
            }
            const s = { name: text(o.name, LIMIT.name), time: text(o.time, LIMIT.complexity), space: text(o.space, LIMIT.complexity), explanation: text(o.explanation, LIMIT.explanation), code };
            return s.name && s.time && s.space && Object.keys(code).length ? [s] : [];
        })
        .slice(0, 3);
}
