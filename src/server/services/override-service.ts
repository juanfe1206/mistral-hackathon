import { prisma } from "@/lib/db";
import type { LeadPriority } from "@prisma/client";
import * as leadRepository from "@/server/repositories/lead-repository";
import * as priorityOverrideRepository from "@/server/repositories/priority-override-repository";
import * as auditRepository from "@/server/repositories/audit-repository";

export interface OverridePriorityInput {
  leadId: string;
  tenantId: string;
  newPriority: LeadPriority;
  actorId?: string | null;
  reason?: string | null;
  correlationId?: string | null;
}

export interface OverridePriorityResult {
  leadId: string;
  previousPriority: LeadPriority;
  newPriority: LeadPriority;
}

/**
 * Override lead priority with audit trail.
 * Updates lead.priority, creates priority_override record, and persists audit event.
 * Emits priority.overridden domain event (logged).
 * @throws Error when lead not found
 */
export async function overridePriority(
  input: OverridePriorityInput
): Promise<OverridePriorityResult> {
  const lead = await leadRepository.findLeadById(input.leadId, input.tenantId);
  if (!lead) {
    throw new Error(`Lead ${input.leadId} not found`);
  }

  const previousPriority = lead.priority;
  if (previousPriority === input.newPriority) {
    return { leadId: input.leadId, previousPriority, newPriority: input.newPriority };
  }

  const occurredAt = new Date();

  await prisma.$transaction(async (tx) => {
    await leadRepository.updateLeadPriority(
      input.leadId,
      input.tenantId,
      input.newPriority,
      tx
    );
    await priorityOverrideRepository.createOverride(
      {
        leadId: input.leadId,
        tenantId: input.tenantId,
        previousPriority,
        newPriority: input.newPriority,
        actorId: input.actorId,
        reason: input.reason,
      },
      tx
    );
    await auditRepository.createAuditEvent(
      {
        tenantId: input.tenantId,
        eventType: "priority.overridden",
        actorId: input.actorId,
        payload: {
          lead_id: input.leadId,
          previous_priority: previousPriority,
          new_priority: input.newPriority,
          reason: input.reason ?? undefined,
        },
        occurredAt,
        correlationId: input.correlationId,
      },
      tx
    );
  });

  // Emit domain event (log for now, per architecture)
  console.info("[override-service] priority.overridden", {
    event_name: "priority.overridden",
    event_version: 1,
    occurred_at: occurredAt.toISOString(),
    tenant_id: input.tenantId,
    correlation_id: input.correlationId ?? undefined,
    payload: {
      lead_id: input.leadId,
      previous_priority: previousPriority,
      new_priority: input.newPriority,
      actor_id: input.actorId ?? undefined,
      reason: input.reason ?? undefined,
    },
  });

  return {
    leadId: input.leadId,
    previousPriority,
    newPriority: input.newPriority,
  };
}
