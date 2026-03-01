import { prisma } from "@/lib/db";
import * as leadRepository from "@/server/repositories/lead-repository";
import * as riskRepository from "@/server/repositories/risk-repository";
import * as interactionRepository from "@/server/repositories/interaction-repository";
import * as auditRepository from "@/server/repositories/audit-repository";

const MIN_INACTIVITY_HOURS = 1;
const MAX_INACTIVITY_HOURS = 720; // 30 days
const DEFAULT_INACTIVITY_HOURS = 24;

function parseInactivityHours(): number {
  const raw = process.env.RISK_INACTIVITY_HOURS ?? "24";
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < MIN_INACTIVITY_HOURS) {
    return DEFAULT_INACTIVITY_HOURS;
  }
  return Math.min(parsed, MAX_INACTIVITY_HOURS);
}

const RESOLVED_INACTIVITY_HOURS = parseInactivityHours();

export interface DetectAndFlagResult {
  flagged: boolean;
  pulseId?: string;
  reason?: string;
}

/**
 * Check if a lead crosses inactivity threshold and flag as at-risk.
 * Compares last interaction occurred_at vs threshold (default 24h).
 * @throws Error when lead not found
 */
export async function detectAndFlagAtRisk(
  leadId: string,
  tenantId: string,
  options?: { correlationId?: string; inactivityHours?: number }
): Promise<DetectAndFlagResult> {
  const lead = await leadRepository.findLeadById(leadId, tenantId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  // Already at-risk: no need to create duplicate pulse
  if (lead.lifecycleState === "at_risk") {
    const activePulses = await riskRepository.getActivePulsesForLead(leadId, tenantId);
    return {
      flagged: true,
      pulseId: activePulses[0]?.id,
      reason: activePulses[0]?.reason,
    };
  }

  const latestInteraction = await interactionRepository.findLatestInteractionForLead(
    leadId,
    tenantId
  );
  if (!latestInteraction) return { flagged: false };

  const hours = options?.inactivityHours ?? RESOLVED_INACTIVITY_HOURS;
  const thresholdMs = hours * 60 * 60 * 1000;
  const now = new Date();
  const elapsedMs = now.getTime() - latestInteraction.occurredAt.getTime();

  if (elapsedMs < thresholdMs) return { flagged: false };

  const reason = `No contact for ${Math.round(elapsedMs / (60 * 60 * 1000))}h (threshold: ${hours}h)`;
  const occurredAt = new Date();

  await prisma.$transaction(async (tx) => {
    const pulse = await riskRepository.createPulse(
      {
        leadId,
        tenantId,
        reason,
        detectedAt: occurredAt,
      },
      tx
    );
    await leadRepository.updateLeadLifecycleState(
      leadId,
      tenantId,
      "at_risk",
      tx
    );

    // Emit domain event (log for now, per architecture)
    console.info("[risk-service] lead.at_risk", {
      event_name: "lead.at_risk",
      event_version: 1,
      occurred_at: occurredAt.toISOString(),
      tenant_id: tenantId,
      correlation_id: options?.correlationId ?? undefined,
      payload: { lead_id: leadId, reason, pulse_id: pulse.id },
    });
  });

  const pulses = await riskRepository.getActivePulsesForLead(leadId, tenantId);
  return {
    flagged: true,
    pulseId: pulses[0]?.id,
    reason,
  };
}

export interface MarkLifecycleResult {
  leadId: string;
  lifecycleState: "recovered" | "lost";
}

/**
 * Mark lead lifecycle as Recovered or Lost. Updates lead and closes active pulses.
 * @throws Error when lead not found or lead is not at-risk
 */
export async function markLifecycle(
  leadId: string,
  tenantId: string,
  newState: "recovered" | "lost",
  options?: { correlationId?: string }
): Promise<MarkLifecycleResult> {
  const lead = await leadRepository.findLeadById(leadId, tenantId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  if (lead.lifecycleState !== "at_risk") {
    throw new Error(
      `Lead ${leadId} is not at-risk (current: ${lead.lifecycleState}). Cannot mark as ${newState}.`
    );
  }

  const pulseStatus = newState === "recovered" ? "recovered" : "lost";
  const occurredAt = new Date();

  await prisma.$transaction(async (tx) => {
    await leadRepository.updateLeadLifecycleState(leadId, tenantId, newState, tx);

    const activePulses = await riskRepository.getActivePulsesForLead(leadId, tenantId, tx);
    for (const p of activePulses) {
      await riskRepository.updatePulseStatus(p.id, tenantId, pulseStatus, tx);
    }

    await auditRepository.createAuditEvent(
      {
        tenantId,
        eventType: "lifecycle.marked",
        payload: {
          lead_id: leadId,
          lifecycle_state: newState,
          pulse_status: pulseStatus,
        },
        occurredAt,
        correlationId: options?.correlationId ?? null,
      },
      tx
    );

    // Emit domain event (log for now)
    console.info("[risk-service] lead.lifecycle_updated", {
      event_name: "lead.lifecycle_updated",
      event_version: 1,
      occurred_at: occurredAt.toISOString(),
      tenant_id: tenantId,
      correlation_id: options?.correlationId ?? undefined,
      payload: { lead_id: leadId, lifecycle_state: newState },
    });
  });

  return { leadId, lifecycleState: newState };
}
