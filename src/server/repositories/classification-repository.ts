import { prisma } from "@/lib/db";
import type { LeadPriority } from "@prisma/client";

export interface CreateClassificationInput {
  leadId: string;
  tenantId: string;
  priority: LeadPriority;
  reasonTags: string[];
  modelVersion?: string;
}

/** Client type for transaction support (Prisma or tx from $transaction callback) */
type PrismaLike = { classification: { create: typeof prisma.classification.create } };

export async function createClassification(
  input: CreateClassificationInput,
  client?: PrismaLike
) {
  const c = client ?? prisma;
  return c.classification.create({
    data: {
      leadId: input.leadId,
      tenantId: input.tenantId,
      priority: input.priority,
      reasonTags: input.reasonTags as unknown as object,
      modelVersion: input.modelVersion,
    },
  });
}

export async function getLatestForLead(leadId: string, tenantId: string) {
  return prisma.classification.findFirst({
    where: { leadId, tenantId },
    orderBy: { createdAt: "desc" },
  });
}
