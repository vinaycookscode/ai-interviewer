// What each placement plan task's content may hold (AIIN-68). The fields the task views read are checked; other
// fields (seeded content has more, e.g. a problem's interviewTips) are kept as they are. Plain module: the server checks content against these
// before it reaches the page, the seed checks what it writes, and the task views take the matching type.
import { z } from "zod";

const text = z.string().max(20_000);
const short = z.string().max(500);
const option = z.object({ question: short, options: z.array(short).min(2).max(6), correct: z.number().int().min(0) });

export const QuizContentSchema = z.looseObject({ questions: z.number().int().min(1).max(50).optional(), topic: short.optional(), items: z.array(option).max(50).optional() });
export const AptitudeContentSchema = QuizContentSchema.extend({
    items: z.array(option.extend({ explanation: z.string().max(2000).optional() })).max(50).optional(),
    timeLimit: z.number().min(1).max(180).optional(),
});
export const ReadingContentSchema = z.looseObject({ text: text.optional(), title: short.optional(), keyPoints: z.array(short).max(20).optional(), estimatedMinutes: z.number().min(1).max(240).optional() });
export const VideoContentSchema = z.looseObject({ url: z.string().max(500).regex(/^https:\/\/[^\s]+$/).optional(), youtubeId: z.string().regex(/^[\w-]{6,20}$/).optional(), description: z.string().max(2000).optional() });
export const HRPrepContentSchema = z.looseObject({ topic: short.optional(), question: short.optional(), tips: z.array(short).max(20).optional(), sampleAnswer: z.string().max(5000).optional() });
export const ProblemContentSchema = z.looseObject({
    difficulty: z.string().max(20).optional(),
    problem: short.optional(),
    description: text.optional(),
    examples: z.array(z.object({ input: z.string().max(2000), output: z.string().max(2000), explanation: z.string().max(2000).optional() })).max(20).optional(),
    hints: z.array(z.string().max(1000)).max(20).optional(),
    constraints: z.array(short).max(30).optional(),
    solution: text.optional(),
    starterCode: text.optional(),
    /** Starter code per language, e.g. { javascript, python, java }. */
    starterCodes: z.record(z.string().max(30), text).optional(),
    testCases: z.array(z.object({ input: z.string().max(5000), expected: z.string().max(5000) })).max(100).optional(),
});
export const MockContentSchema = z.looseObject({});

export type QuizContent = z.infer<typeof QuizContentSchema>;
export type AptitudeContent = z.infer<typeof AptitudeContentSchema>;
export type ReadingContent = z.infer<typeof ReadingContentSchema>;
export type VideoContent = z.infer<typeof VideoContentSchema>;
export type HRPrepContent = z.infer<typeof HRPrepContentSchema>;
export type ProblemContent = z.infer<typeof ProblemContentSchema>;

const SCHEMAS = {
    QUIZ: QuizContentSchema,
    APTITUDE: AptitudeContentSchema,
    READING: ReadingContentSchema,
    VIDEO: VideoContentSchema,
    HR_PREP: HRPrepContentSchema,
    PROBLEM: ProblemContentSchema,
    MOCK_INTERVIEW: MockContentSchema,
} as const;

export type PlacementTaskType = keyof typeof SCHEMAS;

/**
 * The task's content if it has the shape its type needs, else null: the page then shows "This task couldn't be loaded"
 * instead of breaking. Answers' `correct` must point at one of their options.
 */
export function readTaskContent(type: string, raw: unknown): Record<string, unknown> | null {
    const schema = SCHEMAS[type as PlacementTaskType];
    if (!schema) return null;
    const input = type === "QUIZ" || type === "APTITUDE" ? fromQuestionList(raw) : type === "PROBLEM" ? fromStarterMap(raw) : (raw ?? {});
    const r = schema.safeParse(input);
    if (!r.success) return null;
    const items = (r.data as { items?: { options: string[]; correct: number }[] }).items;
    if (items?.some((i) => i.correct >= i.options.length)) return null;
    return r.data as Record<string, unknown>;
}

/**
 * Older seeded quizzes list `questions: [{ question, options, correctAnswer }]`; the views read `items` with `correct`.
 * Translate that format rather than refuse it.
 */
function fromQuestionList(raw: unknown): unknown {
    if (!raw || typeof raw !== "object" || !Array.isArray((raw as { questions?: unknown }).questions)) return raw ?? {};
    const { questions, ...rest } = raw as { questions: Record<string, unknown>[] };
    return {
        ...rest,
        items: questions.map((q) => ({ question: q?.question, options: q?.options, correct: q?.correct ?? q?.correctAnswer, ...(q?.explanation ? { explanation: q.explanation } : {}) })),
    };
}

/** Starter code given per language (`starterCode: { javascript, python }`): JavaScript is the default, all go to the editor. */
function fromStarterMap(raw: unknown): unknown {
    const sc = raw && typeof raw === "object" ? (raw as { starterCode?: unknown }).starterCode : undefined;
    if (!sc || typeof sc !== "object" || Array.isArray(sc)) return raw ?? {};
    const map = sc as Record<string, unknown>;
    const first = typeof map.javascript === "string" ? map.javascript : Object.values(map).find((v) => typeof v === "string");
    return { ...(raw as object), starterCode: first, starterCodes: map };
}
