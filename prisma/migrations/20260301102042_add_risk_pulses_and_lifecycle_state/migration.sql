-- CreateEnum
CREATE TYPE "LeadLifecycleState" AS ENUM ('default', 'at_risk', 'recovered', 'lost');

-- CreateEnum
CREATE TYPE "RiskPulseStatus" AS ENUM ('active', 'recovered', 'lost');

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "lifecycle_state" "LeadLifecycleState" NOT NULL DEFAULT 'default';

-- CreateTable
CREATE TABLE "risk_pulses" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL,
    "status" "RiskPulseStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_pulses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_risk_pulses_lead_id" ON "risk_pulses"("lead_id");

-- CreateIndex
CREATE INDEX "idx_risk_pulses_tenant_id" ON "risk_pulses"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_risk_pulses_status" ON "risk_pulses"("status");

-- CreateIndex
CREATE INDEX "idx_leads_lifecycle_state" ON "leads"("lifecycle_state");

-- AddForeignKey
ALTER TABLE "risk_pulses" ADD CONSTRAINT "risk_pulses_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
