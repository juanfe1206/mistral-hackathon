import { prisma } from "@/lib/db";
import * as leadRepository from "@/server/repositories/lead-repository";

const DEFAULT_TENANT_NAME = "Default Tenant";

export interface CreateLeadInput {
  tenantId: string;
  sourceChannel: string;
  sourceExternalId: string;
  sourceMetadata: Record<string, unknown>;
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
  return leadRepository.createLead(input);
}

export async function findLeadById(id: string, tenantId: string) {
  return leadRepository.findLeadById(id, tenantId);
}

export async function findLeadsByTenant(tenantId: string, options?: { limit?: number }) {
  return leadRepository.findLeadsByTenant(tenantId, options);
}

export { getOrCreateDefaultTenant };
