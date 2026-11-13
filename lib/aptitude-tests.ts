// Employer-built aptitude tests (AIIN-226): checking settings and questions, importing a question CSV, and AI drafts.
// Plain module, tested on its own (lib/aptitude-tests.test.ts).
import { parseCsv } from "./drive-csv.ts";

export const LIMITS = { name: 80, section: 40, text: 1000, option: 300, explanation: 1000, minOptions: 2, maxOptions: 6, minMinutes: 5, maxMinutes: 180, maxAsk: 100, maxSections: 10 };
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").trim().slice(0, max + 1) : "");

export interface SettingsInput {
    name: string;
    minutes: string;
    shuffle: boolean;
    sections: { id?: string; name: string; askCount: string }[];
}
export type SettingsField = "name" | "minutes" | "sections";
export function cleanSettings(input: SettingsInput):
    | { ok: true; value: { name: string; minutes: number; shuffle: boolean; sections: { id?: string; name: string; askCount: number }[] } }
    | { ok: false; errors: Partial<Record<SettingsField, "required" | "tooLong" | "range" | "invalid">> } {
    const errors: Partial<Record<SettingsField, "required" | "tooLong" | "range" | "invalid">> = {};
    const name = clean(input?.name, LIMITS.name).replace(/\s+/g, " ");
    if (!name) errors.name = "required";
    else if (name.length > LIMITS.name) errors.name = "tooLong";
    const minutes = Number(clean(input?.minutes, 4));
    if (!Number.isInteger(minutes) || minutes < LIMITS.minMinutes || minutes > LIMITS.maxMinutes) errors.minutes = "range";
    const sections: { id?: string; name: string; askCount: number }[] = [];
    const list = Array.isArray(input?.sections) ? input.sections : [];
    if (!list.length) errors.sections = "required";
    if (list.length > LIMITS.maxSections) errors.sections = "invalid";
    const names = new Set<string>();
    for (const s of list.slice(0, LIMITS.maxSections)) {
        const n = clean(s?.name, LIMITS.section).replace(/\s+/g, " ");
        const ask = Number(clean(s?.askCount, 4));
        if (!n || n.length > LIMITS.section || names.has(n.toLowerCase()) || !Number.isInteger(ask) || ask < 1 || ask > LIMITS.maxAsk) {
            errors.sections = "invalid";
            continue;
        }
        names.add(n.toLowerCase());
        sections.push({ id: typeof s.id === "string" && s.id ? s.id : undefined, name: n, askCount: ask });
    }
    if (Object.keys(errors).length) return { ok: false, errors };
    return { ok: true, value: { name, minutes, shuffle: input.shuffle !== false, sections } };
}

export interface QuestionInput {
    sectionId: string;
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    checked: boolean;
}
export type QuestionError = "section" | "text" | "options" | "correct" | "tooLong";
/** A question as saved: plain text only, 2 to 6 distinct options, one of them correct. Never rendered as HTML (AC8). */
export function cleanQuestion(input: QuestionInput, sectionIds: Set<string>): { ok: true; value: QuestionInput } | { ok: false; error: QuestionError } {
    if (!input || typeof input !== "object" || !sectionIds.has(input.sectionId)) return { ok: false, error: "section" };
    const text = clean(input.text, LIMITS.text);
    if (!text) return { ok: false, error: "text" };
    if (text.length > LIMITS.text) return { ok: false, error: "tooLong" };
    const options = (Array.isArray(input.options) ? input.options : []).map((o) => clean(o, LIMITS.option).replace(/\s+/g, " ")).filter(Boolean);
    if (options.some((o) => o.length > LIMITS.option)) return { ok: false, error: "tooLong" };
    if (options.length < LIMITS.minOptions || options.length > LIMITS.maxOptions || new Set(options.map((o) => o.toLowerCase())).size !== options.length)
        return { ok: false, error: "options" };
    // The correct index refers to the options as given, before empty ones were dropped
    const given = (Array.isArray(input.options) ? input.options : []).map((o) => clean(o, LIMITS.option).replace(/\s+/g, " "));
    const correct = given[input.correctIndex];
    const correctIndex = correct ? options.indexOf(correct) : -1;
    if (!Number.isInteger(input.correctIndex) || correctIndex < 0) return { ok: false, error: "correct" };
    const explanation = clean(input.explanation, LIMITS.explanation);
    if (explanation.length > LIMITS.explanation) return { ok: false, error: "tooLong" };
    return { ok: true, value: { sectionId: input.sectionId, text, options, correctIndex, explanation, checked: input.checked === true } };
}

