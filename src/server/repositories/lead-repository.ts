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

const latestClassificationInclude = {
  classifications: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
} as const;

const priorityOverridesInclude = {
  priorityOverrides: {
    orderBy: { createdAt: "desc" as const },
  },
} as const;

const activeRiskPulsesInclude = {
  riskPulses: {
    where: { status: "active" as const },
    orderBy: { detectedAt: "desc" as const },
    take: 5,
  },
} as const;

/** Client type for transaction support (tx from prisma.$transaction) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TxClient = any;

export async function updateLeadPriority(
  leadId: string,
  tenantId: string,
  priority: "vip" | "high" | "low",
  client?: TxClient
) {
  const c = client ?? prisma;
  return c.lead.update({
    where: { id: leadId, tenantId },
    data: { priority },
  });
}

export async function updateLeadLifecycleState(
  leadId: string,
  tenantId: string,
  lifecycleState: "default" | "at_risk" | "recovered" | "lost",
  client?: TxClient
) {
  const c = client ?? prisma;
  return c.lead.update({
    where: { id: leadId, tenantId },
    data: { lifecycleState },
  });
}

export async function findLeadById(id: string, tenantId: string) {
  return prisma.lead.findFirst({
    where: { id, tenantId },
    include: {
      ...latestClassificationInclude,
      ...priorityOverridesInclude,
      ...activeRiskPulsesInclude,
    },
  });
}

export async function findLeadsByTenant(tenantId: string, options?: { limit?: number }) {
  return prisma.lead.findMany({
    where: { tenantId },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    take: options?.limit ?? 100,
    include: latestClassificationInclude,
  });
}
