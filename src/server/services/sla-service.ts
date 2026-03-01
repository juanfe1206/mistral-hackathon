import * as leadRepository from "@/server/repositories/lead-repository";
import * as replyDraftRepository from "@/server/repositories/reply-draft-repository";

/** SLA target: 5 minutes for VIP/high-risk (PRD) */
const TARGET_MINUTES = 5;

/** Warning: <2m left; breach-risk: <1m left */
const WARNING_MINUTES = 2;
const BREACH_RISK_MINUTES = 1;

export type SlaStatus = "safe" | "warning" | "breach-risk" | "breached" | "recovering" | "n_a";

export interface LeadSlaStatus {
  status: SlaStatus;
  minutes_to_breach: number | null;
  minutes_over: number | null;
  first_response_at: string | null;
  response_minutes: number | null;
}

export interface QueueSlaSummary {
  count_safe: number;
  count_warning: number;
  count_breach_risk: number;
  count_breached: number;
  count_recovering: number;
  count_n_a: number;
  total_tracked: number;
  sla_safe_percent: number | null;
}

function computeSlaStatus(
  createdAt: Date,
  firstResponseAt: Date | null,
  priority: "vip" | "high" | "low"
): { status: SlaStatus; minutesToBreach: number | null; minutesOver: number | null; responseMinutes: number | null } {
  if (priority === "low") {
    return { status: "n_a", minutesToBreach: null, minutesOver: null, responseMinutes: null };
  }

  const now = new Date();
  const breachAt = new Date(createdAt.getTime() + TARGET_MINUTES * 60 * 1000);

  if (firstResponseAt) {
    const responseMs = firstResponseAt.getTime() - createdAt.getTime();
    const responseMinutes = Math.round(responseMs / 60000);
    const respondedInTime = firstResponseAt <= breachAt;
    if (respondedInTime) {
      return { status: "safe", minutesToBreach: null, minutesOver: null, responseMinutes };
    }
    const overMs = firstResponseAt.getTime() - breachAt.getTime();
    return {
      status: "recovering",
      minutesToBreach: null,
      minutesOver: Math.round(overMs / 60000),
      responseMinutes,
    };
  }

  if (now > breachAt) {
    const overMs = now.getTime() - breachAt.getTime();
    return {
      status: "breached",
      minutesToBreach: null,
      minutesOver: Math.round(overMs / 60000),
      responseMinutes: null,
    };
  }

  const minutesLeft = (breachAt.getTime() - now.getTime()) / 60000;
  if (minutesLeft <= BREACH_RISK_MINUTES) {
    return { status: "breach-risk", minutesToBreach: Math.round(minutesLeft), minutesOver: null, responseMinutes: null };
  }
  if (minutesLeft <= WARNING_MINUTES) {
    return { status: "warning", minutesToBreach: Math.round(minutesLeft), minutesOver: null, responseMinutes: null };
  }
  return { status: "safe", minutesToBreach: Math.round(minutesLeft), minutesOver: null, responseMinutes: null };
}

export async function getLeadSlaStatus(leadId: string, tenantId: string): Promise<LeadSlaStatus | null> {
  const lead = await leadRepository.findLeadById(leadId, tenantId);
  if (!lead) return null;

  const firstResponseAt = await replyDraftRepository.getEarliestSentAtForLead(leadId, tenantId);
  const { status, minutesToBreach, minutesOver, responseMinutes } = computeSlaStatus(
    lead.createdAt,
    firstResponseAt,
    lead.priority
  );

  return {
    status,
    minutes_to_breach: minutesToBreach,
    minutes_over: minutesOver,
    first_response_at: firstResponseAt?.toISOString() ?? null,
    response_minutes: responseMinutes,
  };
}

/** Default limit matches getLeadsWithSlaStatus so triage header reflects visible leads. */
const DEFAULT_QUEUE_LIMIT = 100;

export async function getQueueSlaSummary(
  tenantId: string,
  options?: { limit?: number }
): Promise<QueueSlaSummary> {
  const limit = options?.limit ?? DEFAULT_QUEUE_LIMIT;
  const leads = await leadRepository.findLeadsByTenant(tenantId, { limit });
  const leadIds = leads.map((l) => l.id);
  const firstResponseByLead = await replyDraftRepository.getEarliestSentAtByLeadIds(leadIds, tenantId);

  const counts = {
    safe: 0,
    warning: 0,
    breach_risk: 0,
    breached: 0,
    recovering: 0,
    n_a: 0,
  };

  for (const lead of leads) {
    const firstResponseAt = firstResponseByLead.get(lead.id) ?? null;
    const { status } = computeSlaStatus(lead.createdAt, firstResponseAt, lead.priority);
    if (status === "n_a") counts.n_a++;
    else if (status === "safe") counts.safe++;
    else if (status === "warning") counts.warning++;
    else if (status === "breach-risk") counts.breach_risk++;
    else if (status === "breached") counts.breached++;
    else counts.recovering++;
  }

  const totalTracked = counts.safe + counts.warning + counts.breach_risk + counts.breached + counts.recovering;
  const slaSafePercent =
    totalTracked > 0
      ? Math.round(((counts.safe + counts.recovering) / totalTracked) * 100)
      : null;

  return {
    count_safe: counts.safe,
    count_warning: counts.warning,
    count_breach_risk: counts.breach_risk,
    count_breached: counts.breached,
    count_recovering: counts.recovering,
    count_n_a: counts.n_a,
    total_tracked: totalTracked,
    sla_safe_percent: slaSafePercent,
  };
}

export async function getLeadsWithSlaStatus(
  tenantId: string,
  options?: { limit?: number }
): Promise<Array<{ lead: Awaited<ReturnType<typeof leadRepository.findLeadsByTenant>>[number]; sla_status: LeadSlaStatus }>> {
  const leads = await leadRepository.findLeadsByTenant(tenantId, options ?? { limit: 100 });
  const leadIds = leads.map((l) => l.id);
  const firstResponseByLead = await replyDraftRepository.getEarliestSentAtByLeadIds(leadIds, tenantId);

  const result: Array<{
    lead: (typeof leads)[number];
    sla_status: LeadSlaStatus;
  }> = [];

  for (const lead of leads) {
    const firstResponseAt = firstResponseByLead.get(lead.id) ?? null;
    const { status, minutesToBreach, minutesOver, responseMinutes } = computeSlaStatus(
      lead.createdAt,
      firstResponseAt,
      lead.priority
    );

    result.push({
      lead,
      sla_status: {
        status,
        minutes_to_breach: minutesToBreach,
        minutes_over: minutesOver,
        first_response_at: firstResponseAt?.toISOString() ?? null,
        response_minutes: responseMinutes,
      },
    });
  }

  return result;
}
