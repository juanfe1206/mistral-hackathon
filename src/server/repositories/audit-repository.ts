import { prisma } from "@/lib/db";

export interface CreateAuditEventInput {
  tenantId: string;
  eventType: string;
  actorId?: string | null;
  payload: Record<string, unknown>;
  occurredAt: Date;
  correlationId?: string | null;
}

/** Client type for transaction support */
type PrismaLike = {
  auditEvent: { create: typeof prisma.auditEvent.create };
};

const GOVERNANCE_EVENT_TYPES = [
  "priority.overridden",
  "action.approved",
  "action.sent",
  "lifecycle.marked",
  "reply.generated",
] as const;

export async function createAuditEvent(
  input: CreateAuditEventInput,
  client?: PrismaLike
) {
  const c = client ?? prisma;
  return c.auditEvent.create({
    data: {
      tenantId: input.tenantId,
      eventType: input.eventType,
      actorId: input.actorId,
      payload: input.payload as object,
      occurredAt: input.occurredAt,
      correlationId: input.correlationId,
    },
  });
}

export async function findGovernanceEventsByLeadId(
  leadId: string,
  tenantId: string,
  options?: { limit?: number; offset?: number }
) {
  return prisma.auditEvent.findMany({
    where: {
      tenantId,
      eventType: { in: [...GOVERNANCE_EVENT_TYPES] },
      payload: {
        path: ["lead_id"],
        equals: leadId,
      },
    },
    orderBy: { occurredAt: "asc" },
    take: options?.limit ?? 200,
    skip: options?.offset ?? 0,
  });
}
