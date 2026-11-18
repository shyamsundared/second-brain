-- pgvector adds the "vector" column type and the <=> distance operator
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "embedding" vector(384);
