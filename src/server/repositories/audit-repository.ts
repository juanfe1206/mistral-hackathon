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
