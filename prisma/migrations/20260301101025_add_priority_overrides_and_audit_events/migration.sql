-- CreateTable
CREATE TABLE "priority_overrides" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "previous_priority" "LeadPriority" NOT NULL,
    "new_priority" "LeadPriority" NOT NULL,
    "actor_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "priority_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "actor_id" UUID,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "correlation_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_priority_overrides_lead_id" ON "priority_overrides"("lead_id");

-- CreateIndex
CREATE INDEX "idx_priority_overrides_tenant_id" ON "priority_overrides"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_audit_events_tenant_id" ON "audit_events"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_audit_events_occurred_at" ON "audit_events"("occurred_at");

-- AddForeignKey
ALTER TABLE "priority_overrides" ADD CONSTRAINT "priority_overrides_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
