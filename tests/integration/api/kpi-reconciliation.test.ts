/**
 * Integration test: AC1 reconciliation - KPI values match underlying event records.
 * Requires DATABASE_URL. Skipped when not set (e.g. CI without test DB).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("KPI reconciliation (integration)", () => {
  const TEST_TENANT_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

  beforeAll(async () => {
    const { prisma } = await import("@/lib/db");
    await prisma.tenant.create({
      data: { id: TEST_TENANT_ID, name: "KPI Integration Test" },
    });

    const now = new Date();
    const thirtyFiveMinAgo = new Date(now.getTime() - 35 * 60 * 1000);

    const lead1 = await prisma.lead.create({
      data: {
        tenantId: TEST_TENANT_ID,
        sourceChannel: "whatsapp",
        sourceExternalId: "ext-1",
        sourceMetadata: {},
        priority: "high",
        lifecycleState: "recovered",
      },
    });
    const lead2 = await prisma.lead.create({
      data: {
        tenantId: TEST_TENANT_ID,
        sourceChannel: "whatsapp",
        sourceExternalId: "ext-2",
        sourceMetadata: {},
        priority: "high",
        lifecycleState: "recovered",
      },
    });

    const lead3 = await prisma.lead.create({
      data: {
        tenantId: TEST_TENANT_ID,
        sourceChannel: "whatsapp",
        sourceExternalId: "ext-3",
        sourceMetadata: {},
        priority: "vip",
        lifecycleState: "default",
        createdAt: thirtyFiveMinAgo,
      },
    });

    const lead4 = await prisma.lead.create({
      data: {
        tenantId: TEST_TENANT_ID,
        sourceChannel: "whatsapp",
        sourceExternalId: "ext-4",
        sourceMetadata: {},
        priority: "high",
        lifecycleState: "default",
      },
    });

    await prisma.replyDraft.createMany({
      data: [
        { leadId: lead1.id, tenantId: TEST_TENANT_ID, draftText: "Hi", status: "sent", sentAt: now },
        { leadId: lead2.id, tenantId: TEST_TENANT_ID, draftText: "Hi", status: "sent", sentAt: now },
        { leadId: lead4.id, tenantId: TEST_TENANT_ID, draftText: "Hi", status: "sent", sentAt: now },
      ],
    });
  });

  afterAll(async () => {
    const { prisma } = await import("@/lib/db");
    await prisma.tenant.delete({ where: { id: TEST_TENANT_ID } }).catch(() => {});
  });

  it("reconciles recovery_count, SLA, and queue_aging with seeded data (AC1)", async () => {
    const kpiService = await import("@/server/services/kpi-service");
    const summary = await kpiService.getKpiSummary(TEST_TENANT_ID);

    expect(summary.recovery_count).toBe(2);

    expect(summary.sla_compliance_percent).not.toBeNull();
    expect(typeof summary.sla_compliance_percent).toBe("number");

    expect(summary.queue_aging_minutes).not.toBeNull();
    expect(summary.queue_aging_minutes).toBeGreaterThanOrEqual(35);
    expect(summary.queue_aging_count).toBe(1);
  });
});
