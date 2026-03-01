import { prisma } from "@/lib/db";
import type { LeadPriority } from "@prisma/client";

export interface CreatePriorityOverrideInput {
  leadId: string;
  tenantId: string;
  previousPriority: LeadPriority;
  newPriority: LeadPriority;
  actorId?: string | null;
  reason?: string | null;
}

/** Client type for transaction support */
type PrismaLike = {
  priorityOverride: { create: typeof prisma.priorityOverride.create };
};

export async function createOverride(
  input: CreatePriorityOverrideInput,
  client?: PrismaLike
) {
  const c = client ?? prisma;
  return c.priorityOverride.create({
    data: {
      leadId: input.leadId,
      tenantId: input.tenantId,
      previousPriority: input.previousPriority,
      newPriority: input.newPriority,
      actorId: input.actorId,
      reason: input.reason,
    },
  });
}

export async function getOverridesForLead(leadId: string, tenantId: string) {
  return prisma.priorityOverride.findMany({
    where: { leadId, tenantId },
    orderBy: { createdAt: "desc" },
  });
}
