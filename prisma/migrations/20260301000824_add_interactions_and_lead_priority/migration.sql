-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('vip', 'high', 'low');

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "priority" "LeadPriority" NOT NULL DEFAULT 'low';

-- CreateTable
CREATE TABLE "interactions" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_interactions_lead_id" ON "interactions"("lead_id");

-- CreateIndex
CREATE INDEX "idx_interactions_tenant_id" ON "interactions"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_leads_tenant_id_priority" ON "leads"("tenant_id", "priority");

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
