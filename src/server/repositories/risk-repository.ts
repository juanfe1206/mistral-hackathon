import { prisma } from "@/lib/db";
import type { RiskPulseStatus } from "@prisma/client";

export interface CreatePulseInput {
  leadId: string;
  tenantId: string;
  reason: string;
  detectedAt: Date;
}

/** Client type for transaction support */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TxClient = any;

export async function createPulse(input: CreatePulseInput, client?: TxClient) {
  const c = client ?? prisma;
  return c.riskPulse.create({
    data: {
      leadId: input.leadId,
      tenantId: input.tenantId,
      reason: input.reason,
      detectedAt: input.detectedAt,
      status: "active",
    },
  });
}

export async function getActivePulsesForLead(
  leadId: string,
  tenantId: string,
  client?: TxClient
) {
  const c = client ?? prisma;
  return c.riskPulse.findMany({
    where: { leadId, tenantId, status: "active" },
    orderBy: { detectedAt: "desc" },
  });
}

export async function updatePulseStatus(
  pulseId: string,
  tenantId: string,
  status: RiskPulseStatus,
  client?: TxClient
) {
  const c = client ?? prisma;
  return c.riskPulse.update({
    where: { id: pulseId, tenantId },
    data: { status },
  });
}

export async function getPulsesByTenant(
  tenantId: string,
  options?: { status?: RiskPulseStatus; limit?: number }
) {
  const where = options?.status ? { tenantId, status: options.status } : { tenantId };
  return prisma.riskPulse.findMany({
    where,
    orderBy: { detectedAt: "desc" },
    take: options?.limit ?? 100,
    include: { lead: true },
  });
}
