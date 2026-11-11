-- Search the Question Bank by meaning (AIIN-210): pgvector, available on Neon and in Postgres 17 with the pgvector package
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "BankItem" ADD COLUMN     "embedding" vector(768);
