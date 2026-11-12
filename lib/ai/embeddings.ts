// Gemini embeddings at 768 dimensions (AIIN-194), shared by Question Bank search and Talent Match. Server only.

export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 768;

export type EmbeddingTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" | "SEMANTIC_SIMILARITY";

/** Embed texts with the server's key. The SDK can't set the size, so this calls the REST API. Throws on any failure. */
export async function embed(texts: string[], taskType: EmbeddingTask): Promise<number[][]> {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
            requests: texts.map((text) => ({
                model: `models/${EMBEDDING_MODEL}`,
                content: { parts: [{ text }] },
                taskType,
                outputDimensionality: EMBEDDING_DIMENSIONS,
            })),
        }),
        signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Gemini embeddings failed: ${response.status}`);
    const data = (await response.json()) as { embeddings?: { values: number[] }[] };
    const vectors = data.embeddings?.map((e) => e.values) ?? [];
    if (vectors.length !== texts.length || vectors.some((v) => v.length !== EMBEDDING_DIMENSIONS)) throw new Error("Gemini embeddings came back malformed");
    return vectors;
}

/** A vector as pgvector's text form, for `${vectorLiteral(v)}::vector` in a parameterised query. */
export const vectorLiteral = (vector: number[]) => `[${vector.join(",")}]`;
