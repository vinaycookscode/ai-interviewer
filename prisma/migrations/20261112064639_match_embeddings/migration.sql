-- AlterTable
ALTER TABLE "CandidateProfile" ADD COLUMN     "embedding" vector(768);

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "embedding" vector(768);

-- Nearest-neighbour search for matching (AIIN-194). pgvector is already enabled by `bank_search`; kept here so a
-- fresh database applies cleanly in any order.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE INDEX IF NOT EXISTS "Job_embedding_idx" ON "Job" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS "CandidateProfile_embedding_idx" ON "CandidateProfile" USING hnsw ("embedding" vector_cosine_ops);
