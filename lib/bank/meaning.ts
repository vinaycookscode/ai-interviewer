// Search the Question Bank by meaning (AIIN-210). No access checks: callers pass the signed-in candidate's id.
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { embed, vectorLiteral } from "@/lib/ai/embeddings";

// One batch call per search at most; a bigger backlog is filled over the next searches
const BATCH = 100;

export { embed };
const literal = vectorLiteral;

/** Embed the candidate's questions that don't have one yet: new items, and everything from before search existed. */
async function fillEmbeddings(userId: string) {
    const missing = await db.$queryRaw<{ id: string; questionText: string }[]>(
        Prisma.sql`SELECT "id", "questionText" FROM "BankItem" WHERE "userId" = ${userId} AND "embedding" IS NULL LIMIT ${BATCH}`,
    );
    if (!missing.length) return;
    const vectors = await embed(
        missing.map((m) => m.questionText),
        "RETRIEVAL_DOCUMENT",
    );
    await db.$transaction(
        missing.map((m, i) =>
            db.$executeRaw(Prisma.sql`UPDATE "BankItem" SET "embedding" = ${literal(vectors[i])}::vector WHERE "id" = ${m.id} AND "userId" = ${userId}`),
        ),
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
                   FROM "BankItem" WHERE "userId" = ${userId} AND "embedding" IS NOT NULL`,
    );
}
