// Search the Question Bank by meaning (AIIN-210). No access checks: callers pass the signed-in candidate's id.
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const MODEL = "gemini-embedding-001";
const DIMENSIONS = 768;
// One batch call per search at most; a bigger backlog is filled over the next searches
const BATCH = 100;

type Task = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

/** Gemini embeddings at 768 dimensions. The SDK can't set the size, so this calls the REST API. */
export async function embed(texts: string[], taskType: Task): Promise<number[][]> {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:batchEmbedContents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
            requests: texts.map((text) => ({ model: `models/${MODEL}`, content: { parts: [{ text }] }, taskType, outputDimensionality: DIMENSIONS })),
        }),
        signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Gemini embeddings failed: ${response.status}`);
    const data = (await response.json()) as { embeddings?: { values: number[] }[] };
    const vectors = data.embeddings?.map((e) => e.values) ?? [];
    if (vectors.length !== texts.length || vectors.some((v) => v.length !== DIMENSIONS)) throw new Error("Gemini embeddings came back malformed");
    return vectors;
}

const literal = (vector: number[]) => `[${vector.join(",")}]`;

/** Embed the candidate's questions that don't have one yet: new items, and everything from before search existed. */
async function fillEmbeddings(userId: string) {
    const missing = await db.$queryRaw<{ id: string; questionText: string }[]>(
        Prisma.sql`SELECT "id", "questionText" FROM "BankItem" WHERE "userId" = ${userId} AND "embedding" IS NULL LIMIT ${BATCH}`
    );
    if (!missing.length) return;
    const vectors = await embed(
        missing.map((m) => m.questionText),
        "RETRIEVAL_DOCUMENT"
    );
    await db.$transaction(
        missing.map((m, i) => db.$executeRaw(Prisma.sql`UPDATE "BankItem" SET "embedding" = ${literal(vectors[i])}::vector WHERE "id" = ${m.id} AND "userId" = ${userId}`))
    );
}

/**
 * How close each of the candidate's questions is in meaning to the query, from 1 (same) down. Only their own items
 * are ever compared (AC3). Throws if Gemini is unavailable; the caller falls back to word matches.
 */
export async function similarities(userId: string, query: string): Promise<{ id: string; similarity: number }[]> {
    const [, [vector]] = await Promise.all([fillEmbeddings(userId), embed([query], "RETRIEVAL_QUERY")]);
    return db.$queryRaw<{ id: string; similarity: number }[]>(
        Prisma.sql`SELECT "id", 1 - ("embedding" <=> ${literal(vector)}::vector) AS "similarity"
                   FROM "BankItem" WHERE "userId" = ${userId} AND "embedding" IS NOT NULL`
    );
}
