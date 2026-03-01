import { prisma } from "@/lib/db";

export interface CreateLeadInput {
  tenantId: string;
  sourceChannel: string;
  sourceExternalId: string;
  sourceMetadata: Record<string, unknown>;
}

export async function createLead(input: CreateLeadInput) {
  return prisma.lead.create({
    data: {
      tenantId: input.tenantId,
      sourceChannel: input.sourceChannel,
      sourceExternalId: input.sourceExternalId,
      sourceMetadata: input.sourceMetadata as object,
    },
  });
}

export async function findLeadById(id: string, tenantId: string) {
  return prisma.lead.findFirst({
    where: { id, tenantId },
  });
}

export async function findLeadsByTenant(tenantId: string, options?: { limit?: number }) {
  return prisma.lead.findMany({
    where: { tenantId },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    take: options?.limit ?? 100,
  });
}
