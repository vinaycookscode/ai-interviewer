"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getGeminiModelInstance } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";
import { MAX_BYTES } from "@/lib/drive-csv";
import {
    LEVELS,
    cleanQuestion,
    cleanSettings,
    draftPrompt,
    parseDrafts,
    parseQuestionCsv,
    type CsvQuestionStatus,
    type Level,
    type QuestionInput,
    type SettingsInput,
} from "@/lib/aptitude-tests";

type Err = { error: "notFound" | "locked" | "invalid" | "inUse" | "tooBig" | "limit" | "unavailable" };

async function employerId(): Promise<string | null> {
    const session = await auth();
    return session?.user?.id && session.user.role === "EMPLOYER" ? session.user.id : null;
}

/** A test used by a drive that's scheduled or live can't change: attempts would be scored against a moving key (AC4). */
async function inUse(testId: string): Promise<boolean> {
    const n = await db.drive.count({ where: { aptitudeTestId: testId, draft: false, closedAt: null, closesAt: { gt: new Date() } } });
    return n > 0;
}

/** The signed-in employer's own test, or not found (AC6). With `edit`, also refused while a live drive uses it. */
async function ownTest(id: unknown, edit: boolean) {
    const userId = await employerId();
    if (!userId || typeof id !== "string") return { ok: false as const, error: "notFound" as const };
    const test = await db.aptitudeTest.findFirst({ where: { id, ownerId: userId, archivedAt: null }, select: { id: true, sections: { select: { id: true } } } });
    if (!test) return { ok: false as const, error: "notFound" as const };
    if (edit && (await inUse(test.id))) return { ok: false as const, error: "locked" as const };
    return { ok: true as const, ...test, userId };
}

const refresh = (id?: string) => {
    revalidatePath("/dashboard/drives/tests");
    if (id) revalidatePath(`/dashboard/drives/tests/${id}`);
};

/** A new test to fill in: one section asking 10, 20 minutes. */
export async function createTest(): Promise<{ ok: true; id: string } | Err> {
    const userId = await employerId();
    if (!userId) return { error: "notFound" };
    const t = await db.aptitudeTest.create({
        data: { name: "Untitled test", durationMinutes: 20, ownerId: userId, sections: { create: { name: "Section 1", askCount: 10, order: 0 } } },
        select: { id: true },
    });
    refresh();
    return { ok: true, id: t.id };
}

/** Name, time, shuffling and sections. A section that has questions can't be removed (retire its questions first). */
export async function saveTestSettings(id: string, input: SettingsInput): Promise<{ ok: true } | Err | { errors: Record<string, string> }> {
    const t = await ownTest(id, true);
    if (!t.ok) return { error: t.error };
    const c = cleanSettings(input);
    if (!c.ok) return { errors: c.errors };
    const known = new Set(t.sections.map((s) => s.id));
    const keep = new Set(c.value.sections.flatMap((s) => (s.id && known.has(s.id) ? [s.id] : [])));
    const removed = t.sections.filter((s) => !keep.has(s.id)).map((s) => s.id);
    if (removed.length && (await db.aptitudeQuestion.count({ where: { sectionId: { in: removed }, retiredAt: null } }))) return { error: "inUse" };
    await db.$transaction(async (tx) => {
        await tx.aptitudeTest.update({ where: { id: t.id }, data: { name: c.value.name, durationMinutes: c.value.minutes, shuffle: c.value.shuffle } });
        if (removed.length) await tx.aptitudeSection.deleteMany({ where: { id: { in: removed }, testId: t.id } });
        for (const [order, s] of c.value.sections.entries()) {
            if (s.id && keep.has(s.id)) await tx.aptitudeSection.update({ where: { id: s.id }, data: { name: s.name, askCount: s.askCount, order } });
            else await tx.aptitudeSection.create({ data: { testId: t.id, name: s.name, askCount: s.askCount, order } });
        }
    });
    refresh(t.id);
    return { ok: true };
}

/** Add or edit a question. Only checked questions are used in attempts. */
export async function saveQuestion(testId: string, questionId: string | null, input: QuestionInput): Promise<{ ok: true } | Err> {
    const t = await ownTest(testId, true);
    if (!t.ok) return { error: t.error };
    const c = cleanQuestion(input, new Set(t.sections.map((s) => s.id)));
    if (!c.ok) return { error: "invalid" };
    if (questionId) {
        const n = await db.aptitudeQuestion.updateMany({ where: { id: questionId, testId: t.id }, data: c.value });
        if (!n.count) return { error: "notFound" };
    } else await db.aptitudeQuestion.create({ data: { ...c.value, testId: t.id } });
    refresh(t.id);
    return { ok: true };
}

/** Retire a question: it stops being drawn, and past attempts keep their history. */
export async function retireQuestion(testId: string, questionId: string): Promise<{ ok: true } | Err> {
    const t = await ownTest(testId, true);
    if (!t.ok) return { error: t.error };
    const n = await db.aptitudeQuestion.updateMany({ where: { id: questionId, testId: t.id, retiredAt: null }, data: { retiredAt: new Date() } });
    if (!n.count) return { error: "notFound" };
    refresh(t.id);
    return { ok: true };
}

