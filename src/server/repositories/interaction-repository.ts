import { prisma } from "@/lib/db";

export interface CreateInteractionInput {
  leadId: string;
  tenantId: string;
  eventType: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
}

export async function createInteraction(input: CreateInteractionInput) {
  return prisma.interaction.create({
    data: {
      leadId: input.leadId,
      tenantId: input.tenantId,
      eventType: input.eventType,
      occurredAt: input.occurredAt,
      payload: input.payload as object,
    },
  });
}

export async function findInteractionsByLeadId(
  leadId: string,
  tenantId: string,
  options?: { limit?: number; offset?: number }
) {
  return prisma.interaction.findMany({
    where: { leadId, tenantId },
    orderBy: { occurredAt: "asc" },
    take: options?.limit ?? 100,
    skip: options?.offset ?? 0,
  });
}
