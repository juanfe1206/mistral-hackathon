-- CreateTable
CREATE TABLE "classifications" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "priority" "LeadPriority" NOT NULL,
    "reason_tags" JSONB NOT NULL,
    "model_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_classifications_lead_id" ON "classifications"("lead_id");

-- CreateIndex
CREATE INDEX "idx_classifications_tenant_id" ON "classifications"("tenant_id");

-- AddForeignKey
ALTER TABLE "classifications" ADD CONSTRAINT "classifications_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
