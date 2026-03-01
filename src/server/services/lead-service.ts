import { prisma } from "@/lib/db";
import * as leadRepository from "@/server/repositories/lead-repository";
import * as interactionRepository from "@/server/repositories/interaction-repository";
import * as classificationRepository from "@/server/repositories/classification-repository";
import * as auditRepository from "@/server/repositories/audit-repository";
import { classifyLead as mistralClassifyLead } from "@/server/services/mistral-classifier";

const DEFAULT_TENANT_NAME = "Default Tenant";

export interface CreateLeadInput {
  tenantId: string;
  sourceChannel: string;
  sourceExternalId: string;
  sourceMetadata: Record<string, unknown>;
  /** When provided, creates initial 'ingested' interaction with this timestamp (e.g. from WhatsApp message) */
  initialInteractionOccurredAt?: Date;
}

/**
 * Ensure a default tenant exists for MVP single-tenant support.
 * Returns the default tenant ID.
 */
async function getOrCreateDefaultTenant(): Promise<string> {
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: DEFAULT_TENANT_NAME },
    });
  }
  return tenant.id;
}

export async function createLead(input: CreateLeadInput) {
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        tenantId: input.tenantId,
        sourceChannel: input.sourceChannel,
        sourceExternalId: input.sourceExternalId,
        sourceMetadata: input.sourceMetadata as object,
      },
    });
    if (input.initialInteractionOccurredAt) {
      await tx.interaction.create({
        data: {
          leadId: lead.id,
          tenantId: input.tenantId,
          eventType: "ingested",
          occurredAt: input.initialInteractionOccurredAt,
          payload: input.sourceMetadata as object,
        },
      });
    }
    return lead;
  });
}

export async function findLeadById(id: string, tenantId: string) {
  return leadRepository.findLeadById(id, tenantId);
}

export async function findLeadsByTenant(tenantId: string, options?: { limit?: number }) {
  return leadRepository.findLeadsByTenant(tenantId, options);
}

export async function getTimelineForLead(
  leadId: string,
  tenantId: string,
  options?: { limit?: number; offset?: number }
) {
  const requestedLimit = options?.limit ?? 100;
  const requestedOffset = options?.offset ?? 0;
  const loadWindow = requestedLimit + requestedOffset;

  const [interactions, governanceEvents] = await Promise.all([
    interactionRepository.findInteractionsByLeadId(leadId, tenantId, {
      limit: loadWindow,
      offset: 0,
    }),
    auditRepository.findGovernanceEventsByLeadId(leadId, tenantId, {
      limit: loadWindow,
      offset: 0,
    }),
  ]);

  const mappedGovernanceEvents = governanceEvents.map((event) => ({
    id: event.id,
    leadId,
    tenantId: event.tenantId,
    eventType: event.eventType,
    actorId: event.actorId,
    occurredAt: event.occurredAt,
    payload: event.payload as Record<string, unknown>,
    createdAt: event.createdAt,
  }));

  return [...interactions, ...mappedGovernanceEvents]
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
    .slice(requestedOffset, requestedOffset + requestedLimit);
}

/**
 * Classify a lead via Mistral and persist the result.
 * Updates lead.priority and creates a classification record.
 * @throws Error when Mistral API fails (caller should handle for NFR10 retry)
 */
export async function classifyAndPersistForLead(leadId: string, tenantId: string) {
  const lead = await leadRepository.findLeadById(leadId, tenantId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const interactions = await interactionRepository.findInteractionsByLeadId(leadId, tenantId, {
    limit: 5,
  });
  const parts = interactions.map((i) => {
    const p = i.payload as Record<string, unknown>;
    const text = p?.text_body ?? p?.body ?? (typeof p === "object" ? i.eventType : "");
    return `${i.eventType}: ${String(text).slice(0, 200)}`;
  });
  const interactionsSummary = parts.length > 0 ? parts.join("; ") : "No interactions yet";

  const context = {
    sourceChannel: lead.sourceChannel,
    sourceMetadata: (lead.sourceMetadata ?? {}) as Record<string, unknown>,
    interactionsSummary,
  };

  const result = await mistralClassifyLead(context);

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: leadId },
      data: { priority: result.priority },
    });
    await classificationRepository.createClassification(
      {
        leadId,
        tenantId,
        priority: result.priority,
        reasonTags: result.reasonTags,
        modelVersion: "mistral-small-latest",
      },
      tx
    );
  });

  return result;
}

export { getOrCreateDefaultTenant };
