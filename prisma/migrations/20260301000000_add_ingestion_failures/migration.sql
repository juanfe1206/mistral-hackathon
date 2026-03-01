-- CreateTable
CREATE TABLE "ingestion_failures" (
    "id" UUID NOT NULL,
    "error_code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingestion_failures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_ingestion_failures_created_at" ON "ingestion_failures"("created_at");
