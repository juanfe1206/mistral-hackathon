/**
 * KPI aggregation service for MVP outcomes.
 * Aggregates recovery count, SLA compliance, and queue aging from existing services.
 */

import * as leadRepository from "@/server/repositories/lead-repository";
import * as replyDraftRepository from "@/server/repositories/reply-draft-repository";
import * as slaService from "@/server/services/sla-service";

/** Threshold (minutes) for queue_aging_count: VIP/high leads waiting longer than this. */
const QUEUE_AGING_THRESHOLD_MINUTES = 30;

export interface KpiSummary {
  recovery_count: number;
  sla_compliance_percent: number | null;
  queue_aging_minutes: number | null;
  queue_aging_count: number;
}

/**
 * Get KPI summary for a tenant.
 * - Recovery count: leads with lifecycle_state = 'recovered'
 * - SLA compliance: from sla-service.getQueueSlaSummary (safe+recovering)/total
 * - Queue aging: oldest VIP/high lead minutes without first response; count of VIP/high >30m waiting
 */
export async function getKpiSummary(tenantId: string): Promise<KpiSummary> {
  const [recoveryCount, slaSummary, queueAging] = await Promise.all([
    leadRepository.countLeadsByLifecycleState(tenantId, "recovered"),
    slaService.getQueueSlaSummary(tenantId),
    computeQueueAging(tenantId),
  ]);

  return {
    recovery_count: recoveryCount,
    sla_compliance_percent: slaSummary.sla_safe_percent,
    queue_aging_minutes: queueAging.oldestMinutes,
    queue_aging_count: queueAging.countOverThreshold,
  };
}

interface QueueAgingResult {
  oldestMinutes: number | null;
  countOverThreshold: number;
}

async function computeQueueAging(tenantId: string): Promise<QueueAgingResult> {
  const vipHighLeads = await leadRepository.findVipHighLeadsByTenant(tenantId);
  if (vipHighLeads.length === 0) {
    return { oldestMinutes: null, countOverThreshold: 0 };
  }

  const leadIds = vipHighLeads.map((l) => l.id);
  const firstResponseByLead = await replyDraftRepository.getEarliestSentAtByLeadIds(
    leadIds,
    tenantId
  );

  const now = new Date();
  const thresholdMs = QUEUE_AGING_THRESHOLD_MINUTES * 60 * 1000;
  let oldestMinutes: number | null = null;
  let countOverThreshold = 0;

  for (const lead of vipHighLeads) {
    const firstResponse = firstResponseByLead.get(lead.id);
    if (firstResponse) continue; // Has response, not waiting

    const waitingMs = now.getTime() - lead.createdAt.getTime();
    const minutes = Math.round(waitingMs / 60000);
    if (oldestMinutes === null || minutes > oldestMinutes) {
      oldestMinutes = minutes;
    }
    if (waitingMs >= thresholdMs) {
      countOverThreshold++;
    }
  }

  return {
    oldestMinutes,
    countOverThreshold,
  };
}
