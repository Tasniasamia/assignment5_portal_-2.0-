-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "documentIdeasEmbedding" (
    "id" TEXT NOT NULL,
    "chunkey" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceLabel" TEXT,
    "content" TEXT,
    "metadata" JSONB,
    "embedding" vector(2048) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentIdeasEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "documentIdeasEmbedding_chunkey_key" ON "documentIdeasEmbedding"("chunkey");

-- CreateIndex
CREATE INDEX "idx_sourceType" ON "documentIdeasEmbedding"("sourceType");

-- CreateIndex
CREATE INDEX "idx_sourceId" ON "documentIdeasEmbedding"("sourceId");
