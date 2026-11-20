-- CreateEnum
CREATE TYPE "IngestStatus" AS ENUM ('pending', 'processing', 'ready', 'failed');

-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "error" TEXT,
ADD COLUMN     "status" "IngestStatus" NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE "Chunk" (
    "id" SERIAL NOT NULL,
    "contentId" INTEGER NOT NULL,
    "index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "startSeconds" INTEGER,
    "embedding" vector(384),

    CONSTRAINT "Chunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chunk_contentId_idx" ON "Chunk"("contentId");

-- AddForeignKey
ALTER TABLE "Chunk" ADD CONSTRAINT "Chunk_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