/** Copy a ready-made test or one of the employer's own, to edit freely (a locked test's way out, AC4). */
export async function copyTest(id: string): Promise<{ ok: true; id: string } | Err> {
    const userId = await employerId();
    if (!userId || typeof id !== "string") return { error: "notFound" };
    const src = await db.aptitudeTest.findFirst({
        where: { id, archivedAt: null, OR: [{ ownerId: null }, { ownerId: userId }] },
        select: {
            name: true,
            durationMinutes: true,
            shuffle: true,
            sections: { orderBy: { order: "asc" }, select: { id: true, name: true, askCount: true, order: true } },
            questions: { where: { retiredAt: null }, select: { sectionId: true, text: true, options: true, correctIndex: true, explanation: true, checked: true } },
        },
    });
    if (!src) return { error: "notFound" };
    const copy = await db.$transaction(async (tx) => {
        const t = await tx.aptitudeTest.create({
            data: { name: `Copy of ${src.name}`.slice(0, 80), durationMinutes: src.durationMinutes, shuffle: src.shuffle, ownerId: userId },
            select: { id: true },
        });
        const map = new Map<string, string>();
        for (const s of src.sections) map.set(s.id, (await tx.aptitudeSection.create({ data: { testId: t.id, name: s.name, askCount: s.askCount, order: s.order }, select: { id: true } })).id);
        await tx.aptitudeQuestion.createMany({ data: src.questions.map((q) => ({ ...q, testId: t.id, sectionId: map.get(q.sectionId)! })) });
        return t;
    });
    refresh();
    return { ok: true, id: copy.id };
}

export interface CsvPreview {
    ok: true;
    ready: number;
    rows: { line: number; status: CsvQuestionStatus; text: string }[];
}

async function readCsv(testId: string, csv: unknown) {
    const t = await ownTest(testId, true);
    if (!t.ok) return { error: t.error };
    if (typeof csv !== "string" || !csv.trim()) return { ok: false as const, error: "invalid" as const };
    if (new TextEncoder().encode(csv).length > MAX_BYTES) return { ok: false as const, error: "tooBig" as const };
    const sections = await db.aptitudeSection.findMany({ where: { testId: t.id }, select: { id: true, name: true } });
    return { ok: true as const, t, parsed: parseQuestionCsv(csv, sections) };
}

/** Check a question CSV row by row; nothing is saved (AC5). */
export async function previewQuestionCsv(testId: string, csv: string): Promise<CsvPreview | Err> {
    const r = await readCsv(testId, csv);
    if (!r.ok) return { error: r.error };
    if (r.parsed.rows.length > 1000) return { error: "tooBig" };
    return { ok: true, ready: r.parsed.ready, rows: r.parsed.rows.filter((x) => x.status !== "READY").slice(0, 200).map((x) => ({ line: x.line, status: x.status, text: x.text })) };
}

/** Import the ready rows as Needs a check. */
export async function importQuestionCsv(testId: string, csv: string): Promise<{ ok: true; imported: number } | Err> {
    const r = await readCsv(testId, csv);
    if (!r.ok) return { error: r.error };
    if (r.parsed.rows.length > 1000) return { error: "tooBig" };
    const rows = r.parsed.rows.flatMap((x) => (x.question ? [{ ...x.question, checked: false, testId: r.t.id }] : []));
    if (rows.length) await db.aptitudeQuestion.createMany({ data: rows });
    refresh(r.t.id);
    return { ok: true, imported: rows.length };
}

export interface Draft {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
}

/** Ask Gemini for first drafts. Nothing is saved: each draft is added only when a person says its answer is right (AC3). */
export async function draftQuestions(testId: string, input: { topic: string; sectionId: string; level: Level; count: number }): Promise<{ ok: true; drafts: Draft[] } | Err> {
    const t = await ownTest(testId, true);
    if (!t.ok) return { error: t.error };
    const topic = typeof input?.topic === "string" ? input.topic.replace(/\s+/g, " ").trim().slice(0, 200) : "";
    const section = await db.aptitudeSection.findFirst({ where: { id: input?.sectionId, testId: t.id }, select: { name: true } });
    const count = Number(input?.count);
    if (!topic || !section || !LEVELS.includes(input?.level) || !Number.isInteger(count) || count < 1 || count > 5) return { error: "invalid" };
    // 10 drafting calls of up to 5 questions a day per employer (AC9 keeps the page usable when this runs out)
    if (!(await checkRateLimit(`aptitude-draft:${t.userId}`, 10, 24 * 60)).success) return { error: "limit" };
    try {
        const model = await getGeminiModelInstance();
        const reply = (await model.generateContent(draftPrompt({ topic, section: section.name, level: input.level, count }))).response.text();
        const drafts = parseDrafts(reply, count);
        return drafts.length ? { ok: true, drafts } : { error: "unavailable" };
    } catch (error) {
        console.error("Aptitude drafting failed:", error);
        return { error: "unavailable" };
    }
}

/** "Answer is right · add": a draft becomes a checked question, after the same checks as one typed in. */
export async function addDraft(testId: string, sectionId: string, draft: Draft): Promise<{ ok: true } | Err> {
    return saveQuestion(testId, null, {
        sectionId,
        text: draft?.question,
        options: draft?.options,
        correctIndex: draft?.correct,
        explanation: draft?.explanation ?? "",
        checked: true,
    } as QuestionInput);
}
