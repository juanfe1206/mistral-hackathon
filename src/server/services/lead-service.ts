import { prisma } from "@/lib/db";
import * as leadRepository from "@/server/repositories/lead-repository";
import * as interactionRepository from "@/server/repositories/interaction-repository";

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
  return interactionRepository.findInteractionsByLeadId(leadId, tenantId, options);
}

export { getOrCreateDefaultTenant };