export type CsvQuestionStatus = "READY" | "UNKNOWN_SECTION" | "NO_TEXT" | "FEW_OPTIONS" | "NO_CORRECT" | "TOO_LONG";
/**
 * A question CSV: section, question, option 1 … option 6, correct (1–6 or A–F), explanation. Each row is checked like
 * a question typed in (AC5). Imported questions come in unchecked, so a person checks every answer.
 */
export function parseQuestionCsv(text: string, sections: { id: string; name: string }[]) {
    const all = parseCsv(text);
    const [head = [], ...rows] = all;
    const h = head.map((x) => x.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const col = (...names: string[]) => h.findIndex((x) => names.includes(x));
    const cSection = col("section"), cText = col("question", "text"), cCorrect = col("correct", "answer", "correctoption"), cWhy = col("explanation", "why");
    const cOptions = h.map((x, i) => (/^(option|choice)[1-6a-f]$/.test(x) ? i : -1)).filter((i) => i >= 0);
    const bySection = new Map(sections.map((s) => [s.name.trim().toLowerCase(), s.id]));
    const ids = new Set(sections.map((s) => s.id));
    const out = rows.map((r, i) => {
        const sectionId = bySection.get((r[cSection] ?? "").trim().toLowerCase()) ?? "";
        const options = cOptions.map((c) => r[c] ?? "");
        const raw = (r[cCorrect] ?? "").trim().toUpperCase();
        const correctIndex = /^[1-6]$/.test(raw) ? Number(raw) - 1 : /^[A-F]$/.test(raw) ? raw.charCodeAt(0) - 65 : -1;
        const q = { sectionId, text: r[cText] ?? "", options, correctIndex, explanation: cWhy >= 0 ? (r[cWhy] ?? "") : "", checked: false };
        const c = cleanQuestion(q, ids);
        const status: CsvQuestionStatus = c.ok
            ? "READY"
            : ({ section: "UNKNOWN_SECTION", text: "NO_TEXT", options: "FEW_OPTIONS", correct: "NO_CORRECT", tooLong: "TOO_LONG" } as const)[c.error];
        return { line: i + 2, status, question: c.ok ? c.value : null, text: (r[cText] ?? "").slice(0, 120) };
    });
    return { rows: out, ready: out.filter((r) => r.status === "READY").length };
}

// ---- AI drafts ----
export const LEVELS = ["FRESHER", "EXPERIENCED"] as const;
export type Level = (typeof LEVELS)[number];

export function draftPrompt(input: { topic: string; section: string; level: Level; count: number }): string {
    return [
        "You write multiple-choice aptitude questions for job candidates in India.",
        `Topic: ${input.topic}`,
        `Section: ${input.section}`,
        `Level: ${input.level === "FRESHER" ? "fresh graduates" : "people with a few years of experience"}`,
        `Write ${input.count} questions. Each has exactly 4 options and exactly one correct option.`,
        "Work out every answer step by step before you choose it. Keep questions short and unambiguous, in plain English, with no images or code blocks.",
        'Reply with JSON only: {"questions":[{"question":"…","options":["…","…","…","…"],"correct":0,"explanation":"one or two sentences showing the working"}]}',
        "`correct` is the 0-based index of the right option.",
    ].join("\n");
}

/** Read the model's reply defensively: only well-formed questions survive; nothing is trusted or saved here (AC3). */
export function parseDrafts(text: string, max: number): { question: string; options: string[]; correct: number; explanation: string }[] {
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    let data: unknown;
    try {
        data = JSON.parse(json);
    } catch {
        return [];
    }
    const list = (data as { questions?: unknown })?.questions;
    if (!Array.isArray(list)) return [];
    return list
        .flatMap((q) => {
            const question = clean(q?.question, LIMITS.text);
            const options = Array.isArray(q?.options) ? q.options.map((o: unknown) => clean(o, LIMITS.option)).filter(Boolean) : [];
            const correct = Number(q?.correct);
            if (!question || question.length > LIMITS.text || options.length < 2 || options.length > 6 || !Number.isInteger(correct) || correct < 0 || correct >= options.length) return [];
            if (new Set(options.map((o: string) => o.toLowerCase())).size !== options.length) return [];
            return [{ question, options, correct, explanation: clean(q?.explanation, LIMITS.explanation).slice(0, LIMITS.explanation) }];
        })
        .slice(0, max);
}
